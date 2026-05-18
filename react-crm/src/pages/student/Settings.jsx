import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

export default function Settings() {
  const { user, logout } = useAuth();
  const { add } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch('/auth/me', form);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      if (add) add('Профиль обновлён', 'success');
    } catch { if (add) add('Ошибка обновления', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Настройки профиля</h1>
          <p>Управляйте личной информацией</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="panel-body">
            <div className="teacher-student-avatar" style={{
              width: 80, height: 80, fontSize: 28, margin: '0 auto 16px',
              background: avatarColors[(user?.id || 0) % avatarColors.length]
            }}>
              {initials(user?.name)}
            </div>
            <div className="tg-name" style={{ fontSize: 16, marginBottom: 4 }}>{user?.name}</div>
            <div className="tg-muted" style={{ marginBottom: 16 }}>{user?.email}</div>
            <span className="tg-badge" style={{
              background: '#2563eb1a', color: 'var(--blue-600)', fontSize: 11
            }}>
              {user?.role === 'student' ? 'Студент' : user?.role}
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Редактировать профиль</h2></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <UserIcon /> Имя
                </label>
                <input type="text" className="form-input" placeholder="Ваше имя"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <MailIcon /> Email
                </label>
                <input type="email" className="form-input" placeholder="email@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <PhoneIcon /> Телефон
                </label>
                <input type="text" className="form-input" placeholder="+998 XX XXX XX XX"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <SaveIcon /> {busy ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
