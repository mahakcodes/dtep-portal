export const COUNTING_TYPES = new Set(['TAB_SWITCH', 'FULLSCREEN_EXIT'])
export const INFORMATIONAL_TYPE = 'COPY_PASTE'

export class AwayEpisodeTracker {
  constructor() {
    this.away = false
    this.lastVisibilityAt = Number.NEGATIVE_INFINITY
  }

  visibility(hidden, now) {
    this.lastVisibilityAt = now
    if (!hidden) {
      this.away = false
      return false
    }
    return this.markAway()
  }

  blur(now) {
    if (now - this.lastVisibilityAt < 1000) return false
    return this.markAway()
  }

  focus() {
    this.away = false
  }

  markAway() {
    if (this.away) return false
    this.away = true
    return true
  }
}

export function createEventQueue(attemptId, storage = globalThis.localStorage) {
  const key = `dtep_anticheat_queue_v1:${attemptId}`
  const read = () => {
    try {
      const parsed = JSON.parse(storage?.getItem(key) || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  const write = (events) => {
    try {
      storage?.setItem(key, JSON.stringify(events))
    } catch {
      // Queueing is best-effort when browser storage is unavailable.
    }
  }
  return {
    list: read,
    enqueue(event) {
      const events = read()
      events.push(event)
      write(events)
    },
    removeFirst() {
      const events = read()
      events.shift()
      write(events)
    },
  }
}

export function makeTimerAnchor(clock, performanceNow) {
  const serverTime = Date.parse(clock?.server_time)
  const deadline = clock?.deadline ? Date.parse(clock.deadline) : null
  if (!Number.isFinite(serverTime) || !Number.isFinite(deadline)) return null
  return { serverTime, deadline, performanceNow }
}

export function remainingFromAnchor(anchor, performanceNow) {
  if (!anchor) return null
  const estimatedServerNow = anchor.serverTime + Math.max(0, performanceNow - anchor.performanceNow)
  return Math.max(0, Math.floor((anchor.deadline - estimatedServerNow) / 1000))
}

export function decideInternalPaste({ owner, target, internalText }) {
  const allowed = Boolean(owner && owner === target && typeof internalText === 'string')
  return { allowed, text: allowed ? internalText : '' }
}
