import { describe, it, expect } from 'vitest'
import { describeCodingError } from './codingApi.js'

const httpError = (status, data) => ({ response: { status, data } })

describe('describeCodingError', () => {
  it('429: shows a friendly rate-limit message', () => {
    const message = describeCodingError(httpError(429, { detail: 'Request was throttled.' }))
    expect(message).toContain('Too many submissions')
  })

  it('400 expired attempt: mentions the expiry', () => {
    const message = describeCodingError(
      httpError(400, { detail: 'This attempt has expired.' })
    )
    expect(message.toLowerCase()).toContain('expired')
  })

  it('400 inactive attempt: tells the student to start again', () => {
    const message = describeCodingError(
      httpError(400, { detail: 'Attempt is not active.' })
    )
    expect(message).toContain('no longer active')
  })

  it('404: explains the question is not available', () => {
    const message = describeCodingError(httpError(404, { detail: 'Not found.' }))
    expect(message).toBe('This coding question is not available for your attempt.')
  })

  it('network error (no response): shows a connection message', () => {
    expect(describeCodingError(new Error('Network Error'))).toBe(
      'Network error. Check your connection and try again.'
    )
    expect(describeCodingError(undefined)).toBe(
      'Network error. Check your connection and try again.'
    )
  })

  it('5xx: shows a server problem message', () => {
    expect(describeCodingError(httpError(503, { detail: 'Service unavailable' }))).toBe(
      'The server ran into a problem. Please try again in a moment.'
    )
    expect(describeCodingError(httpError(500, null))).toBe(
      'The server ran into a problem. Please try again in a moment.'
    )
  })
})
