import { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';

const SPlus = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SClose = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const STrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const SCopy = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const SSearch = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const SCheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const SArrowUp = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const SArrowDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>);
const SChevronDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const SShield = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const SUsers = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const SInfo = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);

const ROLE_ICONS = { super_admin: '👑', admin: '🛡️', teacher: '📚', sales_manager: '📈', student: '👨‍🎓', support: '💬', accountant: '💰', moderator: '🔍' };
const ROLE_COLORS = { super_admin: '#8b5cf6', admin: '#3b82f6', teacher: '#10b981', sales_manager: '#f59e0b', student: '#06b6d4', support: '#ec4899', accountant: '#14b8a6', moderator: '#f97316' };

const ALL_PERMISSIONS = [
  {
    group: 'Дашборд', id: 'dashboard',
    perms: [
      { id: 'dashboard.view', label: 'Просмотр дашборда' },
      { id: 'dashboard.export', label: 'Экспорт данных с дашборда' },
      { id: 'dashboard.full', label: 'Полный доступ ко всем виджетам' },
    ],
  },
  {
    group: 'Студенты', id: 'students',
    perms: [
      { id: 'students.view', label: 'Просмотр списка студентов' },
      { id: 'students.create', label: 'Создание студентов' },
      { id: 'students.edit', label: 'Редактирование студентов' },
      { id: 'students.delete', label: 'Удаление студентов' },
      { id: 'students.groups', label: 'Управление группами студентов' },
      { id: 'students.payments', label: 'Просмотр платежей студентов' },
      { id: 'students.toggle', label: 'Заморозка / Активация' },
    ],
  },
  {
    group: 'Преподаватели', id: 'teachers',
    perms: [
      { id: 'teachers.view', label: 'Просмотр списка преподавателей' },
      { id: 'teachers.create', label: 'Найм преподавателей' },
      { id: 'teachers.edit', label: 'Редактирование профиля' },
      { id: 'teachers.delete', label: 'Увольнение преподавателей' },
      { id: 'teachers.salary', label: 'Просмотр ставок и зарплаты' },
    ],
  },
  {
    group: 'Группы и Курсы', id: 'groups_courses',
    perms: [
      { id: 'groups.view', label: 'Просмотр групп' },
      { id: 'groups.create', label: 'Создание групп' },
      { id: 'groups.edit', label: 'Редактирование групп' },
      { id: 'courses.view', label: 'Просмотр курсов' },
      { id: 'courses.create', label: 'Создание курсов' },
      { id: 'courses.edit', label: 'Редактирование курсов' },
    ],
  },
  {
    group: 'Финансы', id: 'finance',
    perms: [
      { id: 'finance.payments.view', label: 'Просмотр платежей' },
      { id: 'finance.payments.create', label: 'Создание платежей' },
      { id: 'finance.payments.confirm', label: 'Подтверждение платежей' },
      { id: 'finance.payments.refund', label: 'Возвраты и отмены' },
      { id: 'finance.pnl.view', label: 'Просмотр P&L (доходы/расходы)' },
      { id: 'finance.pnl.create', label: 'Добавление расходов' },
      { id: 'finance.salary.view', label: 'Просмотр зарплатной ведомости' },
    ],
  },
  {
    group: 'Отчёты и Аналитика', id: 'reports',
    perms: [
      { id: 'reports.view', label: 'Просмотр отчётов' },
      { id: 'reports.export', label: 'Экспорт отчётов (CSV/Excel)' },
      { id: 'reports.analytics', label: 'Полная аналитика (MRR, LTV, churn)' },
    ],
  },
  {
    group: 'Персонал (HRM)', id: 'hrm',
    perms: [
      { id: 'hrm.employees.view', label: 'Просмотр сотрудников' },
      { id: 'hrm.employees.manage', label: 'Управление сотрудниками' },
      { id: 'hrm.salary.manage', label: 'Управление зарплатой и бонусами' },
      { id: 'hrm.schedule.view', label: 'Просмотр графика работы' },
    ],
  },
  {
    group: 'Коммуникация', id: 'communication',
    perms: [
      { id: 'chat.view', label: 'Доступ к чату' },
      { id: 'broadcast.send', label: 'Отправка рассылок' },
      { id: 'notifications.manage', label: 'Управление уведомлениями' },
      { id: 'reviews.manage', label: 'Управление отзывами' },
    ],
  },
  {
    group: 'Маркетинг', id: 'marketing',
    perms: [
      { id: 'leads.view', label: 'Просмотр заявок' },
      { id: 'leads.manage', label: 'Управление заявками' },
      { id: 'promocodes.manage', label: 'Управление промокодами' },
    ],
  },
  {
    group: 'Настройки и Безопасность', id: 'settings',
    perms: [
      { id: 'settings.school', label: 'Настройки школы' },
      { id: 'settings.roles', label: 'Управление ролями и правами' },
      { id: 'settings.audit', label: 'Просмотр логов аудита' },
      { id: 'settings.backup', label: 'Управление бэкапами' },
      { id: 'settings.api', label: 'API / Интеграции' },
    ],
  },
];

const DEFAULT_ROLES = [
  {
    id: 'super_admin', name: 'Super Admin', description: 'Полный доступ ко всем функциям системы. Управление ролями, финансами, настройками.',
    users: 1, isActive: true, isSystem: true, createdAt: '2026-01-15', color: '#8b5cf6', icon: '👑',
    permissions: ALL_PERMISSIONS.flatMap(g => g.perms.map(p => p.id)),
  },
  {
    id: 'admin', name: 'Администратор', description: 'Управление студентами, преподавателями, группами, курсами и коммуникацией.',
    users: 3, isActive: true, isSystem: true, createdAt: '2026-01-15', color: '#3b82f6', icon: '🛡️',
    permissions: ALL_PERMISSIONS.flatMap(g => g.perms.map(p => p.id)).filter(id => !['settings.roles', 'settings.backup', 'settings.api', 'settings.audit', 'finance.salary.view', 'hrm.salary.manage', 'finance.pnl.view', 'reports.analytics', 'settings.full'].includes(id)),
  },
  {
    id: 'teacher', name: 'Преподаватель', description: 'Проведение уроков, выставление оценок, управление ДЗ и посещаемостью.',
    users: 12, isActive: true, isSystem: true, createdAt: '2026-01-15', color: '#10b981', icon: '📚',
    permissions: ['students.view', 'groups.view', 'chat.view', 'dashboard.view'],
  },
  {
    id: 'sales_manager', name: 'Менеджер по продажам', description: 'Работа с заявками, консультация студентов, контроль оплат.',
    users: 4, isActive: true, isSystem: false, createdAt: '2026-03-01', color: '#f59e0b', icon: '📈',
    permissions: ['dashboard.view', 'leads.view', 'leads.manage', 'students.view', 'students.create', 'students.edit', 'students.toggle', 'finance.payments.view', 'finance.payments.create', 'chat.view', 'broadcast.send'],
  },
  {
    id: 'accountant', name: 'Бухгалтер', description: 'Финансовые операции, платежи, P&L, зарплатная ведомость.',
    users: 1, isActive: true, isSystem: false, createdAt: '2026-04-10', color: '#14b8a6', icon: '💰',
    permissions: ['finance.payments.view', 'finance.payments.create', 'finance.payments.confirm', 'finance.pnl.view', 'finance.pnl.create', 'finance.salary.view', 'reports.view', 'reports.export', 'dashboard.view'],
  },
  {
    id: 'support', name: 'Поддержка', description: 'Чат со студентами, обработка отзывов, базовая поддержка.',
    users: 2, isActive: true, isSystem: false, createdAt: '2026-05-01', color: '#ec4899', icon: '💬',
    permissions: ['chat.view', 'reviews.manage', 'students.view', 'dashboard.view'],
  },
  {
    id: 'moderator', name: 'Модератор', description: 'Модерация контента, отзывов, проверка материалов.',
    users: 0, isActive: false, isSystem: false, createdAt: '2026-05-15', color: '#f97316', icon: '🔍',
    permissions: ['students.view', 'groups.view', 'courses.view', 'chat.view', 'reviews.manage', 'dashboard.view'],
  },
];

const MOCK_USERS = [
  { id: 1, name: 'Администратор', email: 'admin@tiluser.uz', role: 'super_admin', roleLabel: 'Super Admin', lastActive: '2026-05-19T10:30:00', avatar: null },
  { id: 2, name: 'Анна М.', email: 'anna@tiluser.uz', role: 'admin', roleLabel: 'Администратор', lastActive: '2026-05-19T09:15:00', avatar: null },
  { id: 3, name: 'Сергей К.', email: 'sergey@tiluser.uz', role: 'admin', roleLabel: 'Администратор', lastActive: '2026-05-18T16:45:00', avatar: null },
  { id: 4, name: 'Елена В.', email: 'elena@tiluser.uz', role: 'sales_manager', roleLabel: 'Менеджер по продажам', lastActive: '2026-05-19T11:00:00', avatar: null },
  { id: 5, name: 'Дмитрий П.', email: 'dmitry@tiluser.uz', role: 'sales_manager', roleLabel: 'Менеджер по продажам', lastActive: '2026-05-18T14:30:00', avatar: null },
  { id: 6, name: 'Ольга Ф.', email: 'olga@tiluser.uz', role: 'accountant', roleLabel: 'Бухгалтер', lastActive: '2026-05-19T08:00:00', avatar: null },
  { id: 7, name: 'Мария С.', email: 'maria@tiluser.uz', role: 'support', roleLabel: 'Поддержка', lastActive: '2026-05-19T10:00:00', avatar: null },
  { id: 8, name: 'Иван Р.', email: 'ivan@tiluser.uz', role: 'support', roleLabel: 'Поддержка', lastActive: '2026-05-17T12:00:00', avatar: null },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'var(--accent-gradient)', color: '#fff', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', color: 'var(--text)', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'none', color: 'var(--muted)', whiteSpace: 'nowrap', transition: 'all 0.15s' },
};

function RoleCard({ role, onEdit, onClone, onDelete }) {
  return (
    <div style={{
      background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)',
      padding: 0, overflow: 'hidden', transition: 'all 0.2s',
    }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}>
      {/* Top accent line */}
      <div style={{ height: 4, background: role.color || '#6b7280' }} />
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${role.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{role.icon || '🔒'}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{role.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.isActive ? '#10b981' : '#ef4444' }} />
                <span style={{ fontSize: 11, color: role.isActive ? '#10b981' : '#ef4444', fontWeight: 500 }}>{role.isActive ? 'Активна' : 'Неактивна'}</span>
                {role.isSystem && <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--bg)', padding: '1px 7px', borderRadius: 8 }}>Системная</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <SUsers />
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{role.users}</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>пользователей</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>{role.description}</p>

        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
          Создана: {formatDate(role.createdAt)} · {role.permissions.length} разрешений
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(role)} style={{ ...s.btnOutline, padding: '7px 14px', fontSize: 12, flex: 1, justifyContent: 'center' }}><SEdit /> Права</button>
          <button onClick={() => onClone(role)} style={{ ...s.btnOutline, padding: '7px 14px', fontSize: 12 }} title="Клонировать роль"><SCopy /></button>
          {!role.isSystem && (
            <button onClick={() => onDelete(role)} style={{ ...s.btnOutline, padding: '7px 14px', fontSize: 12, color: '#ef4444' }} title="Удалить"><STrash /></button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRoles() {
  const { add } = useToast();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState(null);
  const [search, setSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '', color: '#3b82f6', icon: '🛡️' });

  const filteredUsers = useMemo(() => {
    let list = [...MOCK_USERS];
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
    if (userRoleFilter !== 'all') list = list.filter(u => u.role === userRoleFilter);
    return list;
  }, [search, userRoleFilter]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const handleEditPermissions = (role) => {
    setSelectedRole({ ...role });
  };

  const handlePermissionToggle = (permId) => {
    setSelectedRole(prev => {
      const has = prev.permissions.includes(permId);
      return { ...prev, permissions: has ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId] };
    });
  };

  const handleGroupToggle = (groupId, permIds) => {
    setSelectedRole(prev => {
      const allGranted = permIds.every(p => prev.permissions.includes(p));
      if (allGranted) return { ...prev, permissions: prev.permissions.filter(p => !permIds.includes(p)) };
      const newPerms = new Set(prev.permissions);
      permIds.forEach(p => newPerms.add(p));
      return { ...prev, permissions: [...newPerms] };
    });
  };

  const savePermissions = () => {
    setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...selectedRole } : r));
    if (add) add(`Права для роли «${selectedRole.name}» обновлены`, 'success');
    setSelectedRole(null);
  };

  const cloneRole = (role) => {
    const newId = `clone_${Date.now()}`;
    setRoles(prev => [...prev, { ...role, id: newId, name: role.name + ' (копия)', users: 0, isSystem: false, createdAt: new Date().toISOString().slice(0, 10) }]);
    if (add) add(`Роль «${role.name}» склонирована`, 'success');
  };

  const deleteRole = (role) => {
    setRoles(prev => prev.filter(r => r.id !== role.id));
    if (add) add(`Роль «${role.name}» удалена`, 'success');
  };

  const createRole = (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;
    const id = `custom_${Date.now()}`;
    setRoles(prev => [...prev, {
      id, name: newRoleForm.name.trim(), description: newRoleForm.description.trim() || 'Нет описания',
      users: 0, isActive: true, isSystem: false, createdAt: new Date().toISOString().slice(0, 10),
      color: newRoleForm.color, icon: newRoleForm.icon, permissions: ['dashboard.view'],
    }]);
    setShowNewRoleModal(false);
    setNewRoleForm({ name: '', description: '', color: '#3b82f6', icon: '🛡️' });
    if (add) add('Новая роль создана', 'success');
  };

  const activeRoleNames = ['active', 'all'];
  const roleStats = useMemo(() => ({
    total: roles.length, active: roles.filter(r => r.isActive).length, totalUsers: roles.reduce((s, r) => s + r.users, 0),
  }), [roles]);

  return (
    <div className="page-content" style={{ padding: '24px 28px' }}>

      {/* ═══ HEADER ═══ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SShield /> Роли и доступы
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {roleStats.total} ролей · {roleStats.active} активных · {roleStats.totalUsers} пользователей
          </p>
        </div>
        <button style={s.btnPrimary} onClick={() => setShowNewRoleModal(true)}
          onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}>
          <SPlus /> Создать новую роль
        </button>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[
          { key: 'roles', label: 'Все роли', count: roles.length },
          { key: 'users', label: 'Пользователи', count: MOCK_USERS.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '11px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 500,
            color: activeTab === tab.key ? 'var(--text)' : 'var(--muted)',
            borderBottom: activeTab === tab.key ? '2px solid var(--blue-500)' : '2px solid transparent',
            fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {tab.label}
            <span style={{ background: activeTab === tab.key ? 'var(--accent-gradient)' : 'var(--bg)', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: activeTab === tab.key ? '#fff' : 'var(--muted)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ════════════ ROLES TAB ════════════ */}
      {activeTab === 'roles' && (
        <>
          {/* Search + perms summary */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: 320, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
              <input type="text" placeholder="Поиск ролей..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> {roleStats.active} активных</span>
              <span>{roleStats.total - roleStats.active} неактивных</span>
            </div>
          </div>

          {/* Role cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
            {filteredRoles.map(role => (
              <RoleCard key={role.id} role={role} onEdit={handleEditPermissions} onClone={cloneRole} onDelete={deleteRole} />
            ))}
          </div>
        </>
      )}

      {/* ════════════ USERS TAB ════════════ */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', overflow: 'auto' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 320, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
              <input type="text" placeholder="Поиск пользователей..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 36px 9px 38px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 150 }}>
              <option value="all">Все роли</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{filteredUsers.length} пользователей</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Пользователь</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Роль</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Активность</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const roleConf = roles.find(r => r.id === u.role) || roles[0];
                return (
                  <tr key={u.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, background: roleConf?.color || '#6b7280' }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: `${roleConf?.color || '#6b7280'}18`, color: roleConf?.color || '#6b7280' }}>
                        {roleConf?.icon || '🔒'} {u.roleLabel}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>{timeAgo(u.lastActive)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════ SIDE PANEL — Edit Permissions ════════════ */}
      {selectedRole && (
        <div className="ld-overlay" onClick={() => setSelectedRole(null)}>
          <div className="ld-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="ld-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{selectedRole.icon || '🔒'}</span>
                <div>
                  <h3 style={{ margin: 0 }}>Права: {selectedRole.name}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{selectedRole.users} пользователей · {selectedRole.permissions.length} разрешений включено</p>
                </div>
              </div>
              <button className="ld-panel-close" onClick={() => setSelectedRole(null)}><SClose /></button>
            </div>

            <div className="ld-panel-body" style={{ padding: 0 }}>
              {/* Warning banner */}
              <div style={{ display: 'flex', gap: 10, padding: '14px 20px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid var(--border)', fontSize: 12, color: '#92400e', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><SInfo /></span>
                <span>Изменение прав влияет на всех пользователей этой роли. Будьте внимательны при включении/отключении разрешений.</span>
              </div>

              {/* Permission groups */}
              <div style={{ padding: '8px 20px 20px' }}>
                {ALL_PERMISSIONS.map(group => {
                  const allGranted = group.perms.every(p => selectedRole.permissions.includes(p.id));
                  const someGranted = group.perms.some(p => selectedRole.permissions.includes(p.id));
                  return (
                    <div key={group.id} style={{ marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)', userSelect: 'none' }}>
                          <input type="checkbox" checked={allGranted} onChange={() => handleGroupToggle(group.id, group.perms.map(p => p.id))}
                            style={{ width: 16, height: 16, accentColor: 'var(--blue-500)', cursor: 'pointer' }} />
                          {group.group}
                        </label>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{group.perms.filter(p => selectedRole.permissions.includes(p.id)).length}/{group.perms.length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 26 }}>
                        {group.perms.map(perm => (
                          <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0', userSelect: 'none' }}>
                            <input type="checkbox" checked={selectedRole.permissions.includes(perm.id)} onChange={() => handlePermissionToggle(perm.id)}
                              style={{ width: 15, height: 15, accentColor: 'var(--blue-500)', cursor: 'pointer' }} />
                            <span style={{ fontSize: 12, color: selectedRole.permissions.includes(perm.id) ? 'var(--text)' : 'var(--muted)' }}>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ld-panel-actions" style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="ld-btn ld-btn--outline" onClick={() => setSelectedRole(null)}>Отмена</button>
              <button className="ld-btn ld-btn--primary" onClick={savePermissions}>Сохранить права</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ NEW ROLE MODAL ════════════ */}
      {showNewRoleModal && (
        <div className="ld-overlay" style={{ justifyContent: 'center' }} onClick={() => setShowNewRoleModal(false)}>
          <div className="ld-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>Создание новой роли</h3>
              <button className="ld-panel-close" onClick={() => setShowNewRoleModal(false)}><SClose /></button>
            </div>
            <form onSubmit={createRole} className="ld-modal-body">
              <label className="ld-field">
                <span>Название роли</span>
                <input className="ld-input" value={newRoleForm.name} onChange={e => setNewRoleForm(p => ({ ...p, name: e.target.value }))} placeholder="Например: Менеджер по работе с клиентами" required />
              </label>
              <label className="ld-field">
                <span>Описание</span>
                <textarea className="ld-input" value={newRoleForm.description} onChange={e => setNewRoleForm(p => ({ ...p, description: e.target.value }))} placeholder="Краткое описание обязанностей" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: 60 }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="ld-field">
                  <span>Цвет</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'].map(c => (
                      <div key={c} onClick={() => setNewRoleForm(p => ({ ...p, color: c }))} style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: newRoleForm.color === c ? '3px solid var(--text)' : '3px solid transparent',
                        transition: 'all 0.15s', boxSizing: 'border-box',
                      }} />
                    ))}
                  </div>
                </label>
                <label className="ld-field">
                  <span>Иконка</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['🛡️','👑','📚','📈','💰','💬','🔍','⚙️','🎯','📊'].map(icon => (
                      <div key={icon} onClick={() => setNewRoleForm(p => ({ ...p, icon }))} style={{
                        width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        background: newRoleForm.icon === icon ? 'var(--bg)' : 'none', border: newRoleForm.icon === icon ? '2px solid var(--blue-500)' : '2px solid transparent',
                      }}>{icon}</div>
                    ))}
                  </div>
                </label>
              </div>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowNewRoleModal(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary">Создать роль</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
