import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ── SVG Icons ── */
const IconGroups = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconStudents = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconHomework = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconMessageCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const avatarColors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#4f46e5','#be185d'];
const avatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];

function TimeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/* ── Sparkline ── */
function SparkLine({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 36;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="td-sparkline">
      <polyline fill="none" stroke={color || '#3b82f6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" points={points.join(' ')} />
    </svg>
  );
}

/* ── KPI data generators ── */
function genSparkData(base, variance) {
  return Array.from({ length: 7 }, (_, i) => Math.max(0, base + Math.floor((Math.random() - 0.5) * variance * 2)));
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/dashboard/${user.id}`).then(({ data }) => {
      setData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-loading"><div className="spinner" /></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Моих групп', value: data?.groups_count ?? 0, icon: IconGroups, color: '#3b82f6', sparkColor: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Всего студентов', value: data?.t_students ?? 0, icon: IconStudents, color: '#10b981', sparkColor: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Занятий сегодня', value: data?.today_lessons ?? 0, icon: IconCalendar, color: '#8b5cf6', sparkColor: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Посещаемость', value: `${data?.attendance_rate ?? 0}%`, icon: IconCheckCircle, color: '#f59e0b', sparkColor: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'ДЗ на проверке', value: data?.t_pending ?? 0, icon: IconHomework, color: '#ef4444', sparkColor: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Новых сообщений', value: data?.unread_messages ?? 0, icon: IconMessageCircle, color: '#06b6d4', sparkColor: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  ];

  return (
    <div className="page-content">
      {/* ═══ Welcome Header ═══ */}
      <div className="td-welcome">
        <div className="td-welcome-text">
          <h1 className="td-welcome-title">Добро пожаловать, {user?.name || 'Преподаватель'}!</h1>
          <p className="td-welcome-sub">{dayName}, {dateStr}</p>
        </div>
        <div className="td-welcome-actions">
          <button className="td-action-btn td-action-btn--primary" onClick={() => nav('/chat')}>
            <IconMessageCircle /> Чат
          </button>
          <button className="td-action-btn td-action-btn--outline" onClick={() => nav('/teacher/lessons')}>
            <IconCalendar /> Уроки
          </button>
        </div>
      </div>

      {/* ═══ KPI Grid ═══ */}
      <div className="td-kpi-grid">
        {kpis.map((kpi, i) => {
          const sparkData = genSparkData(typeof kpi.value === 'number' ? kpi.value : 50, 15);
          const Icon = kpi.icon;
          return (
              <div key={kpi.label} className="td-kpi-card" style={{ '--accent': kpi.color }}>
              <div className="td-kpi-top">
                <div className="td-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                  <Icon />
                </div>
                <SparkLine data={sparkData} color={kpi.sparkColor} />
              </div>
              <div className="td-kpi-info">
                <div className="td-kpi-label">{kpi.label}</div>
                <div className="td-kpi-value">{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Two-column layout ═══ */}
      <div className="td-grid-2col">

        {/* ─── Today's Schedule ─── */}
        <div className="td-section">
          <div className="td-section-header">
            <h2>
              <IconCalendar />
              Сегодняшнее расписание
            </h2>
            <button className="td-section-link" onClick={() => nav('/teacher/lessons')}>
              Все уроки <IconChevronRight />
            </button>
          </div>
          <div className="td-lesson-list">
            {(!data?.today_schedule || data.today_schedule.length === 0) ? (
              <div className="td-empty-state">
                <div className="td-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p>Сегодня занятий нет<br/>Отличный день для планирования!</p>
              </div>
            ) : (
              data.today_schedule.map((lesson) => (
                <div key={lesson.id} className={`td-lesson-card ${lesson.is_completed ? 'td-lesson-card--done' : ''}`}>
                  <div className="td-lesson-time">
                    <IconClock />
                    <span>{lesson.time}</span>
                  </div>
                  <div className="td-lesson-body">
                    <div className="td-lesson-group">{lesson.group_name}</div>
                    <div className="td-lesson-topic">{lesson.topic}</div>
                    <div className="td-lesson-meta">
                      <span><IconUsers /> {lesson.students} студентов</span>
                      {lesson.zoom_link && <span><IconVideo /> Zoom</span>}
                    </div>
                  </div>
                  {lesson.is_completed ? (
                    <div className="td-lesson-status-badge">Проведён</div>
                  ) : (
                    <button className="td-lesson-start-btn" onClick={() => nav(`/teacher/lessons?group=${lesson.group_id}`)}>
                      <IconPlay />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── My Groups ─── */}
        <div className="td-section">
          <div className="td-section-header">
            <h2>
              <IconGroups />
              Мои группы
            </h2>
            <button className="td-section-link" onClick={() => nav('/teacher/groups')}>
              Все группы <IconChevronRight />
            </button>
          </div>
          <div className="td-groups-scroll">
            {(!data?.groups || data.groups.length === 0) ? (
              <div className="td-empty-state">
                <div className="td-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <p>У вас пока нет групп</p>
              </div>
            ) : (
              data.groups.map((g) => (
                <div key={g.id} className="td-group-card" onClick={() => nav(`/teacher/groups?group=${g.id}`)}>
                  <div className="td-group-icon" style={{ background: avatarColor(g.id) }}>
                    {g.name?.charAt(0)?.toUpperCase() || 'Г'}
                  </div>
                  <div className="td-group-info">
                    <div className="td-group-name">{g.name}</div>
                    <div className="td-group-course">{g.course_name}</div>
                  </div>
                  <div className="td-group-students">
                    <div className="td-group-students-count">{g.students}<span>/{g.max_students}</span></div>
                    <div className="td-group-bar">
                      <div className="td-group-bar-fill" style={{ width: `${Math.min(100, (g.students / (g.max_students || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══ Recent Activity ═══ */}
      <div className="td-section td-section--full">
        <div className="td-section-header">
          <h2>
            <IconBell />
            Недавняя активность
          </h2>
          <button className="td-section-link" onClick={() => nav('/teacher/homeworks')}>
            Все ДЗ <IconChevronRight />
          </button>
        </div>
        {(!data?.activity || data.activity.length === 0) ? (
          <div className="td-empty-state" style={{ padding: '40px' }}>
            <p style={{ color: 'var(--muted)' }}>Пока нет активности</p>
          </div>
        ) : (
          <div className="td-activity-list">
            {data.activity.map((item, i) => (
              <div key={i} className="td-activity-item">
                <div className={`td-activity-dot ${item.type === 'homework' ? 'td-activity-dot--hw' : 'td-activity-dot--notif'}`} />
                <div className="td-activity-text">{item.text}</div>
                <div className="td-activity-time">{TimeAgo(item.time)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
