import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function AdminPayments() {
  const { add } = useToast();
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_id: '', amount: '', method: 'cash', description: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/payments?status=${filter}`).then(({ data }) => setPayments(data)).catch(() => {});
    api.get('/api/admin/students').then(({ data }) => setStudents(data)).catch(() => {});
  }, [filter]);

  const createPayment = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/payments', { ...form, student_id: parseInt(form.student_id), amount: parseFloat(form.amount) });
      if (add) add('Платёж создан', 'success');
      setShowForm(false);
      setForm({ student_id: '', amount: '', method: 'cash', description: '' });
      const { data } = await api.get(`/api/payments?status=${filter}`);
      setPayments(data);
    } catch { if (add) add('Ошибка', 'error'); } finally { setBusy(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/payments/${id}/status`, { status });
      if (add) add('Статус обновлён', 'success');
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const totalAmount = payments.reduce((sum, p) => sum + (p.status === 'paid' ? (p.amount || 0) : 0), 0);
  const pendingTotal = payments.reduce((sum, p) => sum + (p.status === 'pending' ? (p.amount || 0) : 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Платежи</h1>
          <p>Всего операций: {payments.length}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Отмена' : '+ Платёж'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="panel" style={{ flex: 1, minWidth: 160, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Оплачено</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>{totalAmount.toLocaleString()} сум</div>
        </div>
        <div className="panel" style={{ flex: 1, minWidth: 160, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Ожидает</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)', marginTop: 2 }}>{pendingTotal.toLocaleString()} сум</div>
        </div>
        <div className="panel" style={{ flex: 1, minWidth: 160, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Всего</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{(totalAmount + pendingTotal).toLocaleString()} сум</div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="paid">Оплачены</option>
          <option value="failed">Отклонены</option>
          <option value="refunded">Возвращены</option>
        </select>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Новый платёж</h3>
          <form onSubmit={createPayment}>
            <div className="form-group"><label>Студент</label>
              <select className="form-input" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required>
                <option value="">Выберите студента</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Сумма</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Метод</label>
                <select className="form-input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="cash">Наличные</option>
                  <option value="card">Карта</option>
                  <option value="transfer">Перевод</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Описание</label><input type="text" className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Создание...' : 'Создать'}</button>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Студент</th><th>Сумма</th><th>Метод</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет платежей</td></tr>}
              {payments.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.student?.name || '—'}</strong></td>
                  <td><strong>{p.amount?.toLocaleString()}</strong> {p.currency || 'сум'}</td>
                  <td>{p.method}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    {p.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success btn-icon" onClick={() => updateStatus(p.id, 'paid')} title="Подтвердить">✅</button>
                        <button className="btn btn-sm btn-outline btn-icon" onClick={() => updateStatus(p.id, 'failed')} title="Отклонить">❌</button>
                      </>
                    )}
                    {p.status === 'paid' && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Подтверждён</span>}
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
