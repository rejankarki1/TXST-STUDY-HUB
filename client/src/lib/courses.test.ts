import { describe, expect, it } from 'vitest'
import { courseBySlug, courseHref, courseSlug, courseTab, matchesCourseQuery } from './courses'
import { course } from '@/test/factories'

describe('courseSlug', () => {
  it('lowercases and hyphenates a course code', () => {
    expect(courseSlug('CS 2308')).toBe('cs-2308')
  })

  it('collapses repeated whitespace so one code has one slug', () => {
    expect(courseSlug('MATH   2471')).toBe('math-2471')
  })

  it('handles a trailing letter suffix', () => {
    expect(courseSlug('BIO 1330A')).toBe('bio-1330a')
  })
})

describe('courseBySlug', () => {
  const catalog = [course(), course({ id: 'c2', code: 'MATH 2358', title: 'Discrete Math' })]

  it('round-trips a code through its slug', () => {
    expect(courseBySlug(catalog, 'math-2358')?.id).toBe('c2')
  })

  it('returns undefined for a slug nothing matches', () => {
    expect(courseBySlug(catalog, 'phys-9999')).toBeUndefined()
  })
})

describe('courseHref', () => {
  it('builds the hub route', () => {
    expect(courseHref({ code: 'CS 3358' })).toBe('/courses/cs-3358')
  })

  it('builds a tab route under the hub', () => {
    expect(courseTab({ code: 'CS 3358' }, 'questions')).toBe('/courses/cs-3358/questions')
  })
})

describe('matchesCourseQuery', () => {
  const target = { code: 'CS 3358', title: 'Data Structures and Algorithms' }

  it('matches on code, case-insensitively', () => {
    expect(matchesCourseQuery(target, 'cs 33')).toBe(true)
  })

  it('matches on title', () => {
    expect(matchesCourseQuery(target, 'algorithms')).toBe(true)
  })

  it('matches everything when the query is blank', () => {
    expect(matchesCourseQuery(target, '   ')).toBe(true)
  })

  it('rejects a non-match', () => {
    expect(matchesCourseQuery(target, 'calculus')).toBe(false)
  })
})
