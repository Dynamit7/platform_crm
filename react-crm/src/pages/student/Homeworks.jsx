import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const statusStyle = (hw) => {
  if (hw.grade) return { cls: 'tg-badge--green', label: `${hw.grade}` };
  if (hw.is_submitted) return { cls: '', style: { background: '#f59e0b1a', color: 'var(--warning)' }, label: 'На проверке' };
  if (hw.is_overdue) return { cls: '', style: { background: '#ef44441a', color: 'var(--danger)' }, label: 'Просрочено' };
  return { cls: 'tg-badge--gray', label: 'Ожидается' };
};

export default function Homeworks() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(`/api/student/${user?.id}/homeworks`).then(({ data }) => setHomeworks(data)).catch(() => {});
  }, [user?.id]);

  const filtered = search.trim()
    ? homeworks.filter(h => (h.title || '').toLowerCase().includes(search.toLowerCase()))
    : homeworks;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Домашние задания</h1>
          <p>{homeworks.length} заданий · {homeworks.filter(h => h.grade).length} оценено</p>
        </div>
      </div>

      <div className="tg-topbar">
        <div className="tg-search">
          <SearchIcon />
          <input type="text" placeholder="Поиск по заданиям..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="tg-empty" style={{ marginTop: 20 }}>
          <div className="tg-empty-title">{search ? 'Ничего не найдено' : 'Нет домашних заданий'}</div>
          <div className="tg-empty-desc">{search ? 'Попробуйте изменить запрос' : 'Задания появятся после начала курса'}</div>
        </div>
      ) : (
        <div className="tg-table-wrap">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Задание</th>
                <th style={{ width: 140 }}>Срок</th>
                <th style={{ width: 110 }}>Статус</th>
                <th style={{ width: 70 }}>Оценка</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(hw => {
                const s = statusStyle(hw);
                return (
                  <tr key={hw.id}>
                    <td>
                      <div className="tg-name">{hw.title}</div>
                      {hw.description && <div className="tg-muted" style={{ marginTop: 2 }}>{hw.description}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <CalIcon /> {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`tg-badge ${s.cls}`} style={s.style || {}}>
                        {s.cls && <span className="tg-badge-dot" />}
                        {s.label}
                      </span>
                    </td>
                    <td><div className="tg-name" style={{ color: hw.grade ? 'var(--success)' : 'var(--muted)' }}>{hw.grade || '—'}</div></td>
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
