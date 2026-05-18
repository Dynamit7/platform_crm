import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function Courses() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/dashboard/${user?.id}`).then(({ data }) => setData(data)).catch(() => {});
  }, [user?.id]);

  const enrollments = data?.enrollments || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Мои курсы</h1>
          <p>{enrollments.length} курс{enrollments.length !== 1 ? 'ов' : ''}</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="tg-empty" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--muted)' }}><BookIcon /></div>
          <div className="tg-empty-title">У вас пока нет курсов</div>
          <div className="tg-empty-desc">Курсы появятся после записи в группу</div>
        </div>
      ) : (
        <div className="tg-table-wrap">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Курс</th>
                <th style={{ width: '40%' }}>Прогресс</th>
                <th style={{ width: 140 }}>Дата записи</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="tg-name">{e.course?.title || '—'}</div>
                    {e.group_id && <div className="tg-muted" style={{ marginTop: 2 }}>Группа: {e.group_id}</div>}
                  </td>
                  <td>
                    <div className="tg-students-cell" style={{ minWidth: 'auto' }}>
                      <div className="tg-students-bar" style={{ maxWidth: '100%' }}>
                        <div className="tg-students-bar-fill" style={{ width: `${e.progress || 0}%` }} />
                      </div>
                      <span className="tg-students-count">{e.progress || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <CalIcon /> {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
