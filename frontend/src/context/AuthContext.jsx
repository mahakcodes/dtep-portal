import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  loginUser,
  fetchProfile,
  fetchTeachers,
  createTeacher as apiCreateTeacher,
  fetchStudents,
  createStudent as apiCreateStudent,
  assignStudentToTeacher as apiAssignStudent,
  unassignStudentFromTeacher as apiUnassignStudent,
  assignSubjectToTeacher as apiAssignSubjectToTeacher,
  enrollStudentInSubject as apiEnrollStudentInSubject,
  fetchTests,
  fetchTestDetails,
  createTest as apiCreateTest,
  updateTest as apiUpdateTest,
  publishTest as apiPublishTest,
  fetchTeacherSubmissions,
  gradeSubmission as apiGradeSubmission,
  fetchSubjects,
  getStoredToken,
  clearStoredSession,
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('dtep_user') || sessionStorage.getItem('dtep_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Real backend entities
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const normalizeDirectoryUser = (record) => {
    const fullName = record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || record.username;
    return {
      ...record,
      name: fullName,
      subjectIds: (record.teaching_subjects || []).map((subject) => subject.id),
      enrolledSubjectIds: (record.enrolled_subjects || []).map((subject) => subject.id),
      department: record.department || record.teaching_subjects?.[0]?.department || '—',
      joined: record.created_at ? new Date(record.created_at).toLocaleDateString() : '—',
      status: record.is_active === false ? 'inactive' : 'active',
    };
  };

  const normalizeDashboardTest = (record) => ({
    ...record,
    subjectId: record.subject_id ?? record.subject ?? null,
    createdBy: record.created_by,
    totalQuestions: record.questions?.length || 0,
    totalMarks: record.questions?.reduce((total, question) => total + (Number(question.marks) || 0), 0) || 0,
    // StudentTestSerializer only returns tests already authorized by the
    // backend. Treat an older response without this field as published so it
    // is not incorrectly hidden in the student portal.
    status: (record.is_published ?? true) ? 'active' : 'draft',
    scheduledAt: record.scheduled_date || '',
  });

  // Normalize user object
  const normalizeUser = (userData) => {
    if (!userData) return null;
    const rawRole = (userData.role || '').toUpperCase();
    const role =
      rawRole === 'STUDENT'
        ? 'student'
        : rawRole === 'ADMIN'
        ? 'admin'
        : 'evaluator'; // Evaluator/Teacher maps to evaluator in frontend routes

    const fullName =
      userData.full_name ||
      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
      userData.username ||
      'User';

    return {
      ...userData,
      id: userData.id,
      username: userData.username,
      email: userData.email,
      full_name: fullName,
      name: fullName,
      role,
      rawRole,
    };
  };

  // Refresh data from real backend based on user role
  const refreshData = useCallback(async (activeUser = user) => {
    if (!activeUser || !getStoredToken()) return;
    const currentRole = activeUser.role;

    try {
      // Subjects can be fetched by all authenticated users
      try {
        const subjs = await fetchSubjects();
        if (Array.isArray(subjs)) setSubjects(subjs);
      } catch (e) {
        console.warn('Failed to fetch subjects', e);
      }

      // Admin role data
      if (currentRole === 'admin') {
        const [teacherList, studentList, testList] = await Promise.allSettled([
          fetchTeachers(),
          fetchStudents(),
          fetchTests(),
        ]);
        if (teacherList.status === 'fulfilled' && Array.isArray(teacherList.value)) {
          setTeachers(teacherList.value.map(normalizeDirectoryUser));
        }
        if (studentList.status === 'fulfilled' && Array.isArray(studentList.value)) {
          setStudents(studentList.value.map(normalizeDirectoryUser));
        }
        if (testList.status === 'fulfilled' && Array.isArray(testList.value)) {
          setTests(testList.value.map(normalizeDashboardTest));
        }
      }

      // Evaluator / Teacher role data
      else if (currentRole === 'evaluator') {
        const [studentList, testList, subList] = await Promise.allSettled([
          fetchStudents(), // Returns assigned students for teacher
          fetchTests(), // Returns teacher's own tests
          fetchTeacherSubmissions(), // Returns submissions for teacher's tests & assigned students
        ]);
        if (studentList.status === 'fulfilled' && Array.isArray(studentList.value)) {
          setStudents(studentList.value.map(normalizeDirectoryUser));
        }
        if (testList.status === 'fulfilled' && Array.isArray(testList.value)) {
          setTests(testList.value.map(normalizeDashboardTest));
        }
        if (subList.status === 'fulfilled' && Array.isArray(subList.value)) {
          setSubmissions(subList.value);
        }
      }

      // Student role data
      else if (currentRole === 'student') {
        const testList = await fetchTests(); // Backend returns only authorized published tests
        if (Array.isArray(testList)) {
          setTests(testList.map(normalizeDashboardTest));
        }
      }
    } catch (err) {
      console.error('Error refreshing backend data:', err);
    }
  }, [user]);

  // Initial session verification
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile();
        const norm = normalizeUser(profile);
        setUser(norm);
        await refreshData(norm);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        clearStoredSession();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Real backend Login
  const login = useCallback(
    async ({ email, password, remember = true }) => {
      setIsLoading(true);
      try {
        const res = await loginUser({
          email: email.trim(),
          password: password.trim(),
          username: email.trim(),
        });

        const authToken = res.access;
        const rawUserData = res.user || res;
        const normUser = normalizeUser(rawUserData);

        if (remember) {
          localStorage.setItem('dtep_token', authToken);
          localStorage.setItem('dtep_user', JSON.stringify(normUser));
          localStorage.setItem('dtep_remember', 'true');
        } else {
          sessionStorage.setItem('dtep_token', authToken);
          sessionStorage.setItem('dtep_user', JSON.stringify(normUser));
        }

        setToken(authToken);
        setUser(normUser);

        // Fetch user data from backend
        await refreshData(normUser);

        return normUser;
      } catch (error) {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.message ||
          error.message ||
          'Authentication failed. Please check your credentials.';
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData]
  );

  // Logout
  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
    setTeachers([]);
    setStudents([]);
    setTests([]);
    setSubmissions([]);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return (
          roles.includes(user.role) ||
          roles.includes(user.rawRole) ||
          roles.map((r) => r.toLowerCase()).includes(user.role)
        );
      }
      return user.role === roles || user.rawRole === roles;
    },
    [user]
  );

  // Teacher management actions
  const addTeacher = useCallback(
    async (teacherData) => {
      const parts = (teacherData.name || '').trim().split(/\s+/);
      const firstName = teacherData.first_name || parts[0] || 'Teacher';
      const lastName = teacherData.last_name || parts.slice(1).join(' ') || 'Faculty';
      const username =
        teacherData.username ||
        teacherData.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') ||
        `teacher_${Date.now()}`;

      const payload = {
        username,
        email: teacherData.email,
        password: teacherData.password,
        first_name: firstName,
        last_name: lastName,
        phone_number: teacherData.phone_number || '',
        subject_ids: (teacherData.subjectIds || teacherData.subject_ids || []).map(Number).filter(Boolean),
      };
      const res = await apiCreateTeacher(payload);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  // Student management actions
  const addStudent = useCallback(
    async (studentData) => {
      const parts = (studentData.name || '').trim().split(/\s+/);
      const firstName = studentData.first_name || parts[0] || 'Student';
      const lastName = studentData.last_name || parts.slice(1).join(' ') || 'Candidate';
      const username =
        studentData.username ||
        studentData.roll ||
        studentData.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') ||
        `student_${Date.now()}`;

      const payload = {
        username,
        email: studentData.email,
        password: studentData.password,
        first_name: firstName,
        last_name: lastName,
        phone_number: studentData.phone_number || '',
        subject_ids: (studentData.subjectIds || studentData.subject_ids || []).map(Number).filter(Boolean),
      };
      const res = await apiCreateStudent(payload);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  // Assign Student to Teacher
  const assignStudentToTeacher = useCallback(
    async ({ student_id, teacher_id }) => {
      const res = await apiAssignStudent({ student_id, teacher_id });
      await refreshData();
      return res;
    },
    [refreshData]
  );

  // Unassign Student from Teacher
  const unassignStudentFromTeacher = useCallback(
    async ({ student_id, teacher_id }) => {
      const res = await apiUnassignStudent({ student_id, teacher_id });
      await refreshData();
      return res;
    },
    [refreshData]
  );

  const assignSubjectToTeacher = useCallback(
    async (teacherId, subjectId) => {
      const res = await apiAssignSubjectToTeacher(teacherId, subjectId);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  const enrollStudentInSubject = useCallback(
    async (studentId, subjectId) => {
      const res = await apiEnrollStudentInSubject(studentId, subjectId);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  // Test creation & publishing
  const createTest = useCallback(
    async (testData) => {
      const formattedQuestions = (testData.questions || []).map((q, idx) => {
        const isDescriptive =
          q.type === 'subjective' ||
          q.question_type === 'DESCRIPTIVE' ||
          q.question_type === 'subjective';

        return {
          text: q.text,
          question_type: isDescriptive ? 'DESCRIPTIVE' : 'MCQ',
          marks: Number(q.marks || (isDescriptive ? 5 : 2)),
          order: idx + 1,
          model_answer: q.modelAnswer || q.model_answer || '',
          options: isDescriptive
            ? []
            : (q.options || []).map((opt) => ({
                text: opt.text || opt.label || '',
                is_correct: Boolean(
                  opt.is_correct ??
                    opt.isCorrect ??
                    (q.correctKey && (opt.key === q.correctKey || opt.id === q.correctKey)) ??
                    (q.correct_option_id && opt.id === q.correct_option_id)
                ),
              })),
        };
      });

      const payload = {
        title: testData.title,
        description: testData.description || '',
        duration_minutes: Number(testData.duration || testData.duration_minutes || 30),
        subject: testData.subjectId ? Number(testData.subjectId) : null,
        test_type: testData.test_type || 'standard',
        scheduled_date: testData.scheduled_date || null,
        scheduled_time: testData.scheduled_time || null,
        is_published: Boolean(testData.is_published),
        questions: formattedQuestions,
      };

      const res = await apiCreateTest(payload);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  const publishTest = useCallback(
    async (testId, isPublished = true) => {
      const res = await apiPublishTest(testId, isPublished);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  const updateTest = useCallback(
    async (testId, testData) => {
      const res = await apiUpdateTest(testId, testData);
      await refreshData();
      return res;
    },
    [refreshData]
  );

  // Manual grading for descriptive responses
  const gradeSubmission = useCallback(
    async (submissionId, manualScore, feedback = '', questionScores = null) => {
      if (questionScores && typeof questionScores === 'object') {
        const gradingPromises = Object.entries(questionScores).map(([qId, qScoreObj]) => {
          const awarded = typeof qScoreObj === 'object' ? qScoreObj.score : qScoreObj;
          const qFeedback = typeof qScoreObj === 'object' ? qScoreObj.feedback : feedback;
          return apiGradeSubmission({
            attempt_id: Number(submissionId),
            question_id: Number(qId),
            awarded_marks: Number(awarded),
            feedback: qFeedback || '',
          });
        });
        await Promise.all(gradingPromises);
      }
      await refreshData();
    },
    [refreshData]
  );

  // Accessors that return real backend data
  const getStudentsForTeacher = useCallback(
    (_teacherId) => {
      // Backend StudentListView already returns only assigned students for evaluator/teacher
      return students;
    },
    [students]
  );

  const getTestsForTeacher = useCallback(
    (_teacherId) => {
      // Backend TestListCreateView already returns only teacher's own tests
      return tests;
    },
    [tests]
  );

  const getSubmissionsForTeacher = useCallback(
    (_teacherId) => {
      // Backend TeacherSubmissionsListView already filters appropriately
      return submissions;
    },
    [submissions]
  );

  const getTestsForStudent = useCallback(
    (_studentId) => {
      // Backend TestListCreateView already filters only authorized published tests
      return tests;
    },
    [tests]
  );

  const getSubmissionsForStudent = useCallback(
    (_studentId) => {
      return submissions;
    },
    [submissions]
  );

  const getTestDetails = useCallback(
    async (testId) => {
      return await fetchTestDetails(testId);
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      logout,
      hasRole,
      refreshData,
      teachers,
      students,
      tests,
      submissions,
      subjects,
      addTeacher,
      addStudent,
      assignStudentToTeacher,
      unassignStudentFromTeacher,
      assignSubjectToTeacher,
      enrollStudentInSubject,
      createTest,
      updateTest,
      publishTest,
      gradeSubmission,
      getStudentsForTeacher,
      getTestsForTeacher,
      getSubmissionsForTeacher,
      getTestsForStudent,
      getSubmissionsForStudent,
      getTestDetails,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      logout,
      hasRole,
      refreshData,
      teachers,
      students,
      tests,
      submissions,
      subjects,
      addTeacher,
      addStudent,
      assignStudentToTeacher,
      unassignStudentFromTeacher,
      assignSubjectToTeacher,
      enrollStudentInSubject,
      createTest,
      updateTest,
      publishTest,
      gradeSubmission,
      getStudentsForTeacher,
      getTestsForTeacher,
      getSubmissionsForTeacher,
      getTestsForStudent,
      getSubmissionsForStudent,
      getTestDetails,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
