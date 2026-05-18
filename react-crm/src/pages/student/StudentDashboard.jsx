import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const IconBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IconPen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconZap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconStar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

function SparkLine({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const w = 80, h = 36;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sd-sparkline">
      <polyline fill="none" stroke={color || '#3b82f6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" points={points.join(' ')} />
    </svg>
  );
}

function genSpark(base) {
  return Array.from({ length: 7 }, () => Math.max(0, base + Math.floor((Math.random() - 0.5) * 20)));
}

function CircleProgress({ pct, size = 44, stroke = 4, color = '#3b82f6' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})} `}
        strokeLinecap="round" />
    </svg>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/${user.id}`).then(({ data }) => {
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

  const stats = data?.stats || {};
  const enrollments = data?.enrollments || [];
  const upcoming = data?.upcoming_lesson;
  const homeworks = data?.homeworks || [];
  const schedule = data?.schedule || [];
  const vocabulary = data?.vocabulary || [];
  const pendingHW = homeworks.filter(h => !h.is_submitted && !h.is_overdue).length;
  const overdueHW = homeworks.filter(h => h.is_overdue).length;
  const notificationsCount = data?.notifications_count || 0;

  const kpis = [
    { label: 'Мои курсы', value: enrollments.length, icon: IconBook, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'ДЗ ожидают', value: pendingHW, icon: IconPen, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', sub: overdueHW > 0 ? `${overdueHW} просрочено` : null, trend: overdueHW > 0 ? 'down' : null },
    { label: 'Всего XP', value: stats.xp || 0, icon: IconZap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Уровень', value: stats.level || '—', icon: IconStar, color: '#10b981', bg: 'rgba(16,185,129,0.1)', sub: `${stats.lessons_completed || 0}/${stats.lessons_total || 0} уроков` },
  ];

  return (
    <div className="page-content">
      {/* ═══ Welcome Header ═══ */}
      <div className="sd-welcome">
        <div className="sd-welcome-bg" />
        <div className="sd-welcome-content">
          <div className="sd-welcome-text">
            <h1 className="sd-welcome-title">{user?.name ? `Привет, ${user.name.split(' ')[0]}!` : 'Дашборд'}</h1>
            <p className="sd-welcome-sub">{dayName}, {dateStr}</p>
          </div>
          <div className="sd-welcome-actions">
            <Link to="/chat" className="sd-action-btn sd-action-btn--primary">
              <IconBell /> {notificationsCount > 0 && <span className="sd-action-badge">{notificationsCount}</span>}
              Чат
            </Link>
            <Link to="/schedule" className="sd-action-btn sd-action-btn--outline">
              <IconCal /> Расписание
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ KPI Grid ═══ */}
      <div className="sd-kpi-grid">
        {kpis.map((kpi, i) => {
          const sp = genSpark(typeof kpi.value === 'number' ? kpi.value : 5);
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="sd-kpi-card" style={{ '--accent': kpi.color }}>
              <div className="sd-kpi-top">
                <div className="sd-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                  <Icon />
                </div>
                <SparkLine data={sp} color={kpi.color} />
              </div>
              <div className="sd-kpi-info">
                <div className="sd-kpi-label">{kpi.label}</div>
                <div className="sd-kpi-value">{kpi.value}</div>
                {kpi.sub && (
                  <div className={`sd-kpi-sub ${kpi.trend === 'down' ? 'sd-kpi-sub--down' : ''}`}>
                    {kpi.trend === 'down' && <IconTrendUp />}
                    {kpi.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Two-column: Upcoming + Schedule ═══ */}
      <div className="sd-grid-2col">
        {/* ─── Upcoming Lesson ─── */}
        <div className="sd-section">
          <div className="sd-section-header">
            <h2><IconVideo /> Ближайший урок</h2>
          </div>
          {upcoming ? (
            <div className="sd-upcoming-card">
              <div className="sd-upcoming-date">
                <span className="sd-upcoming-date-num">{upcoming.date?.split('.')[0]}</span>
                <span className="sd-upcoming-date-mon">{upcoming.date?.split('.')[1]}</span>
              </div>
              <div className="sd-upcoming-body">
                <h3 className="sd-upcoming-topic">{upcoming.title}</h3>
                <div className="sd-upcoming-meta">
                  <span><IconClock /> {upcoming.time}</span>
                  <span><IconCal /> {upcoming.date}</span>
                </div>
                <div className="sd-upcoming-footer">
                  <span className="sd-upcoming-teacher">{upcoming.teacher}</span>
                  {upcoming.zoom_link && (
                    <a href={upcoming.zoom_link} target="_blank" rel="noreferrer" className="sd-upcoming-zoom">
                      <IconVideo /> Zoom
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-empty">
              <div className="sd-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p>Нет ближайших уроков</p>
            </div>
          )}
        </div>

        {/* ─── Weekly Schedule ─── */}
        <div className="sd-section">
          <div className="sd-section-header">
            <h2><IconCal /> Расписание</h2>
            <Link to="/schedule" className="sd-section-link">
              Все дни <IconChevronRight />
            </Link>
          </div>
          <div className="sd-calendar">
            {schedule.map((s, i) => (
              <div key={i} className={`sd-cal-day ${s.active ? 'sd-cal-day--active' : ''} ${s.has_lesson ? 'sd-cal-day--has' : ''}`}>
                <div className="sd-cal-day-name">{s.day}</div>
                <div className="sd-cal-day-num">{s.date}</div>
                {s.has_lesson && <div className="sd-cal-dot" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Two-column: Homeworks + Vocabulary ═══ */}
      <div className="sd-grid-2col">
        {/* ─── Homeworks ─── */}
        <div className="sd-section">
          <div className="sd-section-header">
            <h2><IconPen /> Домашние задания</h2>
            <Link to="/homeworks" className="sd-section-link">
              Все <IconChevronRight />
            </Link>
          </div>
          {homeworks.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p>Нет заданий</p>
            </div>
          ) : (
            <div className="sd-hw-list">
              {homeworks.slice(0, 4).map(hw => (
                <div key={hw.id} className={`sd-hw-card ${hw.is_overdue && !hw.is_submitted ? 'sd-hw-card--overdue' : ''}`}>
                  <div className="sd-hw-info">
                    <div className="sd-hw-title">{hw.title}</div>
                    <div className="sd-hw-date">{new Date(hw.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="sd-hw-status">
                    {hw.grade ? (
                      <span className="sd-badge sd-badge--grade">{hw.grade}</span>
                    ) : hw.is_submitted ? (
                      <span className="sd-badge sd-badge--warn">На проверке</span>
                    ) : hw.is_overdue ? (
                      <span className="sd-badge sd-badge--danger">Просрочено</span>
                    ) : (
                      <span className="sd-badge sd-badge--gray">Ожидается</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Vocabulary ─── */}
        <div className="sd-section">
          <div className="sd-section-header">
            <h2><IconBook /> Словарь</h2>
          </div>
          {vocabulary.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <p>Словарь пуст</p>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Новые слова появятся после уроков</span>
            </div>
          ) : (
            <div className="sd-vocab-list">
              {vocabulary.map((w, i) => {
                const colors = ['#3b82f6','#8b5cf6','#db2777','#ea580c','#10b981'];
                const c = colors[i % colors.length];
                return (
                  <div key={i} className="sd-vocab-card">
                    <CircleProgress pct={Math.min(w.progress, 100)} color={w.progress > 50 ? '#10b981' : '#f59e0b'} />
                    <div className="sd-vocab-info">
                      <div className="sd-vocab-word">{w.word}</div>
                      <div className="sd-vocab-trans">{w.translation}</div>
                    </div>
                    <div className="sd-vocab-pct">{w.progress}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
