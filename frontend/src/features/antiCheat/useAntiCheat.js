import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAttemptClock, logViolation } from '../../services/api.js'
import {
  AwayEpisodeTracker,
  COUNTING_TYPES,
  createEventQueue,
  INFORMATIONAL_TYPE,
  makeTimerAnchor,
  remainingFromAnchor,
} from './logic.js'

export default function useAntiCheat({ attemptId, active, clientSessionId, containerRef, onTerminated, onFinalized }) {
  const [count, setCount] = useState(0)
  const [max, setMax] = useState(3)
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const [deadline, setDeadline] = useState(null)
  const [offline, setOffline] = useState(!globalThis.navigator?.onLine)
  const [toast, setToast] = useState('')
  const [fullscreenExited, setFullscreenExited] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const queueRef = useRef(null)
  const flushingRef = useRef(false)
  const retryTimerRef = useRef(null)
  const timerAnchorRef = useRef(null)
  const episodeRef = useRef(new AwayEpisodeTracker())
  const suppressUntilRef = useRef(0)
  const callbacksRef = useRef({ onTerminated, onFinalized })

  useEffect(() => {
    callbacksRef.current = { onTerminated, onFinalized }
  }, [onTerminated, onFinalized])

  const syncClock = useCallback(async () => {
    if (!attemptId) return null
    const clock = await fetchAttemptClock(attemptId)
    setCount(clock.violations?.count ?? 0)
    setMax(clock.violations?.max ?? 3)
    setDeadline(clock.deadline || null)
    timerAnchorRef.current = makeTimerAnchor(clock, performance.now())
    setRemainingSeconds(clock.deadline ? remainingFromAnchor(timerAnchorRef.current, performance.now()) : null)
    if (clock.status === 'TERMINATED') callbacksRef.current.onTerminated?.()
    else if (clock.status === 'SUBMITTED') callbacksRef.current.onFinalized?.()
    return clock
  }, [attemptId])

  const flushQueue = useCallback(async () => {
    if (!attemptId || !queueRef.current || flushingRef.current || !navigator.onLine) return
    flushingRef.current = true
    setOffline(false)
    try {
      while (queueRef.current.list().length && navigator.onLine) {
        const [event] = queueRef.current.list()
        try {
          const response = await logViolation({
            attempt_id: attemptId,
            violation_type: event.violation_type,
            metadata: event.metadata,
            client_session_id: clientSessionId,
          })
          queueRef.current.removeFirst()
          setCount(response.count ?? response.violations_count ?? 0)
          setMax(response.max ?? 3)
          if (response.status === 'TERMINATED') callbacksRef.current.onTerminated?.()
          else if (response.status === 'SUBMITTED') callbacksRef.current.onFinalized?.()
        } catch (error) {
          const code = error?.response?.data?.code
          if (code === 'attempt_terminated' || code === 'attempt_finalized' || code === 'attempt_expired') {
            queueRef.current.removeFirst()
            await syncClock().catch(() => {})
            continue
          }
          if (error?.response?.status === 429) {
            setOffline(false)
            window.clearTimeout(retryTimerRef.current)
            retryTimerRef.current = window.setTimeout(() => void flushQueue(), 60000)
            return
          }
          setOffline(true)
          return
        }
        if (queueRef.current.list().length && navigator.onLine) {
          await new Promise((resolve) => window.setTimeout(resolve, 2100))
        }
      }
      setOffline(!navigator.onLine)
    } finally {
      flushingRef.current = false
    }
  }, [attemptId, clientSessionId, syncClock])

  const queueEvent = useCallback((violation_type, metadata = {}) => {
    if (!attemptId) return
    if (!COUNTING_TYPES.has(violation_type) && violation_type !== INFORMATIONAL_TYPE) return
    queueRef.current?.enqueue({ violation_type, metadata, queued_at: new Date().toISOString() })
    if (!navigator.onLine) setOffline(true)
    else void flushQueue()
  }, [attemptId, flushQueue])

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }, [])

  useEffect(() => {
    if (!attemptId) return undefined
    queueRef.current = createEventQueue(attemptId)
    void syncClock().catch(() => setOffline(true))
    void flushQueue()
    const syncEveryMinute = window.setInterval(() => void syncClock().catch(() => setOffline(true)), 60000)
    const visibility = () => {
      if (document.visibilityState === 'visible') void syncClock().catch(() => setOffline(true))
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(syncEveryMinute)
      window.clearTimeout(retryTimerRef.current)
      document.removeEventListener('visibilitychange', visibility)
      queueRef.current = null
    }
  }, [attemptId, syncClock, flushQueue])

  useEffect(() => {
    if (!active || !timerAnchorRef.current) return undefined
    const id = window.setInterval(() => {
      setRemainingSeconds(remainingFromAnchor(timerAnchorRef.current, performance.now()))
    }, 1000)
    return () => window.clearInterval(id)
  }, [active, deadline])

  useEffect(() => {
    if (!attemptId) return undefined
    const online = () => {
      setOffline(false)
      void flushQueue()
      void syncClock().catch(() => setOffline(true))
    }
    const offlineEvent = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offlineEvent)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offlineEvent)
    }
  }, [attemptId, flushQueue, syncClock])

  useEffect(() => {
    if (!active) return undefined
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      suppressUntilRef.current = performance.now() + 2000
    }
    const isSuppressed = () => performance.now() < suppressUntilRef.current
    const away = () => {
      if (!isSuppressed()) queueEvent('TAB_SWITCH', { source: 'window_blur' })
    }
    const visibility = () => {
      const now = performance.now()
      const shouldCount = episodeRef.current.visibility(document.hidden, now)
      if (document.hidden && shouldCount && !isSuppressed()) queueEvent('TAB_SWITCH', { source: 'tab_hidden' })
    }
    const blur = () => {
      const now = performance.now()
      if (episodeRef.current.blur(now) && !isSuppressed()) away()
    }
    const focus = () => episodeRef.current.focus()
    const fullscreen = () => {
      const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFullscreen)
      if (isFullscreen) {
        suppressUntilRef.current = performance.now() + 2000
        setFullscreenExited(false)
      } else if (!isSuppressed()) {
        setFullscreenExited(true)
        queueEvent('FULLSCREEN_EXIT', { source: 'fullscreen_exit' })
      }
    }
    const blockInput = (event, action) => {
      if (event.defaultPrevented) return
      const target = event.target
      const internalEditor = target?.closest?.('.monaco-editor') || target?.closest?.('textarea')
      if (internalEditor && ['Copy', 'Cut', 'Paste'].includes(action)) return
      event.preventDefault()
      showToast(`${action} is disabled during the test.`)
      queueEvent('COPY_PASTE', { action })
    }
    const contextMenu = (event) => blockInput(event, 'Right-click')
    const dragStart = (event) => blockInput(event, 'Dragging')
    const copy = (event) => blockInput(event, 'Copy')
    const cut = (event) => blockInput(event, 'Cut')
    const paste = (event) => blockInput(event, 'Paste')
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', blur)
    window.addEventListener('focus', focus)
    document.addEventListener('fullscreenchange', fullscreen)
    document.addEventListener('webkitfullscreenchange', fullscreen)
    fullscreen()
    document.addEventListener('contextmenu', contextMenu, true)
    document.addEventListener('dragstart', dragStart, true)
    document.addEventListener('copy', copy, true)
    document.addEventListener('cut', cut, true)
    document.addEventListener('paste', paste, true)
    const beforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', focus)
      document.removeEventListener('fullscreenchange', fullscreen)
      document.removeEventListener('webkitfullscreenchange', fullscreen)
      document.removeEventListener('contextmenu', contextMenu, true)
      document.removeEventListener('dragstart', dragStart, true)
      document.removeEventListener('copy', copy, true)
      document.removeEventListener('cut', cut, true)
      document.removeEventListener('paste', paste, true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [active, queueEvent, showToast])

  const reenterFullscreen = useCallback(async () => {
    const element = containerRef?.current || document.documentElement
    try {
      if (element.requestFullscreen) await element.requestFullscreen()
      else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen()
    } catch {
      return false
    }
    const entered = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
    if (entered) {
      suppressUntilRef.current = performance.now() + 2000
      setFullscreenExited(false)
    }
    return entered
  }, [containerRef])

  return {
    count, max, remainingSeconds, deadline, offline, toast, fullscreenExited, isFullscreen,
    queueEvent, syncClock, flushQueue, showToast, reenterFullscreen,
  }
}
