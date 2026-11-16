import { describe, it, expect } from 'vitest'
import { ScheduleSchema } from '../schemas/schedule.schema'

// Shape the API persists for an auto-generated Spotify playlist reference
// (see api/src/spotify/spotify.service.ts) and returns on schedule reads.
const autoReference = {
  url: 'https://open.spotify.com/playlist/6wphMiWl7k77rBP4CfZhSa',
  name: 'Spotify 001 — 2026-11-12',
  source: 'spotify-auto',
  syncedAt: '2026-11-12T15:25:13.465Z',
  tracksHash: '08eedd91',
  syncedByName: null, // syncing user has no nickname in the DB
}

const schedule = {
  id: 2,
  title: 'Spotify 001',
  date: '2026-11-12',
  references: [autoReference],
}

describe('ScheduleSchema', () => {
  it('accepts an auto-generated playlist reference with null metadata', () => {
    // Regression: `syncedByName: null` used to fail validation, silently
    // aborting the form submit (no request, no visible error).
    const result = ScheduleSchema.safeParse(schedule)
    expect(result.success).toBe(true)
  })

  it('accepts missing null metadata fields', () => {
    const result = ScheduleSchema.safeParse({
      ...schedule,
      references: [{ ...autoReference, syncedByName: undefined }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts regular (user-added) references', () => {
    const result = ScheduleSchema.safeParse({
      ...schedule,
      references: [{ url: 'https://youtube.com/watch?v=abc', name: 'Recording' }],
    })
    expect(result.success).toBe(true)
  })

  it('still rejects an invalid reference url', () => {
    const result = ScheduleSchema.safeParse({
      ...schedule,
      references: [{ url: '', name: 'Recording' }],
    })
    expect(result.success).toBe(false)
  })
})
