import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Schedule() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/dashboard/${user?.id}`).then(({ data }) => setData(data)).catch(() => {});
  }, [user?.id]);

  const upcoming = data?.upcoming_lesson;
  const schedule = data?.schedule || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Расписание</h1>
          <p>{schedule.filter(s => s.has_lesson).length} учебных дней на этой неделе</p>
        </div>
      </div>

      {upcoming && (
        <div className="panel" style={{ marginBottom: 24, border: '1px solid rgba(37,99,235,0.2)' }}>
          <div className="panel-header" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(6,182,212,0.03))' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Ближайший урок
            </h2>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{upcoming.title}</h3>
                <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalIcon /> {upcoming.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClockIcon /> {upcoming.time}</span>
                  <span>Преподаватель: {upcoming.teacher}</span>
                </div>
              </div>
              {upcoming.zoom_link && (
                <a href={upcoming.zoom_link} target="_blank" rel="noreferrer"
                  className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <VideoIcon /> Открыть Zoom
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="tg-table-wrap">
        <table className="tg-table">
          <thead>
            <tr>
              <th>День</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {schedule.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <div className="tg-empty" style={{ padding: '40px 20px' }}>
                    <div className="tg-empty-title">Нет расписания</div>
                    <div className="tg-empty-desc">Расписание появится после записи на курс</div>
                  </div>
                </td>
              </tr>
            )}
            {schedule.map((s, i) => (
              <tr key={i} style={{ background: s.active ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
                <td>
                  <div className="tg-name" style={{ color: s.active ? 'var(--blue-600)' : 'var(--text)' }}>
                    {s.day}
                  </div>
                </td>
                <td>
                  <div className="tg-muted">{s.date} число</div>
                </td>
                <td>
                  {s.active && s.has_lesson ? (
                    <span className="tg-badge tg-badge--green"><span className="tg-badge-dot" /> Сегодня</span>
                  ) : s.active ? (
                    <span className="tg-badge" style={{ background: '#f59e0b1a', color: 'var(--warning)' }}>Сегодня</span>
                  ) : s.has_lesson ? (
                    <span className="tg-badge tg-badge--green"><span className="tg-badge-dot" /> Урок</span>
                  ) : (
                    <span className="tg-badge tg-badge--gray"><span className="tg-badge-dot" /> Выходной</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
