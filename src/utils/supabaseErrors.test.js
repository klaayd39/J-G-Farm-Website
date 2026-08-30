import { describe, it, expect } from 'vitest'
import { isMissingColumnError } from './supabaseErrors.js'

describe('supabaseErrors', () => {
  it('detects schema cache column errors', () => {
    expect(
      isMissingColumnError({
        message: "Could not find the 'loose_kg' column of 'harvests' in the schema cache",
      })
    ).toBe(true)
  })

  it('detects classic missing column errors', () => {
    expect(
      isMissingColumnError({ message: 'column "loose_kg" of relation "harvests" does not exist' })
    ).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isMissingColumnError({ message: 'duplicate key value violates unique constraint' })).toBe(false)
  })
})
