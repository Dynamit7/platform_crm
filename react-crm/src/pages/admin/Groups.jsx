import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function AdminGroups() {
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', course_id: '', teacher_id: '', max_students: 20 });
  const [busy, setBusy] = useState(false);
  const [courseFilter, setCourseFilter] = useState('');

  const load = () => {
    api.get('/api/groups').then(({ data }) => setGroups(data)).catch(() => {});
    api.get('/api/courses').then(({ data }) => setCourses(data)).catch(() => {});
    api.get('/api/teachers').then(({ data }) => setTeachers(data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', course_id: '', teacher_id: '', max_students: 20 });
    setShowForm(true);
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setForm({ name: g.name, course_id: String(g.course_id || ''), teacher_id: String(g.teacher_id || ''), max_students: g.max_students });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, course_id: parseInt(form.course_id), teacher_id: form.teacher_id ? parseInt(form.teacher_id) : null, max_students: parseInt(form.max_students) };
      if (editId) {
        await api.put(`/api/groups/${editId}`, payload);
        if (add) add('Группа обновлена', 'success');
      } else {
        await api.post('/api/groups', payload);
        if (add) add('Группа создана', 'success');
      }
      setShowForm(false);
      setEditId(null);
      const { data } = await api.get('/api/groups');
      setGroups(data);
    } catch { if (add) add('Ошибка', 'error'); } finally { setBusy(false); }
  };

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/groups/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: !g.is_active } : g));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const filtered = courseFilter ? groups.filter(g => String(g.course_id) === courseFilter) : groups;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Группы</h1>
          <p>Всего: {groups.length}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={openCreate}>
            {showForm ? 'Отмена' : '+ Новая группа'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="form-input" value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Все курсы</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {showForm && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{editId ? '✏️ Редактирование' : '➕ Новая группа'}</span>}
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>{editId ? 'Редактировать группу' : 'Новая группа'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div className="form-group"><label>Название</label><input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>Курс</label>
                <select className="form-input" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                  <option value="">Выберите курс</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Преподаватель</label>
                <select className="form-input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                  <option value="">Не назначен</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Макс. студентов</label><input type="number" className="form-input" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} /></div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Сохранение...' : editId ? 'Обновить' : 'Создать'}</button>
              {editId && <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Отмена</button>}
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Название</th><th>Курс</th><th>Преподаватель</th><th>Студентов</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет групп</td></tr>}
              {filtered.map(g => (
                <tr key={g.id}>
                  <td><strong>{g.name}</strong></td>
                  <td>{g.course?.title || '—'}</td>
                  <td>{g.teacher?.name || '—'}</td>
                  <td>{g.current_students ?? '?'}/{g.max_students}</td>
                  <td>{g.is_active ? <span className="badge badge-grade">Активна</span> : <span className="badge badge-overdue">Неактивна</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline btn-icon" onClick={() => openEdit(g)} title="Редактировать">✏️</button>
                    <button className="btn btn-sm btn-outline btn-icon" onClick={() => toggleActive(g.id)} title={g.is_active ? 'Деактивировать' : 'Активировать'}>
                      {g.is_active ? '⛔' : '✅'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
