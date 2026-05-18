import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ICONS = {
  dashboard: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  target: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  users: <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  userCheck: <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  groups: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bookOpen: <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  creditCard: <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  chart: <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  messageSquare: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  megaphone: <svg viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  clock: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star: <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const LINK_META = [
  { section: 'Главная' },
  { label: 'Дашборд', path: '/admin/dashboard', icon: 'dashboard' },
  { section: 'Управление' },
  { label: 'Заявки', path: '/admin/leads', icon: 'target' },
  { label: 'Студенты', path: '/admin/students', icon: 'users' },
  { label: 'Преподаватели', path: '/admin/teachers', icon: 'userCheck' },
  { label: 'Группы', path: '/admin/groups', icon: 'groups' },
  { label: 'Курсы', path: '/admin/courses', icon: 'bookOpen' },
  { label: 'Платежи', path: '/admin/payments', icon: 'creditCard' },
  { label: 'Отчёты', path: '/admin/reports', icon: 'chart' },
  { section: 'Коммуникация' },
  { label: 'Чат', path: '/chat', icon: 'messageSquare' },
  { label: 'Рассылка', path: '/admin/broadcast', icon: 'megaphone' },
  { label: 'Регистрации', path: '/admin/pending-users', icon: 'clock' },
  { label: 'Отзывы', path: '/admin/reviews', icon: 'star' },
];

const ADMIN_LINK_META = [
  { section: 'Главная' },
  { label: 'Дашборд', path: '/admin/dashboard', icon: 'dashboard' },
  { section: 'Управление' },
  { label: 'Заявки (обзвон)', path: '/admin/leads', icon: 'target' },
  { label: 'Студенты', path: '/admin/students', icon: 'users' },
  { label: 'Преподаватели', path: '/admin/teachers', icon: 'userCheck' },
  { label: 'Группы', path: '/admin/groups', icon: 'groups' },
  { label: 'Курсы', path: '/admin/courses', icon: 'bookOpen' },
  { section: 'Коммуникация' },
  { label: 'Чат', path: '/chat', icon: 'messageSquare' },
  { label: 'Рассылка', path: '/admin/broadcast', icon: 'megaphone' },
  { label: 'Регистрации', path: '/admin/pending-users', icon: 'clock' },
  { label: 'Отзывы', path: '/admin/reviews', icon: 'star' },
];

const TEACHER_LINK_META = [
  { section: 'Главная' },
  { label: 'Дашборд', path: '/teacher/dashboard', icon: 'dashboard' },
  { section: 'Обучение' },
  { label: 'Студенты', path: '/teacher/students', icon: 'users' },
  { label: 'Группы', path: '/teacher/groups', icon: 'groups' },
  { label: 'Уроки', path: '/teacher/lessons', icon: 'bookOpen' },
  { label: 'Д/з', path: '/teacher/homeworks', icon: 'clock' },
  { label: 'Посещаемость', path: '/teacher/attendance', icon: 'userCheck' },
  { section: 'Коммуникация' },
  { label: 'Чат', path: '/chat', icon: 'messageSquare' },
];

const STUDENT_LINK_META = [
  { section: 'Главная' },
  { label: 'Дашборд', path: '/dashboard', icon: 'dashboard' },
  { section: 'Обучение' },
  { label: 'Мои курсы', path: '/courses', icon: 'bookOpen' },
  { label: 'Д/з', path: '/homeworks', icon: 'clock' },
  { label: 'Расписание', path: '/schedule', icon: 'target' },
  { label: 'Достижения', path: '/achievements', icon: 'star' },
  { section: 'Профиль' },
  { label: 'Настройки', path: '/settings', icon: 'userCheck' },
  { label: 'Чат', path: '/chat', icon: 'messageSquare' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();

  const meta = user?.role === 'super_admin' ? LINK_META
    : user?.role === 'admin' ? ADMIN_LINK_META
    : user?.role === 'teacher' ? TEACHER_LINK_META
    : user?.role === 'student' ? STUDENT_LINK_META
    : null;

  if (!meta) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        TIL <span>USER</span>
        {user?.role === 'super_admin' && <small>SUPER ADMIN</small>}
        {user?.role === 'admin' && <small>ADMIN</small>}
        {user?.role === 'teacher' && <small>TEACHER</small>}
        {user?.role === 'student' && <small>STUDENT</small>}
      </div>
      <nav className="sidebar-nav">
        {meta.map((item, i) =>
          item.section ? (
            <div key={`s-${i}`} className="sidebar-section-label">{item.section}</div>
          ) : (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="icon">{ICONS[item.icon]}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className="theme-toggle-btn" onClick={toggle}>
          <span className="icon">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </span>
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="logout">
          <span className="icon">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          Выйти
        </button>
      </div>
    </aside>
  );
}
