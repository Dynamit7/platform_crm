import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function AdminCourses() {
  const { add } = useToast();
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration: '', price: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const createCourse = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/courses', { ...form, price: parseFloat(form.price) });
      if (add) add('Курс создан', 'success');
      setShowForm(false);
      setForm({ title: '', description: '', duration: '', price: '' });
      const { data } = await api.get('/api/courses');
      setCourses(data);
    } catch { if (add) add('Ошибка', 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Курсы</h1>
          <p>Всего: {courses.length}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Отмена' : '+ Новый курс'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Новый курс</h3>
          <form onSubmit={createCourse}>
            <div className="form-group"><label>Название</label><input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label>Описание</label><textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Длительность</label><input type="text" className="form-input" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="3 месяца" /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Цена (сум)</label><input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Создание...' : 'Создать'}</button>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Название</th><th>Описание</th><th>Длительность</th><th>Цена</th><th>Статус</th></tr></thead>
            <tbody>
              {courses.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет курсов</td></tr>}
              {courses.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</td>
                  <td>{c.duration || '—'}</td>
                  <td><strong>{c.price?.toLocaleString()} сум</strong></td>
                  <td>{c.is_active ? <span className="badge badge-grade">Активен</span> : <span className="badge badge-overdue">Неактивен</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
