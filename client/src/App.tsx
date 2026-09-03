import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, BrandedSplash } from '@/layouts/AppShell'
import { GroupSessionsRedirect, GroupToCircleRedirect } from '@/pages/LegacyRedirect'

/* Route-level code splitting. The landing/auth bundle is what an anonymous
   visitor pays for, and it no longer has to carry the whole application. */
const Landing = lazy(() => import('@/pages/Landing'))
const Signup = lazy(() => import('@/pages/Signup'))
const Login = lazy(() => import('@/pages/Login'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))

const Home = lazy(() => import('@/pages/Home'))
const Courses = lazy(() => import('@/pages/Courses'))
const CourseLayout = lazy(() => import('@/pages/course/CourseLayout'))
const CourseOverview = lazy(() => import('@/pages/course/CourseOverview'))
const CourseStudy = lazy(() => import('@/pages/course/CourseStudy'))
const CourseQuestions = lazy(() => import('@/pages/course/CourseQuestions'))
const CoursePeople = lazy(() => import('@/pages/course/CoursePeople'))
const StudyRequestNew = lazy(() => import('@/pages/StudyRequestNew'))
const StudyRequestDetail = lazy(() => import('@/pages/StudyRequestDetail'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const SessionDetail = lazy(() => import('@/pages/SessionDetail'))
const Create = lazy(() => import('@/pages/Create'))
const CircleNew = lazy(() => import('@/pages/circle/CircleNew'))
const CircleDetail = lazy(() => import('@/pages/circle/CircleDetail'))
const Profile = lazy(() => import('@/pages/Profile'))

export default function App() {
  return (
    <Suspense fallback={<BrandedSplash />}>
      <Routes>
        {/* ------------------------------------------------------ public */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ------------------------------------------------- application */}
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/courses" element={<Courses />} />

          <Route path="/courses/:slug" element={<CourseLayout />}>
            <Route index element={<CourseOverview />} />
            <Route path="study" element={<CourseStudy />} />
            <Route path="questions" element={<CourseQuestions />} />
            <Route path="questions/:questionId" element={<CourseQuestions />} />
            <Route path="people" element={<CoursePeople />} />
          </Route>

          <Route path="/study-requests/new" element={<StudyRequestNew />} />
          <Route path="/study-requests/:requestId" element={<StudyRequestDetail />} />

          <Route path="/schedule" element={<Schedule />} />
          <Route path="/sessions/:sessionId" element={<SessionDetail />} />

          <Route path="/create" element={<Create />} />
          <Route path="/circles/new" element={<CircleNew />} />
          <Route path="/circles/:circleId" element={<CircleDetail />} />

          <Route path="/profile" element={<Profile />} />

          {/* ------------------------------------------ legacy deep links */}
          <Route path="/discover" element={<Navigate to="/courses" replace />} />
          <Route path="/my-groups" element={<Navigate to="/home" replace />} />
          <Route path="/sessions" element={<Navigate to="/schedule" replace />} />
          <Route path="/groups/new" element={<Navigate to="/create" replace />} />
          <Route path="/groups/:groupId" element={<GroupToCircleRedirect />} />
          <Route path="/groups/:groupId/chat" element={<GroupToCircleRedirect />} />
          <Route path="/groups/:groupId/members" element={<GroupToCircleRedirect />} />
          <Route path="/groups/:groupId/sessions" element={<GroupSessionsRedirect />} />
          <Route path="/groups/:groupId/sessions/new" element={<GroupSessionsRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
