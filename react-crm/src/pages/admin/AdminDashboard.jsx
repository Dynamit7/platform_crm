import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

/* ── SVG Icons ── */
const IconStudents = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5"/>
  </svg>
);
const IconTeachers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
);
const IconGroups = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconTarget = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconMsg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconHW = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconOnline = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1"/>
  </svg>
);
const IconFunnel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconRetention = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c-.6-.38-1.58-.94-3-1.5C7.5 18.5 6 17.44 5 16.5c-1.5-1.5-2-3.5-2-5.5 0-4.5 3.5-7 9-7 5.5 0 9 2.5 9 7 0 2-.5 4-2 5.5-1 .94-2.5 2-4 2.94-1.42.56-2.4 1.12-3 1.5z"/>
  </svg>
);
const IconCal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const GROUP_ICON_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#6366f1'];

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

function genSpark(base) {
  return Array.from({ length: 7 }, () => Math.max(0, base + Math.floor((Math.random() - 0.5) * 20)));
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1; const w = 72, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ad-sparkline">
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" points={pts} />
    </svg>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    new: { cls: 'ad-badge--blue', label: 'Новый' },
    contacted: { cls: 'ad-badge--yellow', label: 'Связан' },
    enrolled: { cls: 'ad-badge--green', label: 'Зачислен' },
    lost: { cls: 'ad-badge--red', label: 'Потерян' },
  }[status] || { cls: 'ad-badge--muted', label: status };
  return <span className={`ad-badge ${cfg.cls}`}>{cfg.label}</span>;
}

function OnlineDot({ size = 8 }) {
  return (
    <span style={{ display: 'inline-flex', position: 'relative', width: size, height: size }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.4, animation: 'ad-pulse 2s infinite' }} />
      <span style={{ position: 'absolute', inset: '1.5px', borderRadius: '50%', background: '#22c55e' }} />
    </span>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toggle, theme } = useTheme();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  if (loading) {
    return <div className="page-content"><div className="page-loading"><div className="spinner" /></div></div>;
  }

  const kpis = [
    { label: 'Студентов', value: stats?.total_students ?? 0, icon: IconStudents, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Преподавателей', value: stats?.total_teachers ?? 0, icon: IconTeachers, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Активных групп', value: stats?.total_groups ?? 0, icon: IconGroups, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Доход в месяц', value: stats?.monthly_revenue != null ? `${Number(stats.monthly_revenue).toLocaleString()} сум` : '—', icon: IconWallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Конверсия', value: `${stats?.lead_conversion_rate ?? 0}%`, icon: IconFunnel, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Посещаемость', value: `${stats?.attendance_rate ?? 0}%`, icon: IconCheckCircle, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { label: 'Retention', value: `${stats?.retention_rate ?? 0}%`, icon: IconRetention, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { label: 'ДЗ на проверке', value: stats?.pending_homeworks ?? 0, icon: IconHW, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  ];

  const dailyRev = stats?.daily_revenue || [];
  const maxRev = Math.max(...dailyRev.map(d => d.total), 1);
  const total30 = dailyRev.reduce((s, d) => s + d.total, 0);
  const recentLeads = stats?.recent_leads || [];
  const todaySchedule = stats?.today_schedule || [];
  const activeGroups = stats?.active_groups || [];
  const activity = stats?.activity || [];
  const onlineNow = stats?.online_now ?? 0;

  return (
    <div className="page-content">
      {/* ═══ Welcome Header ═══ */}
      <div className="ad-welcome">
        <div>
          <h1 className="ad-welcome-title">Панель управления</h1>
          <p className="ad-welcome-sub">{dayName}, {dateStr}</p>
        </div>
        <div className="ad-welcome-actions">
          <button className="ad-btn ad-btn--outline" onClick={() => nav('/chat')}><IconMsg /> Чат</button>
          <button className="ad-btn ad-btn--icon" onClick={toggle} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </div>

      {/* ═══ KPI Grid (8 cards) ═══ */}
      <div className="ad-kpi-grid">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const sp = genSpark(typeof kpi.value === 'number' ? kpi.value : 50);
          return (
            <div key={kpi.label} className="ad-kpi-card" style={{ '--accent': kpi.color }}>
              <div className="ad-kpi-top">
                <div className="ad-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}><Icon /></div>
                <Sparkline data={sp} color={kpi.color} />
              </div>
              <div className="ad-kpi-label">{kpi.label}</div>
              <div className="ad-kpi-value">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* ═══ Online Now + Quick Actions ═══ */}
      <div className="ad-top-row">
        <div className="ad-online-card">
          <div className="ad-online-icon"><IconOnline /></div>
          <div className="ad-online-body">
            <div className="ad-online-value"><OnlineDot /> {onlineNow}</div>
            <div className="ad-online-label">Онлайн сейчас</div>
          </div>
          <div className="ad-online-avatars">
            {onlineNow > 0 && <span className="ad-online-note">{onlineNow} чел. активно</span>}
            {onlineNow === 0 && <span className="ad-online-note">Нет активных</span>}
          </div>
        </div>
        <div className="ad-actions-row">
          <button className="ad-action-btn" onClick={() => nav('/admin/leads')}>
            <span className="ad-action-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><IconPlus /></span>
            <span className="ad-action-label">Новая заявка</span>
          </button>
          <button className="ad-action-btn" onClick={() => nav('/admin/groups')}>
            <span className="ad-action-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}><IconPlus /></span>
            <span className="ad-action-label">Создать группу</span>
          </button>
          <button className="ad-action-btn" onClick={() => nav('/admin/teachers')}>
            <span className="ad-action-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><IconPlus /></span>
            <span className="ad-action-label">Добавить преподавателя</span>
          </button>
        </div>
      </div>

      {/* ═══ Revenue Chart (full width) ═══ */}
      <div className="ad-section ad-section--wide">
        <div className="ad-section-header">
          <h2><IconWallet /> Доход за 30 дней</h2>
          <span className="ad-chart-total">{total30.toLocaleString()} сум</span>
        </div>
        <div className="ad-chart-body">
          {dailyRev.length === 0 ? (
            <div className="ad-empty" style={{ width: '100%' }}>
              <p>Нет данных о доходах за последние 30 дней</p>
            </div>
          ) : (
            dailyRev.map((d, i) => {
              const pct = maxRev > 0 ? (d.total / maxRev) * 100 : 0;
              const date = new Date(d.date);
              const isToday = i === dailyRev.length - 1;
              return (
                <div key={i} className="ad-chart-col">
                  <div className="ad-chart-bar-wrap">
                    <div className={`ad-chart-bar ${isToday ? 'ad-chart-bar--today' : ''}`} style={{ height: `${Math.max(pct, 1.5)}%` }}>
                      <div className="ad-chart-tooltip">{d.total.toLocaleString()} сум</div>
                    </div>
                  </div>
                  <div className={`ad-chart-label ${isToday ? 'ad-chart-label--today' : ''}`}>
                    {i % 5 === 0 || isToday ? `${date.getDate()}/${date.getMonth() + 1}` : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ Two-column: Schedule + Groups ═══ */}
      <div className="ad-grid-2col">
        {/* Today's Schedule */}
        <div className="ad-section">
          <div className="ad-section-header">
            <h2><IconCal /> Сегодняшнее расписание</h2>
            <button className="ad-section-link" onClick={() => nav('/admin/groups')}>Все группы <IconChevronRight /></button>
          </div>
          <div className="ad-lesson-list">
            {todaySchedule.length === 0 ? (
              <div className="ad-schedule-empty">
                <div className="ad-schedule-empty-icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h4>Сегодня занятий нет</h4>
                <p>Отличный день для планирования и методической работы</p>
                <button className="ad-empty-btn" onClick={() => nav('/admin/groups')}>
                  <IconPlus /> Создать занятие
                </button>
              </div>
            ) : (
              todaySchedule.map(lesson => (
                <div key={lesson.id} className={`ad-lesson-card ${lesson.is_completed ? 'ad-lesson-card--done' : ''}`}>
                  <div className="ad-lesson-time"><IconClock /><span>{lesson.time}</span></div>
                  <div className="ad-lesson-body">
                    <div className="ad-lesson-group">{lesson.group_name}</div>
                    <div className="ad-lesson-topic">{lesson.topic}</div>
                    <div className="ad-lesson-meta">
                      <span><IconUsers /> {lesson.students}</span>
                      {lesson.teacher_name && <span>{lesson.teacher_name}</span>}
                    </div>
                  </div>
                  {lesson.is_completed ? (
                    <span className="ad-lesson-done-badge">Проведён</span>
                  ) : (
                    <button className="ad-lesson-start" onClick={() => nav(`/admin/groups?group=${lesson.group_id}`)}><IconPlay /></button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Groups */}
        <div className="ad-section">
          <div className="ad-section-header">
            <h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> Активные группы</h2>
            <button className="ad-section-link" onClick={() => nav('/admin/groups')}>Все <IconChevronRight /></button>
          </div>
          <div className="ad-groups-scroll">
            {activeGroups.length === 0 ? (
              <div className="ad-empty">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <p>Нет активных групп</p>
              </div>
            ) : (
              activeGroups.map((g, i) => (
                <div key={g.id} className="ad-group-card" onClick={() => nav(`/admin/groups?group=${g.id}`)}>
                  <div className="ad-group-icon" style={{ background: GROUP_ICON_COLORS[i % GROUP_ICON_COLORS.length] }}>
                    {g.name?.charAt(0)?.toUpperCase() || 'Г'}
                  </div>
                  <div className="ad-group-info">
                    <div className="ad-group-name">{g.name}</div>
                    <div className="ad-group-course">{g.course_name} — {g.teacher_name}</div>
                  </div>
                  <div className="ad-group-students">
                    <div className="ad-group-count">{g.students}<span>/{g.max_students}</span></div>
                    <div className="ad-group-bar"><div className="ad-group-fill" style={{ width: `${Math.min(100, (g.students / (g.max_students || 1)) * 100)}%` }} /></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══ New Leads + Recent Activity ═══ */}
      <div className="ad-grid-2col">
        {/* New Leads */}
        <div className="ad-section">
          <div className="ad-section-header">
            <h2><IconTarget /> Новые заявки</h2>
            <button className="ad-section-link" onClick={() => nav('/admin/leads')}>Все заявки <IconChevronRight /></button>
          </div>
          <div className="ad-leads-list">
            {recentLeads.length === 0 ? (
              <div className="ad-empty">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <p>Новых заявок нет</p>
              </div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="ad-lead-card">
                  <div className="ad-lead-body">
                    <div className="ad-lead-name">{lead.name}</div>
                    <div className="ad-lead-phone">{lead.phone}</div>
                    <div className="ad-lead-meta"><StatusBadge status={lead.status} /> {lead.course_name && <span className="ad-lead-course">{lead.course_name}</span>}</div>
                  </div>
                  <div className="ad-lead-actions">
                    <button className="ad-lead-btn ad-lead-btn--accept" title="Принять" onClick={() => nav(`/admin/leads?convert=${lead.id}`)}><IconCheck /></button>
                    <button className="ad-lead-btn ad-lead-btn--reject" title="Отклонить" onClick={() => nav(`/admin/leads?reject=${lead.id}`)}><IconX /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="ad-section">
          <div className="ad-section-header">
            <h2><IconBell /> Недавняя активность</h2>
          </div>
          {activity.length === 0 ? (
            <div className="ad-empty"><p>Пока нет активности</p></div>
          ) : (
            <div className="ad-activity-list">
              {activity.map((item, i) => (
                <div key={i} className="ad-activity-item">
                  <div className={`ad-activity-dot ${item.type === 'lead' ? 'ad-dot--lead' : item.type === 'homework' ? 'ad-dot--hw' : 'ad-dot--notif'}`} />
                  <span className="ad-activity-text">{item.text}</span>
                  <span className="ad-activity-time">{TimeAgo(item.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Footer stats ═══ */}
      <div className="ad-footer-stats">
        <div className="ad-footer-stat">
          <span className="ad-footer-label">Всего заявок</span>
          <span className="ad-footer-value">{stats?.total_leads ?? '—'}</span>
        </div>
        <div className="ad-footer-stat">
          <span className="ad-footer-label">Активных записей</span>
          <span className="ad-footer-value">{stats?.active_enrollments ?? '—'}</span>
        </div>
        <div className="ad-footer-stat">
          <span className="ad-footer-label">Общий доход</span>
          <span className="ad-footer-value">{stats?.total_revenue != null ? `${Number(stats.total_revenue).toLocaleString()} сум` : '—'}</span>
        </div>
        <div className="ad-footer-stat">
          <span className="ad-footer-label">Курсов</span>
          <span className="ad-footer-value">{stats?.total_courses ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
