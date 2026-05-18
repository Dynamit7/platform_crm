import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function AdminStudents() {
  const { add } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get(`/api/admin/students?search=${search}`).then(({ data }) => setStudents(data)).catch(() => {});
  }, [search]);

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/users/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const filtered = students.filter(s => {
    if (filterStatus === 'active') return s.is_active;
    if (filterStatus === 'frozen') return !s.is_active;
    return true;
  });

  const activeCount = students.filter(s => s.is_active).length;
  const frozenCount = students.filter(s => !s.is_active).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Студенты</h1>
          <p>Всего: {students.length} • Активных: {activeCount} • Заморожено: {frozenCount}</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="Поиск по имени, email, телефону..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320, flex: 1 }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="frozen">Замороженные</option>
        </select>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Имя</th><th>Email</th><th>Телефон</th><th>Группы</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет студентов</td></tr>}
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.email}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{(s.groups || []).join(', ') || '—'}</td>
                  <td>{s.is_active ? <span className="badge badge-grade">Активен</span> : <span className="badge badge-overdue">Заморожен</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-outline btn-icon" onClick={() => setDetail(detail === s.id ? null : s)} title="Детали">👤</button>
                    <button className="btn btn-sm btn-outline btn-icon" onClick={() => toggleActive(s.id)} title={s.is_active ? 'Заморозить' : 'Активировать'}>
                      {s.is_active ? '⛔' : '✅'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <div className="modal-hdr">
              <h3>{detail.name}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><strong>Email:</strong> {detail.email}</div>
              <div><strong>Телефон:</strong> {detail.phone || '—'}</div>
              <div><strong>Статус:</strong> {detail.is_active ? '✅ Активен' : '⛔ Заморожен'}</div>
              <div><strong>Группы:</strong> {(detail.groups || []).join(', ') || '—'}</div>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => toggleActive(detail.id)}>
                  {detail.is_active ? '⛔ Заморозить' : '✅ Активировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
