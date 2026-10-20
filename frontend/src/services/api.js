import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStoredToken = () => {
  return localStorage.getItem('dtep_token') || sessionStorage.getItem('dtep_token') || null;
};

export const clearStoredSession = () => {
  localStorage.removeItem('dtep_token');
  localStorage.removeItem('dtep_user');
  localStorage.removeItem('dtep_remember');
  sessionStorage.removeItem('dtep_token');
  sessionStorage.removeItem('dtep_user');
};

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearStoredSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Normalize test payload for frontend consumers (preserves real backend data, no mock fallback)
export const normalizeTestPayload = (testId, payload) => {
  if (!payload) return null;

  const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];
  const questions = rawQuestions.map((question, index) => {
    const qType = (question.question_type || question.type || 'MCQ').toUpperCase();
    const isDescriptive = qType === 'DESCRIPTIVE' || qType === 'SUBJECTIVE';

    const options = Array.isArray(question.options)
      ? question.options.map((opt, optIdx) => ({
          id: opt.id,
          text: opt.text || opt.label || `Option ${String.fromCharCode(65 + optIdx)}`,
          is_correct: opt.is_correct ?? false,
        }))
      : [];

    return {
      ...question,
      id: question.id,
      number: question.order || index + 1,
      text: question.text || question.question_text || `Question ${index + 1}`,
      question_type: isDescriptive ? 'DESCRIPTIVE' : 'MCQ',
      type: isDescriptive ? 'subjective' : 'mcq',
      options: isDescriptive ? [] : options,
      correct_option_id: question.correct_option_id ?? options.find((o) => o.is_correct)?.id ?? null,
      model_answer: question.model_answer || question.modelAnswer || '',
      marks: Number(question.marks) || (isDescriptive ? 5 : 2),
    };
  });

  const totalMarks =
    payload.total_marks ??
    payload.totalMarks ??
    questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return {
    ...payload,
    id: payload.id,
    title: payload.title || 'Untitled Test',
    description: payload.description || '',
    duration_minutes: Number(payload.duration_minutes) || 30,
    totalMarks,
    total_marks: totalMarks,
    questions,
    instructions: payload.instructions || ['Read each question carefully before answering.'],
    is_published: payload.is_published ?? true,
    test_type: payload.test_type || 'standard',
    scheduled_date: payload.scheduled_date || '',
    scheduled_time: payload.scheduled_time || '',
  };
};

// Auth APIs
export const loginUser = async (credentials) => {
  const response = await api.post('/api/users/login/', credentials);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get('/api/users/profile/');
  return response.data;
};

// Teacher & Student Management APIs
export const fetchTeachers = async () => {
  const response = await api.get('/api/users/teachers/');
  return response.data;
};

export const createTeacher = async (data) => {
  const response = await api.post('/api/users/teachers/', data);
  return response.data;
};

export const fetchStudents = async () => {
  const response = await api.get('/api/users/students/');
  return response.data;
};

export const createStudent = async (data) => {
  const response = await api.post('/api/users/students/', data);
  return response.data;
};

export const assignStudentToTeacher = async ({ student_id, teacher_id }) => {
  const response = await api.post('/api/users/assign-student/', {
    student_id: Number(student_id),
    teacher_id: Number(teacher_id),
  });
  return response.data;
};

export const unassignStudentFromTeacher = async ({ student_id, teacher_id }) => {
  const response = await api.post('/api/users/unassign-student/', {
    student_id: Number(student_id),
    teacher_id: Number(teacher_id),
  });
  return response.data;
};

export const assignSubjectToTeacher = async (teacherId, subjectId) => {
  const response = await api.post(`/api/users/teachers/${Number(teacherId)}/assign-subject/`, {
    subject_id: Number(subjectId),
  });
  return response.data;
};

export const enrollStudentInSubject = async (studentId, subjectId) => {
  const response = await api.post(`/api/users/students/${Number(studentId)}/enroll/`, {
    subject_id: Number(subjectId),
  });
  return response.data;
};

// Test APIs
export const fetchTests = async () => {
  const response = await api.get('/api/tests/');
  return response.data;
};

export const fetchStudentTests = async () => {
  const response = await api.get('/api/tests/');
  return response.data;
};

export const fetchTestDetails = async (testId) => {
  const response = await api.get(`/api/tests/${testId}/`);
  return normalizeTestPayload(testId, response.data);
};

export const createTest = async (testData) => {
  const response = await api.post('/api/tests/', testData);
  return response.data;
};

export const updateTest = async (testId, testData) => {
  const response = await api.patch(`/api/tests/${testId}/`, testData);
  return response.data;
};

export const publishTest = async (testId, isPublished = true) => {
  const response = await api.patch(`/api/tests/${testId}/`, {
    is_published: isPublished,
  });
  return response.data;
};

export const deleteTest = async (testId) => {
  const response = await api.delete(`/api/tests/${testId}/`);
  return response.data;
};

// Evaluation & Attempt APIs
export const startTest = async ({ test_id, client_session_id }) => {
  const response = await api.post('/api/evaluations/start/', {
    test_id: Number(test_id),
    client_session_id: client_session_id || '',
  });
  return response.data;
};

export const saveResponse = async ({
  attempt_id,
  question_id,
  selected_option_id,
  descriptive_text,
  client_session_id,
}) => {
  const response = await api.post('/api/evaluations/save-response/', {
    attempt_id: Number(attempt_id),
    question_id: Number(question_id),
    selected_option_id: selected_option_id ? Number(selected_option_id) : null,
    descriptive_text: descriptive_text || '',
    client_session_id: client_session_id || '',
  });
  return response.data;
};

export const submitTest = async (testId, payload) => {
  const response = await api.post(`/api/tests/${testId}/submit/`, payload);
  return response.data;
};

export const fetchSubmissionResult = async (submissionId) => {
  const response = await api.get(`/api/submissions/${submissionId}/result/`);
  return response.data;
};

export const fetchTeacherSubmissions = async (testId = null) => {
  const url = testId ? `/api/evaluations/submissions/?test_id=${testId}` : '/api/evaluations/submissions/';
  const response = await api.get(url);
  return response.data;
};

export const gradeSubmission = async ({ attempt_id, question_id, awarded_marks, feedback }) => {
  const response = await api.post('/api/evaluations/grade/', {
    attempt_id: Number(attempt_id),
    question_id: Number(question_id),
    awarded_marks: Number(awarded_marks),
    feedback: feedback || '',
  });
  return response.data;
};

export const logViolation = async ({ attempt_id, violation_type, metadata, client_session_id }) => {
  const response = await api.post('/api/evaluations/violations/log/', {
    attempt_id: Number(attempt_id),
    violation_type,
    metadata: metadata || {},
    client_session_id: client_session_id || '',
  });
  return response.data;
};

// Subjects APIs
export const fetchSubjects = async () => {
  const response = await api.get('/api/tests/subjects/');
  return response.data;
};

export const createSubject = async (data) => {
  const response = await api.post('/api/tests/subjects/', data);
  return response.data;
};

export default api;
