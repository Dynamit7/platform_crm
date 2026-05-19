import { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import api from './api/axios';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Guards/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ChatPage from './pages/Chat';
import StudentCourses from './pages/student/Courses';
import StudentHomeworks from './pages/student/Homeworks';
import StudentSchedule from './pages/student/Schedule';
import StudentAchievements from './pages/student/Achievements';
import StudentSettings from './pages/student/Settings';
import TeacherStudents from './pages/teacher/Students';
import TeacherGroups from './pages/teacher/Groups';
import TeacherHomeworks from './pages/teacher/Homeworks';
import TeacherLessons from './pages/teacher/Lessons';
import TeacherAttendance from './pages/teacher/Attendance';
import AdminLeads from './pages/admin/Leads';
import AdminStudents from './pages/admin/Students';
import AdminTeachers from './pages/admin/Teachers';
import AdminGroups from './pages/admin/Groups';
import AdminCourses from './pages/admin/Courses';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminProfitLoss from './pages/admin/ProfitLoss';
import Broadcast from './pages/admin/Broadcast';
import PendingUsers from './pages/admin/PendingUsers';
import AdminReviews from './pages/admin/Reviews';
import AdminRoles from './pages/admin/Roles';
import AdminAttendance from './pages/admin/Attendance';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin' || user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomeRedirect />} />

        {/* Student pages */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute roles={['student']}><StudentCourses /></ProtectedRoute>} />
        <Route path="/homeworks" element={<ProtectedRoute roles={['student']}><StudentHomeworks /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute roles={['student']}><StudentSchedule /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute roles={['student']}><StudentAchievements /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['student', 'teacher', 'admin', 'super_admin']}><StudentSettings /></ProtectedRoute>} />

        {/* Teacher pages */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherStudents /></ProtectedRoute>} />
        <Route path="/teacher/groups" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherGroups /></ProtectedRoute>} />
        <Route path="/teacher/homeworks" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherHomeworks /></ProtectedRoute>} />
        <Route path="/teacher/lessons" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherLessons /></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute roles={['teacher', 'admin', 'super_admin']}><TeacherAttendance /></ProtectedRoute>} />

        {/* Admin pages – admin и super_admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLeads /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminTeachers /></ProtectedRoute>} />
        <Route path="/admin/groups" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminGroups /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminCourses /></ProtectedRoute>} />

        {/* Только super_admin */}
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/profit-loss" element={<ProtectedRoute roles={['super_admin']}><AdminProfitLoss /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['super_admin']}><AdminReports /></ProtectedRoute>} />

        <Route path="/admin/roles" element={<ProtectedRoute roles={['super_admin']}><AdminRoles /></ProtectedRoute>} />
        <Route path="/admin/broadcast" element={<ProtectedRoute roles={['admin', 'super_admin']}><Broadcast /></ProtectedRoute>} />
        <Route path="/admin/pending-users" element={<ProtectedRoute roles={['admin', 'super_admin']}><PendingUsers /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminReviews /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAttendance /></ProtectedRoute>} />

        {/* Chat – любой авторизованный */}
        <Route path="/chat" element={<ProtectedRoute roles={['admin', 'super_admin', 'teacher', 'student']}><ChatPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { add } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/register', { name, email, password });
      await login(email, password);
      if (add) add('Регистрация успешна!', 'success');
      navigate('/dashboard');
    } catch {
      if (add) add('Ошибка регистрации', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">TIL <span>USER</span></div>
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Иванов" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
