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
import Placeholder from './pages/Placeholder';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
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
        <Route path="/courses" element={<ProtectedRoute roles={['student']}><Placeholder title="Мои курсы" /></ProtectedRoute>} />
        <Route path="/homeworks" element={<ProtectedRoute roles={['student']}><Placeholder title="Домашние задания" /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute roles={['student']}><Placeholder title="Расписание" /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute roles={['student']}><Placeholder title="Достижения" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['student']}><Placeholder title="Настройки" /></ProtectedRoute>} />

        {/* Teacher pages */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute roles={['teacher', 'admin']}><Placeholder title="Мои студенты" /></ProtectedRoute>} />
        <Route path="/teacher/groups" element={<ProtectedRoute roles={['teacher', 'admin']}><Placeholder title="Мои группы" /></ProtectedRoute>} />
        <Route path="/teacher/homeworks" element={<ProtectedRoute roles={['teacher', 'admin']}><Placeholder title="ДЗ учеников" /></ProtectedRoute>} />
        <Route path="/teacher/lessons" element={<ProtectedRoute roles={['teacher', 'admin']}><Placeholder title="Уроки" /></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute roles={['teacher', 'admin']}><Placeholder title="Посещаемость" /></ProtectedRoute>} />

        {/* Admin pages */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute roles={['admin']}><Placeholder title="Заявки" /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><Placeholder title="Студенты" /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute roles={['admin']}><Placeholder title="Преподаватели" /></ProtectedRoute>} />
        <Route path="/admin/groups" element={<ProtectedRoute roles={['admin']}><Placeholder title="Группы" /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><Placeholder title="Курсы" /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><Placeholder title="Платежи" /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Placeholder title="Отчёты" /></ProtectedRoute>} />
        <Route path="/admin/broadcast" element={<ProtectedRoute roles={['admin']}><Placeholder title="Рассылка" /></ProtectedRoute>} />
        <Route path="/admin/pending-users" element={<ProtectedRoute roles={['admin']}><Placeholder title="Заявки на регистрацию" /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin']}><Placeholder title="Отзывы" /></ProtectedRoute>} />

        {/* Chat – любой авторизованный */}
        <Route path="/chat" element={<ProtectedRoute roles={['admin', 'teacher', 'student']}><ChatPage /></ProtectedRoute>} />
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
  const { add } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
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
