import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ADMIN_LINKS = [
  ['📊', 'Дашборд', '/admin/dashboard'],
  ['🎯', 'Заявки', '/admin/leads'],
  ['👨‍🎓', 'Студенты', '/admin/students'],
  ['👩‍🏫', 'Преподаватели', '/admin/teachers'],
  ['👥', 'Группы', '/admin/groups'],
  ['📚', 'Курсы', '/admin/courses'],
  ['💳', 'Платежи', '/admin/payments'],
  ['📈', 'Отчёты', '/admin/reports'],
  ['💬', 'Чат', '/chat'],
  ['📢', 'Рассылка', '/admin/broadcast'],
  ['⏳', 'Заявки', '/admin/pending-users'],
  ['⭐', 'Отзывы', '/admin/reviews'],
];

const TEACHER_LINKS = [
  ['📊', 'Мой кабинет', '/teacher/dashboard'],
  ['👨‍🎓', 'Мои студенты', '/teacher/students'],
  ['👥', 'Группы', '/teacher/groups'],
  ['📝', 'ДЗ', '/teacher/homeworks'],
  ['📚', 'Уроки', '/teacher/lessons'],
  ['📋', 'Посещаемость', '/teacher/attendance'],
  ['💬', 'Чат', '/chat'],
];

const STUDENT_LINKS = [
  ['📊', 'Дашборд', '/dashboard'],
  ['📚', 'Мои курсы', '/courses'],
  ['📝', 'ДЗ', '/homeworks'],
  ['📅', 'Расписание', '/schedule'],
  ['💬', 'Чат', '/chat'],
  ['🏆', 'Достижения', '/achievements'],
  ['⚙️', 'Настройки', '/settings'],
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? ADMIN_LINKS
    : user?.role === 'teacher' ? TEACHER_LINKS
    : STUDENT_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        TIL <span>USER</span>
        {user?.role === 'admin' && <small>ADMIN CRM</small>}
      </div>
      <nav className="sidebar-nav">
        {links.map(([icon, label, to]) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">{icon}</span> {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="theme-toggle-btn" onClick={toggle} style={{ width: '100%', padding: '10px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text)', fontSize: '14px' }}>
          {theme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="logout" style={{ width: '100%' }}>
          <span className="icon">🚪</span> Выйти
        </button>
      </div>
    </aside>
  );
}
