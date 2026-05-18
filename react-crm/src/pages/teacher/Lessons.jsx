import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BookIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function TeacherLessons() {
  const { user } = useAuth();
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ topic: '', lesson_date: '', lesson_time: '', homework: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/teacher/groups/${user?.id}`).then(({ data }) => setGroups(data)).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/api/groups/${selectedGroup}/lessons`).then(({ data }) => setLessons(data)).catch(() => setLessons([]));
    }
  }, [selectedGroup]);

  const createLesson = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const scheduled_at = form.lesson_date
        ? `${form.lesson_date}T${form.lesson_time || '10:00'}:00`
        : new Date().toISOString();
      await api.post('/api/lessons', { group_id: parseInt(selectedGroup), topic: form.topic, scheduled_at, homework: form.homework });
      if (add) add('Урок создан', 'success');
      setShowForm(false);
      setForm({ topic: '', lesson_date: '', lesson_time: '', homework: '' });
      const { data } = await api.get(`/api/groups/${selectedGroup}/lessons`);
      setLessons(data);
    } catch { if (add) add('Ошибка', 'error'); }
    finally { setBusy(false); }
  };

  const groupName = groups.find(g => g.id === selectedGroup)?.name || '';

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Уроки</h1>
          <p>{selectedGroup ? `Группа «${groupName}» — ${lessons.length} уроков` : 'Выберите группу'}</p>
        </div>
        <div className="page-header-right">
          {selectedGroup && (
            <button className="tg-btn tg-btn--primary" onClick={() => setShowForm(!showForm)}>
              <PlusIcon /> {showForm ? 'Отмена' : 'Создать урок'}
            </button>
          )}
        </div>
      </div>

      <div className="tg-topbar">
        <div className="tg-filter-select">
          <select value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value || null)}>
            <option value="">Выберите группу</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown />
        </div>
      </div>

      {!selectedGroup && (
        <div className="tg-empty" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--muted)' }}><BookIcon /></div>
          <div className="tg-empty-title">Выберите группу</div>
          <div className="tg-empty-desc">Выберите группу, чтобы управлять уроками</div>
        </div>
      )}

      {showForm && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header"><h2>Новый урок</h2></div>
          <div className="panel-body">
            <form onSubmit={createLesson}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Тема урока</label>
                <input type="text" className="form-input" placeholder="Введите тему урока"
                  value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Дата</label>
                  <input type="date" className="form-input"
                    value={form.lesson_date} onChange={e => setForm({ ...form, lesson_date: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Время</label>
                  <input type="time" className="form-input"
                    value={form.lesson_time} onChange={e => setForm({ ...form, lesson_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Домашнее задание</label>
                <textarea className="form-input" rows={3} placeholder="Описание ДЗ..."
                  value={form.homework} onChange={e => setForm({ ...form, homework: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Создание...' : 'Создать урок'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedGroup && lessons.length === 0 && (
        <div className="tg-empty" style={{ marginTop: 20 }}>
          <div className="tg-empty-title">Нет уроков</div>
          <div className="tg-empty-desc">Создайте первый урок для этой группы</div>
          <button className="tg-btn tg-btn--primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            <PlusIcon /> Создать урок
          </button>
        </div>
      )}

      {selectedGroup && lessons.length > 0 && (
        <div className="tg-table-wrap">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Тема</th>
                <th>Дата</th>
                <th>Время</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => {
                const dt = l.scheduled_at ? new Date(l.scheduled_at) : null;
                const dateStr = dt ? dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }) : '—';
                const timeStr = dt ? dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
                return (
                  <tr key={l.id}>
                    <td><div className="tg-name">{l.topic}</div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <CalIcon /> {dateStr}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <ClockIcon /> {timeStr}
                      </div>
                    </td>
                    <td>
                      <span className={`tg-badge ${l.is_completed ? 'tg-badge--green' : 'tg-badge--gray'}`}>
                        <span className="tg-badge-dot" />
                        {l.is_completed ? 'Проведён' : 'Запланирован'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
