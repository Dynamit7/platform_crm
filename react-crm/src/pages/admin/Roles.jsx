import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const SPlus = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SClose = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SSearch = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const SEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const SShield = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const SUsers = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const SCheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const SX = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SKey = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>);

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: '#8b5cf6', icon: '👑' },
  admin: { label: 'Администратор', color: '#3b82f6', icon: '🛡️' },
  teacher: { label: 'Преподаватель', color: '#10b981', icon: '📚' },
  student: { label: 'Студент', color: '#06b6d4', icon: '👨‍🎓' },
};

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'var(--accent-gradient)', color: '#fff', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', color: 'var(--text)', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'none', color: 'var(--muted)', whiteSpace: 'nowrap', transition: 'all 0.15s' },
};

export default function AdminRoles() {
  const { add } = useToast();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/api/admin/admins').then(({ data }) => {
      setAdmins(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const filteredAdmins = useMemo(() => {
    let list = [...admins];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    return list;
  }, [admins, search, roleFilter]);

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/admin/users', createForm);
      setAdmins(prev => [...prev, data]);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'admin' });
      add('Администратор создан', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Ошибка при создании';
      add(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u) => {
    setEditingUser(u);
    setEditRole(u.role);
  };

  const saveRole = async () => {
    if (!editingUser || editRole === editingUser.role) {
      setEditingUser(null);
      return;
    }
    setEditSaving(true);
    try {
      await api.patch(`/api/admin/users/${editingUser.id}`, { role: editRole });
      setAdmins(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: editRole } : u));
      add('Роль обновлена', 'success');
      setEditingUser(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Ошибка при обновлении';
      add(msg, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const stats = useMemo(() => ({
    total: admins.length,
    superAdmins: admins.filter(u => u.role === 'super_admin').length,
    admins: admins.filter(u => u.role === 'admin').length,
    active: admins.filter(u => u.is_active !== false).length,
  }), [admins]);

  return (
    <div className="page-content" style={{ padding: '24px 28px' }}>
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SShield /> Роли и доступы
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} администраторов · {stats.superAdmins} Super Admin · {stats.admins} Администраторов · {stats.active} активных
          </p>
        </div>
        {isSuperAdmin && (
          <button style={s.btnPrimary} onClick={() => setShowCreateModal(true)}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}>
            <SPlus /> Создать администратора
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Всего', value: stats.total, color: '#8b5cf6', icon: <SUsers /> },
          { label: 'Super Admin', value: stats.superAdmins, color: '#8b5cf6', icon: '👑' },
          { label: 'Администраторов', value: stats.admins, color: '#3b82f6', icon: '🛡️' },
          { label: 'Активных', value: stats.active, color: '#10b981', icon: <SCheck /> },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--glass-shadow)', padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--glass-shadow)', overflow: 'auto',
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 320, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
            <input type="text" placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 150 }}>
            <option value="all">Все роли</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Администратор</option>
          </select>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{filteredAdmins.length} пользователей</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Загрузка...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Пользователь</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Роль</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Статус</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Создан</th>
                {isSuperAdmin && (
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Действия</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--muted)', fontSize: 13 }}>
                    Администраторы не найдены
                  </td>
                </tr>
              ) : filteredAdmins.map(u => {
                const config = ROLE_CONFIG[u.role] || { label: u.role, color: '#6b7280', icon: '🔒' };
                return (
                  <tr key={u.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, background: config.color }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name || '—'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: `${config.color}18`, color: config.color }}>
                        {config.icon} {config.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: u.is_active !== false ? '#10b981' : '#ef4444' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                        {u.is_active !== false ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>{u.created_at || '—'}</td>
                    {isSuperAdmin && (
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        <button onClick={() => startEdit(u)} style={s.btnGhost}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SEdit /> {u.id === currentUser?.id ? '' : 'Изменить роль'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="ld-overlay" onClick={() => setEditingUser(null)}>
          <div className="ld-modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3><SKey style={{ marginRight: 8 }} /> Изменить роль</h3>
              <button className="ld-panel-close" onClick={() => setEditingUser(null)}><SClose /></button>
            </div>
            <div className="ld-modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Пользователь: <strong>{editingUser.name || editingUser.email}</strong>
              </p>
              <label className="ld-field">
                <span>Новая роль</span>
                <select className="ld-input" value={editRole} onChange={e => setEditRole(e.target.value)}
                  style={{ cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option value="super_admin">👑 Super Admin</option>
                  <option value="admin">🛡️ Администратор</option>
                  <option value="teacher">📚 Преподаватель</option>
                  <option value="student">👨‍🎓 Студент</option>
                </select>
              </label>
            </div>
            <div className="ld-modal-actions">
              <button className="ld-btn ld-btn--outline" onClick={() => setEditingUser(null)}>Отмена</button>
              <button className="ld-btn ld-btn--primary" onClick={saveRole} disabled={editSaving || editRole === editingUser.role}>
                {editSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="ld-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ld-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>Создать администратора</h3>
              <button className="ld-panel-close" onClick={() => setShowCreateModal(false)}><SClose /></button>
            </div>
            <form onSubmit={createAdmin} className="ld-modal-body">
              <label className="ld-field">
                <span>Имя</span>
                <input className="ld-input" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Имя и фамилия" required />
              </label>
              <label className="ld-field">
                <span>Email</span>
                <input className="ld-input" type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" required />
              </label>
              <label className="ld-field">
                <span>Пароль</span>
                <input className="ld-input" type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Минимум 6 символов" required minLength={6} />
              </label>
              <label className="ld-field">
                <span>Роль</span>
                <select className="ld-input" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                  style={{ cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option value="admin">🛡️ Администратор</option>
                  <option value="super_admin">👑 Super Admin</option>
                </select>
              </label>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowCreateModal(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary" disabled={creating}>
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
