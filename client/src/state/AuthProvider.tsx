import * as React from 'react'
import { toast } from 'sonner'
import {
  ApiError,
  authApi,
  coursesApi,
  meApi,
  onSessionExpired,
  onSessionRefreshed,
  refreshSession,
  setAccessToken,
  type ApiCourse,
  type ApiDepartment,
  type CurrentUser,
} from '@/lib/api'

type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

type AuthContextValue = {
  status: AuthStatus
  user: CurrentUser | null
  /** The whole catalog, fetched once. Public, so it loads before sign-in. */
  courses: ApiCourse[]
  coursesLoading: boolean
  coursesError: string | null
  departments: ApiDepartment[]
  myCourses: ApiCourse[]
  signIn: (input: { email: string; password: string }) => Promise<CurrentUser>
  signInDemo: () => Promise<CurrentUser>
  signUp: (input: { name: string; email: string; password: string }) => Promise<CurrentUser>
  signOut: () => Promise<void>
  updateProfile: (input: {
    name?: string
    major?: string
    gradYear?: number
    studyProfileVisible?: boolean
    courseCodes?: string[]
  }) => Promise<CurrentUser>
  addCourse: (courseId: string) => Promise<void>
  removeCourse: (courseId: string) => Promise<void>
  createCourse: (input: {
    code: string
    title: string
    description?: string
    departmentId: string
  }) => Promise<ApiCourse>
  loadDepartments: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/**
 * Session and catalog only.
 *
 * Everything else — requests, circles, sessions, questions — is fetched by the
 * page that shows it, through the hooks in src/hooks. That split is deliberate:
 * the old single store had to be invalidated by hand after every mutation, and
 * held a parallel fake copy of the product for demo mode. There is no demo mode
 * now; the seeded demo account is a real account.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading')
  const [user, setUser] = React.useState<CurrentUser | null>(null)
  const [courses, setCourses] = React.useState<ApiCourse[]>([])
  const [coursesLoading, setCoursesLoading] = React.useState(true)
  const [coursesError, setCoursesError] = React.useState<string | null>(null)
  const [departments, setDepartments] = React.useState<ApiDepartment[]>([])
  /* Auth requests can finish out of order: the boot refresh may still be in
     flight when somebody submits the login form. Only the newest operation is
     allowed to change React's session state, or a late 401 from that stale
     refresh can immediately undo a successful login. */
  const authOperation = React.useRef(0)

  /* The fetch layer owns the token and the single-flight refresh; these two
     callbacks are how it tells React that the session changed. */
  React.useEffect(() => {
    onSessionRefreshed(({ user: nextUser }) => {
      setUser(nextUser)
      setStatus('signedIn')
    })

    onSessionExpired(() => {
      setUser(null)
      setStatus('signedOut')
    })
  }, [])

  React.useEffect(() => {
    let active = true

    coursesApi
      .list()
      .then(({ courses: list }) => {
        if (!active) return
        setCourses(list)
        setCoursesError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setCoursesError(error instanceof Error ? error.message : 'Could not load courses')
      })
      .finally(() => {
        if (active) setCoursesLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  /* Safe under StrictMode: refreshSession() shares one in-flight promise, so the
     double invocation resolves to the same rotation instead of racing it. */
  React.useEffect(() => {
    let active = true
    const operation = ++authOperation.current

    refreshSession()
      .then(({ user: nextUser }) => {
        if (!active || operation !== authOperation.current) return
        setUser(nextUser)
        setStatus('signedIn')
      })
      .catch(() => {
        if (!active || operation !== authOperation.current) return
        setUser(null)
        setStatus('signedOut')
      })

    return () => {
      active = false
    }
  }, [])

  const myCourses = React.useMemo(() => user?.courses ?? [], [user])

  const value = React.useMemo<AuthContextValue>(() => {
    const applySession = (payload: { user: CurrentUser; accessToken: string }) => {
      setAccessToken(payload.accessToken)
      setUser(payload.user)
      setStatus('signedIn')
      return payload.user
    }

    /* Course lists are folded in rather than replaced: a course created
       mid-session has to appear in the catalog or nothing downstream sees it. */
    const upsertCourses = (incoming: ApiCourse[]) =>
      setCourses((current) => {
        const byId = new Map(current.map((course) => [course.id, course]))
        for (const course of incoming) byId.set(course.id, course)
        return [...byId.values()].toSorted((a, b) => a.code.localeCompare(b.code))
      })

    return {
      status,
      user,
      courses,
      coursesLoading,
      coursesError,
      departments,
      myCourses,

      signIn: async (input) => {
        const operation = ++authOperation.current
        const payload = await authApi.login(input)
        if (operation === authOperation.current) applySession(payload)
        return payload.user
      },
      signInDemo: async () => {
        const operation = ++authOperation.current
        const payload = await authApi.demo()
        if (operation === authOperation.current) applySession(payload)
        return payload.user
      },
      signUp: async (input) => {
        const operation = ++authOperation.current
        const payload = await authApi.signup(input)
        if (operation === authOperation.current) applySession(payload)
        return payload.user
      },

      signOut: async () => {
        ++authOperation.current
        await authApi.logout()
        setUser(null)
        setStatus('signedOut')
      },

      updateProfile: async (input) => {
        const { user: next } = await authApi.updateMe(input)
        setUser(next)
        return next
      },

      addCourse: async (courseId) => {
        try {
          const { user: next } = await meApi.addCourse(courseId)
          setUser(next)
          toast.success('Course added')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not add course')
          throw error
        }
      },

      removeCourse: async (courseId) => {
        try {
          const { user: next } = await meApi.removeCourse(courseId)
          setUser(next)
          toast('Course removed')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not remove course')
          throw error
        }
      },

      createCourse: async (input) => {
        try {
          const { course } = await coursesApi.create(input)
          upsertCourses([course])
          toast.success(`${course.code} added to the catalog`)
          return course
        } catch (error) {
          /* 409 means someone already created it. Adopting the existing course is
             the whole anti-duplication guard — surfacing an error here is what
             would push students into inventing a variant code. */
          if (error instanceof ApiError && error.status === 409) {
            const existing = (error.data as { course?: ApiCourse } | undefined)?.course
            if (existing) {
              upsertCourses([existing])
              return existing
            }
          }

          toast.error(error instanceof Error ? error.message : 'Could not add course')
          throw error
        }
      },

      loadDepartments: async () => {
        if (departments.length > 0) return
        try {
          const { departments: list } = await coursesApi.listDepartments()
          setDepartments(list)
        } catch {
          /* The add-course form falls back to a blocked state on its own. */
        }
      },

      refreshUser: async () => {
        const { user: next } = await authApi.me()
        setUser(next)
      },
    }
  }, [status, user, courses, coursesLoading, coursesError, departments, myCourses])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
