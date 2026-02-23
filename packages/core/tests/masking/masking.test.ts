import { describe, expect, it } from 'vitest'
import { applyMask } from '../../src/masking/masking.js'

describe('applyMask', () => {
  // ── null / undefined passthrough ─────────────────────────────

  it('returns null for null input', () => {
    expect(applyMask(null, 'email')).toBeNull()
  })

  it('returns undefined for undefined input', () => {
    expect(applyMask(undefined, 'full')).toBeUndefined()
  })

  // ── email masking ───────────────────────────────────────────

  describe('email', () => {
    it('masks standard email — keeps first char + TLD', () => {
      expect(applyMask('alice@example.com', 'email')).toBe('a***@***.com')
    })

    it('masks email with subdomain', () => {
      expect(applyMask('bob@mail.co.uk', 'email')).toBe('b***@***.uk')
    })

    it('returns *** for no-@ string', () => {
      expect(applyMask('invalid', 'email')).toBe('***')
    })

    it('returns fallback for @ at start', () => {
      expect(applyMask('@example.com', 'email')).toBe('***')
    })

    it('handles domain without dot', () => {
      expect(applyMask('a@localhost', 'email')).toBe('a***@***')
    })
  })

  // ── phone masking ──────────────────────────────────────────

  describe('phone', () => {
    it('masks phone — keeps country code + last 3', () => {
      expect(applyMask('+1234567890', 'phone')).toBe('+1***890')
    })

    it('masks phone without plus prefix', () => {
      expect(applyMask('1234567890', 'phone')).toBe('1***890')
    })

    it('returns *** for 3 or fewer digits', () => {
      expect(applyMask('123', 'phone')).toBe('***')
    })
  })

  // ── name masking ───────────────────────────────────────────

  describe('name', () => {
    it('masks name — keeps first and last char', () => {
      expect(applyMask('Alice', 'name')).toBe('A***e')
    })

    it('returns *** for short name', () => {
      expect(applyMask('Al', 'name')).toBe('***')
    })

    it('handles single char', () => {
      expect(applyMask('A', 'name')).toBe('***')
    })
  })

  // ── uuid masking ───────────────────────────────────────────

  describe('uuid', () => {
    it('keeps first 4 chars + ****', () => {
      expect(applyMask('550e8400-e29b-41d4-a716-446655440000', 'uuid')).toBe('550e****')
    })

    it('returns **** for short string', () => {
      expect(applyMask('abc', 'uuid')).toBe('****')
    })
  })

  // ── number masking ─────────────────────────────────────────

  describe('number', () => {
    it('returns 0', () => {
      expect(applyMask(42, 'number')).toBe(0)
    })

    it('returns 0 for decimal', () => {
      expect(applyMask(3.14, 'number')).toBe(0)
    })
  })

  // ── date masking ───────────────────────────────────────────

  describe('date', () => {
    it('truncates Date to year-01-01', () => {
      expect(applyMask(new Date('2024-06-15'), 'date')).toBe('2024-01-01')
    })

    it('truncates ISO string to year-01-01', () => {
      expect(applyMask('2024-06-15T10:00:00Z', 'date')).toBe('2024-01-01')
    })

    it('returns *** for non-date string', () => {
      expect(applyMask('not-a-date', 'date')).toBe('***')
    })
  })

  // ── full masking ───────────────────────────────────────────

  describe('full', () => {
    it('returns ***', () => {
      expect(applyMask('anything', 'full')).toBe('***')
    })

    it('returns *** for numbers', () => {
      expect(applyMask(12345, 'full')).toBe('***')
    })
  })
})
