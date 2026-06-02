import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { useState, useEffect } from 'react';

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
  shield: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
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
  { label: 'Посещаемость', path: '/admin/attendance', icon: 'userCheck' },
  { label: 'Платежи', path: '/admin/payments', icon: 'creditCard' },
  { label: 'Доходы/Расходы', path: '/admin/profit-loss', icon: 'chart' },
  { label: 'Отчёты', path: '/admin/reports', icon: 'chart' },
  { label: 'Роли и доступы', path: '/admin/roles', icon: 'shield' },
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
  { label: 'Посещаемость', path: '/admin/attendance', icon: 'userCheck' },
  { label: 'Платежи', path: '/admin/payments', icon: 'creditCard' },
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
  { label: 'Профиль', path: '/settings', icon: 'userCheck' },
  { label: 'Чат', path: '/chat', icon: 'messageSquare' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { toggle, theme } = useTheme();
  const chat = useChat();
  const totalUnread = chat?.totalUnread || 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const meta = user?.role === 'super_admin' ? LINK_META
    : user?.role === 'admin' ? ADMIN_LINK_META
    : user?.role === 'teacher' ? TEACHER_LINK_META
    : user?.role === 'student' ? STUDENT_LINK_META
    : null;

  if (!meta) return null;

  const sidebarWidth = isMobile ? 280 : (collapsed ? 72 : 260);

  return (
    <>
      {/* Hamburger — visible on mobile */}
      {isMobile && (
        <button style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60,
          width: 40, height: 40, border: 'none', borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface)', color: 'var(--text)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontFamily: 'inherit', fontSize: 18,
        }} onClick={() => setMobileOpen(true)} aria-label="Меню">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 55,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileOpen(false)} />
      )}

      <aside className="sidebar" style={{
        width: isMobile ? (mobileOpen ? sidebarWidth : 0) : sidebarWidth,
        minWidth: isMobile ? (mobileOpen ? sidebarWidth : 0) : sidebarWidth,
        position: isMobile ? 'fixed' : 'sticky',
        zIndex: isMobile ? 56 : 50,
        left: isMobile ? (mobileOpen ? 0 : -sidebarWidth) : 'auto',
        transition: 'width 0.25s ease, left 0.25s ease',
        overflow: 'hidden',
      }}>
        {!isMobile && (
          <button onClick={toggleCollapse} style={{
            position: 'absolute', top: 24, right: collapsed ? '50%' : 8,
            transform: collapsed ? 'translateX(50%)' : 'none',
            width: 24, height: 24, border: 'none', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', color: 'rgba(255,255,255,0.4)',
            transition: 'all 0.15s', fontFamily: 'inherit', zIndex: 2,
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            aria-label={collapsed ? 'Развернуть' : 'Свернуть'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', padding: collapsed && !isMobile ? '24px 16px' : '24px 24px 20px', textAlign: collapsed && !isMobile ? 'center' : 'left' }}>
          {collapsed && !isMobile ? (
            <span style={{ fontSize: 16, fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>T</span>
          ) : (
            <>
              TIL <span>USER</span>
              {user?.role === 'super_admin' && <small>SUPER ADMIN</small>}
              {user?.role === 'admin' && <small>ADMIN</small>}
              {user?.role === 'teacher' && <small>TEACHER</small>}
              {user?.role === 'student' && <small>STUDENT</small>}
            </>
          )}
        </div>
        <nav className="sidebar-nav">
          {meta.map((item, i) =>
            item.section ? (
              !(collapsed && !isMobile) && <div key={`s-${i}`} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}
                style={collapsed && !isMobile ? { justifyContent: 'center', padding: '12px 0', position: 'relative' } : { position: 'relative' }}>
                <span className="icon">{ICONS[item.icon]}</span>
                {!(collapsed && !isMobile) && item.label}
                {item.path === '/chat' && totalUnread > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 10,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    ...(collapsed && !isMobile ? { position: 'absolute', top: 6, right: 6, marginLeft: 0 } : {}),
                  }}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-bottom" style={collapsed && !isMobile ? { alignItems: 'center', padding: '12px 8px' } : {}}>
          <button className="theme-toggle-btn" onClick={toggle}
            style={collapsed && !isMobile ? { justifyContent: 'center', padding: '10px 0' } : {}}>
            <span className="icon">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </span>
            {!(collapsed && !isMobile) && (theme === 'dark' ? 'Светлая тема' : 'Тёмная тема')}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="logout"
            style={collapsed && !isMobile ? { justifyContent: 'center', padding: '10px 0' } : {}}>
            <span className="icon">
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            {!(collapsed && !isMobile) && 'Выйти'}
          </button>
        </div>
      </aside>
    </>
  );
}
