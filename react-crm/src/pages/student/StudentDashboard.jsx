import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ── Icons ── */
const SBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const SHW = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const SStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const SVideo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const SWallet = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const SCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const SArrowDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

/* ── Inline styles ── */
const s = {
  page: {
    padding: '28px 32px',
    maxWidth: 1280,
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif',
  },
  welcome: {
    position: 'relative',
    borderRadius: 20,
    padding: '32px 36px',
    marginBottom: 28,
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #0891b2 100%)',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeBg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  welcomeText: { position: 'relative', zIndex: 1 },
  welcomeTitle: { fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 },
  welcomeSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  welcomeActions: { display: 'flex', gap: 10, position: 'relative', zIndex: 1 },
  welcomeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
  },
  welcomeBtnPrimary: {
    background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(6px)',
  },
  welcomeBtnOutline: {
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)',
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24,
  },
  grid3: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24,
  },
  card: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    padding: 20, transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 },
  cardLink: { fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', textDecoration: 'none' },
};

/* ── KPI Card ── */
function KpiCard({ icon: Icon, value, label, sub, color, trend }) {
  return (
    <div style={{
      ...s.card, cursor: 'default', padding: 22,
      borderLeft: `3px solid ${color}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? <SArrowUp /> : <SArrowDown />}{Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Course Progress Card ── */
function CourseCard({ course }) {
  return (
    <div style={{
      ...s.card, padding: 16,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        {course.course?.title || 'Курс'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${course.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #0891b2)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>{course.progress || 0}%</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12, marginTop: 6 }}>
        <span>XP: {course.xp || 0}</span>
      </div>
    </div>
  );
}

/* ── Attendance Dot Chart ── */
function AttChart({ trend }) {
  if (!trend || trend.length === 0) return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Нет данных</div>;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', height: 80, paddingTop: 8 }}>
      {trend.map((t, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: t.attended ? '#10b98118' : '#ef444418',
            color: t.attended ? '#10b981' : '#ef4444',
            fontSize: 12, fontWeight: 700,
          }}>
            {t.attended ? <SCheck /> : <SX />}
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.date}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mini Payment Row ── */
function PaymentRow({ p }) {
  const statusColors = { paid: '#10b981', pending: '#f59e0b', failed: '#ef4444', refunded: '#8b5cf6' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.description || 'Оплата'}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.date}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {Number(p.amount).toLocaleString()} {p.currency || 'UZS'}
        </div>
        {p.method === 'card' && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.method === 'online' ? 'Онлайн' : p.method === 'card' ? 'Карта' : p.method === 'cash' ? 'Наличные' : p.method}</span>}
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/${user.id}`).then(({ data }) => {
      setData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  // Countdown timer for upcoming lesson
  useEffect(() => {
    if (!data?.upcoming_lesson?.date) return;
    const parsed = data.upcoming_lesson.date?.split('.').reverse().join('-');
    if (!parsed) return;
    const lessonDate = new Date(parsed + 'T' + (data.upcoming_lesson.time || '00:00'));
    if (isNaN(lessonDate.getTime())) return;

    const tick = () => {
      const diff = lessonDate - Date.now();
      if (diff <= 0) { setCountdown('Началось!'); clearInterval(timerRef.current); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(d > 0 ? `${d}д ${h}ч ${m}м` : `${h}ч ${m}м`);
    };
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => clearInterval(timerRef.current);
  }, [data?.upcoming_lesson]);

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const enrollments = data?.enrollments || [];
  const upcoming = data?.upcoming_lesson;
  const homeworks = data?.homeworks || [];
  const schedule = data?.schedule || [];
  const vocabulary = data?.vocabulary || [];
  const attTrend = data?.attendance_trend || [];
  const attRate = data?.attendance_rate;
  const payments = data?.recent_payments || [];
  const streakDays = data?.streak_days || 0;
  const levelNum = data?.level || stats.level || 1;
  const xpTotal = data?.xp || stats.xp || 0;
  const pendingHW = homeworks.filter(h => h.status === 'pending' && !h.is_overdue).length;
  const overdueHW = homeworks.filter(h => h.is_overdue && !h.is_submitted).length;
  const levelLabel = LEVELS[Math.min(Math.max(levelNum - 1, 0), 5)];

  const kpis = [
    { key: 'courses', label: 'Мои курсы', value: enrollments.length, icon: SBook, color: '#2563eb', trend: 0 },
    { key: 'hw', label: 'ДЗ ожидают', value: pendingHW, icon: SHW, color: '#f59e0b', sub: overdueHW > 0 ? `${overdueHW} просрочено` : undefined, trend: overdueHW > 0 ? -15 : 5 },
    { key: 'xp', label: 'Всего XP', value: xpTotal, icon: SZap, color: '#8b5cf6', trend: null },
    { key: 'level', label: 'Уровень', value: levelLabel, icon: SStar, color: '#10b981', sub: streakDays > 0 ? `🔥 ${streakDays} дней подряд` : undefined, trend: null },
  ];

  return (
    <div style={s.page}>
      {/* ═══ Welcome ═══ */}
      <div style={s.welcome}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.005)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
        <div style={s.welcomeBg} />
        <div style={s.welcomeText}>
          <h1 style={s.welcomeTitle}>{user?.name ? `Привет, ${user.name.split(' ')[0]}!` : 'Дашборд'}</h1>
          <p style={s.welcomeSub}>{dayName}, {dateStr}</p>
        </div>
        <div style={s.welcomeActions}>
          <Link to="/chat" style={{ ...s.welcomeBtn, ...s.welcomeBtnPrimary }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}>
            <SVideo /> Чат
          </Link>
          <Link to="/schedule" style={{ ...s.welcomeBtn, ...s.welcomeBtnOutline }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
            <SCal /> Расписание
          </Link>
        </div>
      </div>

      {/* ═══ KPI Row ═══ */}
      <div style={s.grid3}>
        {kpis.map(k => <KpiCard key={k.key} icon={k.icon} value={k.value} label={k.label} color={k.color} sub={k.sub} trend={k.trend} />)}
      </div>

      {/* ═══ 2-col: Upcoming + Attendance ═══ */}
      <div style={s.grid2}>
        {/* ── Upcoming Lesson ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SVideo /> Ближайший урок</h3>
          </div>
          {upcoming ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #2563eb15, #0891b215)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#2563eb', fontWeight: 700, flexShrink: 0,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{upcoming.date?.split('.')[0]}</span>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{upcoming.date?.split('.')[1]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{upcoming.title}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SClock /> {upcoming.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SCal /> {upcoming.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{upcoming.teacher}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {countdown && <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>⏱ {countdown}</span>}
                    {upcoming.zoom_link && (
                      <a href={upcoming.zoom_link} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: '#2563eb0f' }}>
                        <SVideo /> Zoom
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
              Нет ближайших уроков
            </div>
          )}
        </div>

        {/* ── Attendance ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SCal /> Посещаемость</h3>
            {attRate !== null && (
              <span style={{ fontSize: 20, fontWeight: 700, color: attRate >= 70 ? '#10b981' : attRate >= 40 ? '#f59e0b' : '#ef4444' }}>
                {attRate}%
              </span>
            )}
          </div>
          <AttChart trend={attTrend} />
        </div>
      </div>

      {/* ═══ 2-col: Courses + Schedule ═══ */}
      <div style={s.grid2}>
        {/* ── Courses ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SBook /> Мои курсы</h3>
            <Link to="/courses" style={s.cardLink}>Все <SChevronRight /></Link>
          </div>
          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
              Нет курсов
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enrollments.slice(0, 4).map(e => <CourseCard key={e.id} course={e} />)}
            </div>
          )}
        </div>

        {/* ── Schedule ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SCal /> Расписание</h3>
            <Link to="/schedule" style={s.cardLink}>Все дни <SChevronRight /></Link>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {schedule.map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '12px 6px', borderRadius: 12,
                background: s.active ? 'linear-gradient(180deg, #2563eb10, transparent)' : 'transparent',
                border: s.active ? '1px solid #2563eb30' : '1px solid transparent',
                opacity: s.has_lesson ? 1 : 0.5,
              }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{s.day}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 4px',
                  background: s.active ? '#2563eb' : s.has_lesson ? 'var(--border)' : 'transparent',
                  color: s.active ? '#fff' : 'var(--text)',
                  fontSize: 13, fontWeight: 600,
                }}>{s.date}</div>
                {s.has_lesson && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', margin: '0 auto' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 2-col: Payments + Homeworks ═══ */}
      <div style={s.grid2}>
        {/* ── Recent Payments ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SWallet /> Последние платежи</h3>
            <Link to="/settings" style={s.cardLink}>Все <SChevronRight /></Link>
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
              Нет платежей
            </div>
          ) : (
            payments.map(p => <PaymentRow key={p.id} p={p} />)
          )}
        </div>

        {/* ── Homeworks ── */}
        <div style={s.card}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}><SHW /> Домашние задания</h3>
            <Link to="/homeworks" style={s.cardLink}>Все <SChevronRight /></Link>
          </div>
          {homeworks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
              Нет заданий
            </div>
          ) : (
            homeworks.slice(0, 5).map(hw => (
              <div key={hw.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                opacity: hw.is_submitted ? 0.6 : 1,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{hw.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{hw.due_date}</div>
                </div>
                <div style={{ marginLeft: 12 }}>
                  {hw.grade ? (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#10b98118', color: '#10b981' }}>
                      {hw.grade}
                    </span>
                  ) : hw.is_submitted ? (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#f59e0b18', color: '#f59e0b' }}>
                      На проверке
                    </span>
                  ) : hw.is_overdue ? (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#ef444418', color: '#ef4444' }}>
                      Просрочено
                    </span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#94a3b818', color: 'var(--muted)' }}>
                      Ожидается
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ Spacer for consistency ═══ */}
      <div style={{ height: 32 }} />
    </div>
  );
}
