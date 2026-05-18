import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function AdminTeachers() {
  const { add } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', subjects: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/api/admin/teachers?search=${search}`).then(({ data }) => setTeachers(data)).catch(() => {});
  }, [search]);

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/users/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/api/admin/teachers', form);
      if (add) add('Преподаватель создан', 'success');
      setTeachers(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: '', subjects: '', bio: '' });
    } catch (err) {
      if (add) add(err?.response?.data?.detail || 'Ошибка создания', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Преподаватели</h1>
          <p>Всего: {teachers.length}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusIcon /> Добавить
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <input type="text" className="form-input" placeholder="Поиск по имени, email..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320, flex: 1 }} />
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Имя</th><th>Email</th><th>Телефон</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {teachers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет преподавателей</td></tr>}
              {teachers.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.email}</td>
                  <td>{t.phone || '—'}</td>
                  <td>{t.is_active ? <span className="badge badge-grade">Активен</span> : <span className="badge badge-overdue">Неактивен</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline btn-icon" onClick={() => toggleActive(t.id)} title={t.is_active ? 'Деактивировать' : 'Активировать'}>
                      {t.is_active ? '⛔' : '✅'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3>Новый преподаватель</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input className="form-input" name="name" placeholder="Имя и фамилия" value={form.name} onChange={handleChange} required />
              <input className="form-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <input className="form-input" name="phone" placeholder="Телефон" value={form.phone} onChange={handleChange} />
              <input className="form-input" name="password" type="password" placeholder="Пароль" value={form.password} onChange={handleChange} required />
              <input className="form-input" name="subjects" placeholder="Предметы (через запятую)" value={form.subjects} onChange={handleChange} required />
              <textarea className="form-input" name="bio" placeholder="Биография (необязательно)" value={form.bio} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
