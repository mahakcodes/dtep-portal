import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import EvaluatorDashboard from './pages/evaluator/EvaluatorDashboard.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TakeTest from './pages/student/TakeTest.jsx'
import TestResult from './pages/student/TestResult.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAuth } from './context/AuthContext.jsx'

function RoleRedirect({ fallback = '/login' }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={fallback} replace />
  if (user.role === 'STUDENT' || user.role === 'student') return <Navigate to="/student" replace />
  if (user.role === 'ADMIN' || user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/evaluator" replace />
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      const to = user.role === 'student' ? '/student' : user.role === 'admin' ? '/admin' : '/evaluator'
      navigate(to, { replace: true })
    }
  }, [user, isLoading, allowedRoles, location.pathname, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          <span className="text-sm font-semibold">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) return null
  if (allowedRoles && !allowedRoles.includes(user.role)) return null

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/evaluator/*" element={
        <ProtectedRoute allowedRoles={['evaluator', 'EVALUATOR', 'teacher', 'TEACHER']}>
          <EvaluatorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/take-test/:id" element={
        <ProtectedRoute allowedRoles={['student', 'STUDENT', 'evaluator', 'EVALUATOR', 'teacher', 'TEACHER']}>
          <TakeTest />
        </ProtectedRoute>
      } />
      <Route path="/result/:submissionId" element={
        <ProtectedRoute allowedRoles={['student', 'STUDENT', 'evaluator', 'EVALUATOR', 'teacher', 'TEACHER', 'admin', 'ADMIN']}>
          <TestResult />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
