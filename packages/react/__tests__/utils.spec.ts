import { describe, test, expect } from 'vitest'
import { areHookDepsEqual } from '../src/utils'

describe('utils', () => {
  test('areHookDepsEqual', () => {
    expect(areHookDepsEqual(undefined, [])).toBe(false)
    expect(areHookDepsEqual([], undefined)).toBe(false)
    expect(areHookDepsEqual([], [undefined])).toBe(false)
    expect(areHookDepsEqual([0], [1])).toBe(false)
    expect(areHookDepsEqual([], [])).toBe(true)
    expect(areHookDepsEqual([0], [0])).toBe(true)
  })
})
