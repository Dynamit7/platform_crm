import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function PendingUsers() {
  const { add } = useToast();
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState({});

  useEffect(() => {
    api.get('/api/admin/pending-users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const approve = async (id, role) => {
    setBusy({ ...busy, [id]: true });
    try {
      await api.patch(`/api/admin/pending-users/${id}/approve`, { role });
      if (add) add(`${role === 'teacher' ? 'Преподаватель' : 'Студент'} одобрен`, 'success');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { if (add) add('Ошибка', 'error'); } finally { setBusy({ ...busy, [id]: false }); }
  };

  const reject = async (id) => {
    if (!confirm('Отклонить заявку?')) return;
    setBusy({ ...busy, [id]: true });
    try {
      await api.patch(`/api/admin/pending-users/${id}/reject`, {});
      if (add) add('Заявка отклонена', 'success');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { if (add) add('Ошибка', 'error'); } finally { setBusy({ ...busy, [id]: false }); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Заявки на регистрацию</h1>
          <p>Ожидают подтверждения: {users.length}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: 'var(--muted)' }}>Нет заявок на рассмотрении</div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Имя</th><th>Email</th><th>Телефон</th><th>Дата</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => approve(u.id, 'student')} disabled={busy[u.id]}>✅ Студент</button>
                      <button className="btn btn-sm btn-outline" onClick={() => approve(u.id, 'teacher')} disabled={busy[u.id]}>👩‍🏫 Учитель</button>
                      <button className="btn btn-sm btn-outline" onClick={() => reject(u.id)} disabled={busy[u.id]} style={{ color: 'var(--danger)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
