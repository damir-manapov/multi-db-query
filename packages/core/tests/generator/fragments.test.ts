import { describe, expect, it } from 'vitest'
import { escapeIdentBT, escapeIdentDQ, safeAggFn, safeWhereFn } from '../../src/generator/fragments.js'

describe('fragments — shared SQL helpers', () => {
  // ── escapeIdentDQ ─────────────────────────────────────────

  describe('escapeIdentDQ', () => {
    it('passes through clean identifier', () => {
      expect(escapeIdentDQ('hello')).toBe('hello')
    })

    it('doubles internal double-quotes', () => {
      expect(escapeIdentDQ('x"; DROP TABLE t;--')).toBe('x""; DROP TABLE t;--')
    })
  })

  // ── escapeIdentBT ─────────────────────────────────────────

  describe('escapeIdentBT', () => {
    it('passes through clean identifier', () => {
      expect(escapeIdentBT('hello')).toBe('hello')
    })

    it('doubles internal backticks', () => {
      expect(escapeIdentBT('x`; DROP TABLE t;--')).toBe('x``; DROP TABLE t;--')
    })
  })

  // ── safeAggFn ─────────────────────────────────────────────

  describe('safeAggFn', () => {
    it('accepts valid function names', () => {
      expect(safeAggFn('count')).toBe('COUNT')
      expect(safeAggFn('SUM')).toBe('SUM')
      expect(safeAggFn('avg')).toBe('AVG')
      expect(safeAggFn('Min')).toBe('MIN')
      expect(safeAggFn('MAX')).toBe('MAX')
    })

    it('rejects unknown function — defaults to COUNT', () => {
      expect(safeAggFn('concat')).toBe('COUNT')
      expect(safeAggFn('sum); DROP TABLE orders;--')).toBe('COUNT')
    })
  })

  // ── safeWhereFn ───────────────────────────────────────────

  describe('safeWhereFn', () => {
    it('accepts levenshtein', () => {
      expect(safeWhereFn('levenshtein')).toBe('levenshtein')
    })

    it('accepts levenshtein_distance', () => {
      expect(safeWhereFn('levenshtein_distance')).toBe('levenshtein_distance')
    })

    it('accepts editDistance (case-insensitive)', () => {
      expect(safeWhereFn('editDistance')).toBe('editDistance')
    })

    it('is case-insensitive', () => {
      expect(safeWhereFn('LEVENSHTEIN')).toBe('LEVENSHTEIN')
    })

    it('rejects unknown function', () => {
      expect(() => safeWhereFn('concat')).toThrow('Unsupported where function: concat')
    })

    it('rejects injection payload', () => {
      expect(() => safeWhereFn('levenshtein); DROP TABLE orders;--')).toThrow('Unsupported where function')
    })
  })
})
