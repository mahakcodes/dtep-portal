// All coding-question HTTP lives here (see API_CONTRACT.md, "Coding questions").
// Reuses the shared axios instance from api.js so auth/401 handling is identical.
// No mocks: every failure is surfaced to the caller.
import api from './api.js'

export const fetchCodingQuestionsForTest = async (testId) => {
  const response = await api.get(`/api/coding/tests/${testId}/questions/`)
  return response.data
}

export const fetchCodingQuestion = async (questionId) => {
  const response = await api.get(`/api/coding/questions/${questionId}/`)
  return response.data
}

// Teacher only. `body.test_id` must be a test owned by the caller.
// Do not send a client-side `order`: the server assigns it.
export const createCodingQuestion = async (body) => {
  const response = await api.post('/api/coding/questions/', body)
  return response.data
}

// Teacher only, owning teacher. Do not send `test_id` (the question cannot be moved).
// When `test_cases` is present it replaces the whole list.
export const updateCodingQuestion = async (questionId, body) => {
  const response = await api.patch(`/api/coding/questions/${questionId}/`, body)
  return response.data
}

// Student: the latest coding submission per question for one attempt.
export const fetchCodingSubmissionsForAttempt = async (attemptId) => {
  const response = await api.get('/api/coding/submissions/', {
    params: { attempt_id: attemptId },
  })
  return response.data
}

// Teacher: up to 200 submissions for one of the teacher's coding questions.
export const fetchCodingQuestionSubmissions = async (questionId) => {
  const response = await api.get(`/api/coding/questions/${questionId}/submissions/`)
  return response.data
}

export const fetchGradingCases = async (questionId, attemptId) => {
  const response = await api.get(`/api/coding/questions/${questionId}/grading-cases/`, {
    params: { attempt_id: attemptId },
  })
  return response.data
}

export const submitCodingSolution = async ({ questionId, attemptId, language, sourceCode, caseResults }) => {
  const response = await api.post('/api/coding/submissions/', {
    question_id: Number(questionId),
    attempt_id: Number(attemptId),
    language,
    source_code: sourceCode,
    case_results: caseResults,
  })
  return response.data
}

// DRF returns either {"detail": "..."} or {"field": ["message", ...]}.
function firstMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  for (const key of Object.keys(data)) {
    const value = data[key]
    if (Array.isArray(value) && value.length) return String(value[0])
    if (typeof value === 'string') return value
  }
  return ''
}

// Turns an axios error from any coding endpoint into a friendly, specific message.
export function describeCodingError(err) {
  if (!err || !err.response) {
    return 'Network error. Check your connection and try again.'
  }

  const status = err.response.status
  const raw = firstMessage(err.response.data)
  const lower = raw.toLowerCase()

  if (status === 429) {
    return 'Too many submissions in a short time. Please wait a moment and try again.'
  }
  if (status === 400) {
    if (lower.includes('expired')) return 'This attempt has expired, so it can no longer be graded.'
    if (lower.includes('not active') || lower.includes('inactive')) {
      return 'This attempt is no longer active. Please start the test again from your dashboard.'
    }
    if (lower.includes('valid integer') || lower.includes('invalid attempt')) {
      return 'We could not identify your attempt. Please reload the page and try again.'
    }
    if (lower.includes('not part of the attempt') || lower.includes('not part of the attempt test')) {
      return 'This coding question is not part of your attempt.'
    }
    if (lower.includes('published')) return 'This coding question is not available for grading yet.'
    return raw || 'The submission was rejected. Check your code and try again.'
  }
  if (status === 403) return raw || 'You do not have permission to do that.'
  if (status === 404) return 'This coding question is not available for your attempt.'
  if (status >= 500) return 'The server ran into a problem. Please try again in a moment.'
  return raw || 'Something went wrong. Please try again.'
}

// Teacher-facing variant: prefer the server's own wording, in particular the
// 409 detail shown when test_cases / max_marks / allowed_languages are edited
// after a submission already exists. Also flattens nested per-case arrays.
export function describeTeacherCodingError(err) {
  if (!err || !err.response) {
    return 'Network error. Check your connection and try again.'
  }

  const status = err.response.status
  const data = err.response.data

  if (status === 409) {
    return (
      (data && typeof data.detail === 'string' && data.detail) ||
      'Test cases, max_marks, and allowed_languages cannot be changed after a submission exists.'
    )
  }

  const parts = []
  if (typeof data === 'string') {
    parts.push(data)
  } else if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') parts.push(data.detail)
    for (const key of Object.keys(data)) {
      if (key === 'detail') continue
      const value = data[key]
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === 'string') parts.push(entry)
          else if (entry && typeof entry === 'object') parts.push(...flattenStrings(entry))
        }
      } else if (typeof value === 'string') {
        parts.push(value)
      }
    }
  }

  const message = parts.filter(Boolean).join(' ')
  if (message) return message
  if (status === 401) return 'Your session expired. Please sign in again.'
  if (status === 403) return 'Teacher access is required.'
  if (status === 404) return 'Not found.'
  if (status >= 500) return 'The server ran into a problem. Please try again in a moment.'
  return 'Something went wrong. Please try again.'
}

function flattenStrings(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(flattenStrings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenStrings)
  return []
}
