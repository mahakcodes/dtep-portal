import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AwayEpisodeTracker,
  createEventQueue,
  decideInternalPaste,
  makeTimerAnchor,
  remainingFromAnchor,
} from './logic.js'

describe('anti-cheat helpers', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts a hidden/blur episode once and resets after focus', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const tracker = new AwayEpisodeTracker()
    expect(tracker.visibility(true, Date.now())).toBe(true)
    expect(tracker.blur(Date.now() + 100)).toBe(false)
    expect(tracker.visibility(false, Date.now() + 500)).toBe(false)
    vi.advanceTimersByTime(1500)
    expect(tracker.blur(Date.now())).toBe(true)
    tracker.focus()
    expect(tracker.blur(Date.now())).toBe(true)
  })

  it('debounces blur within one second of a visibility event', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const tracker = new AwayEpisodeTracker()
    expect(tracker.visibility(false, Date.now())).toBe(false)
    vi.advanceTimersByTime(999)
    expect(tracker.blur(Date.now())).toBe(false)
    vi.advanceTimersByTime(1)
    expect(tracker.blur(Date.now())).toBe(true)
  })

  it('persists and dequeues retry events by attempt', () => {
    const values = new Map()
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    }
    const queue = createEventQueue(42, storage)
    queue.enqueue({ violation_type: 'TAB_SWITCH' })
    expect(createEventQueue(42, storage).list()).toEqual([{ violation_type: 'TAB_SWITCH' }])
    queue.removeFirst()
    expect(queue.list()).toEqual([])
  })

  it('allows paste only from the same editor internal clipboard', () => {
    expect(decideInternalPaste({ owner: 'editor-a', target: 'editor-a', internalText: 'copied' }))
      .toEqual({ allowed: true, text: 'copied' })
    expect(decideInternalPaste({ owner: 'editor-a', target: 'editor-b', internalText: 'copied' }))
      .toEqual({ allowed: false, text: '' })
    expect(decideInternalPaste({ owner: null, target: 'editor-a', internalText: null }))
      .toEqual({ allowed: false, text: '' })
  })

  it('uses a performance clock anchor and leaves durationless tests untimed', () => {
    const performanceStart = performance.now()
    const anchor = makeTimerAnchor({
      server_time: '2026-01-01T00:00:00Z',
      deadline: '2026-01-01T00:01:00Z',
    }, performanceStart)
    expect(remainingFromAnchor(anchor, performanceStart)).toBe(60)
    expect(remainingFromAnchor(anchor, performanceStart + 10000)).toBe(50)
    expect(makeTimerAnchor({ server_time: '2026-01-01T00:00:00Z', deadline: null }, 0)).toBeNull()
  })
})
