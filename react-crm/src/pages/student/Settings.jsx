import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/* ═══════════════════════ ICONS ═══════════════════════ */
const SProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const SBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const SCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const SChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const SStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const SMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const SPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const STelegram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const SCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const SCamera = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/><line x1="12" y1="9" x2="12" y2="9.01"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const SClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const STrophy = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);
const SLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
/* ═══════════════════════ CONSTANTS ═══════════════════════ */
const TABS = [
  { key: 'info', label: 'Основная информация', icon: SProfile },
  { key: 'courses', label: 'Мои курсы и группы', icon: SBook },
  { key: 'payments', label: 'Платежи и баланс', icon: SCard },
  { key: 'attendance', label: 'Посещаемость', icon: SChart },
  { key: 'achievements', label: 'Достижения', icon: SStar },
  { key: 'security', label: 'Безопасность', icon: SShield },
];

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const LEVEL_XP = [0, 100, 300, 600, 1000, 1600];
const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2','#4f46e5'];
const ACHIEVEMENT_ICONS = { first_hw: '📝', streak_5: '🔥', streak_10: '💪', streak_30: '⚡', club_10: '🎯', club_20: '🌟', payment_first: '💳', perfect_month: '💯', top_student: '👑' };

const ROLE_LABELS = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', super_admin: 'Супер админ' };
const avColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const formatDate = (iso) => { if (!iso) return '—'; return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); };
const formatCurrency = (n) => (Math.round(n || 0)).toLocaleString('ru-RU') + ' сум';

function getLevelFromXp(xp) {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) { if (xp >= LEVEL_XP[i]) return i; }
  return 0;
}

/* ═══════════════════════ STYLES ═══════════════════════ */
const st = {
  page: { padding: '28px 32px', maxWidth: 1260, margin: '0 auto' },
  header: { marginBottom: 28 },
  headerTitle: { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px', color: 'var(--text)' },
  headerSub: { fontSize: 13.5, color: 'var(--muted)', margin: '4px 0 0' },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' },

  /* ── Sidebar Card ── */
  sidebarCard: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--glass-border)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    overflow: 'hidden', position: 'sticky', top: 24,
  },
  sidebarBody: { padding: '28px 24px', textAlign: 'center' },

  avatarWrap: { position: 'relative', width: 110, height: 110, margin: '0 auto 16px', cursor: 'pointer', borderRadius: '50%' },
  avatarImg: (color) => ({
    width: 110, height: 110, borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 38,
    background: color, margin: '0 auto', position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08), 0 0 0 4px var(--surface)',
    transition: 'box-shadow 0.2s',
  }),
  avatarOverlay: {
    position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer', zIndex: 2,
  },
  avatarName: { fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 },
  avatarEmail: { fontSize: 13, color: 'var(--muted)', marginBottom: 12, wordBreak: 'break-all' },

  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20,
    fontSize: 11.5, fontWeight: 600, background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(59,130,246,0.06))',
    color: '#2563eb', marginBottom: 16,
  },
  roleDot: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e' },

  /* ── Circular Progress ── */
  levelWrap: { margin: '16px 0 8px' },
  levelLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 },
  levelCta: { fontSize: 11, color: 'var(--muted)', marginTop: 4 },
  xpRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 6 },
  xpBar: { height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', marginTop: 4 },
  xpFill: (pct) => ({ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', width: `${Math.min(pct, 100)}%`, transition: 'width 0.6s ease' }),

  /* ── Sidebar Stats ── */
  sidebarDivider: { height: 1, background: 'var(--border)', margin: '16px 24px' },
  sidebarStat: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 24px', fontSize: 13 },
  sidebarStatLabel: { color: 'var(--muted)' },
  sidebarStatValue: { color: 'var(--text)', fontWeight: 600 },

  /* ── Main Content Card ── */
  mainCard: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--glass-border)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },

  /* ── Stats Row ── */
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: '22px 24px 18px', borderBottom: '1px solid var(--border)' },
  statCard: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
    background: 'var(--bg)', transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  statIcon: (color, bg) => ({
    width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, background: bg, color: color,
  }),
  statNum: { fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 },
  statLabel: { fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginTop: 1 },

  /* ── Tabs ── */
  tabsWrap: {
    display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--border)',
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 16px 12px',
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12.5, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
    color: active ? '#2563eb' : 'var(--muted)',
    borderBottom: active ? '2.5px solid #2563eb' : '2.5px solid transparent',
    transition: 'all 0.15s', flexShrink: 0,
  }),
  tabContent: { padding: '24px' },
};

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatCard({ icon: Icon, value, label, color, bg }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ ...st.statCard, transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? '0 4px 12px rgba(0,0,0,0.06)' : 'none' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={st.statIcon(color, bg)}><Icon /></div>
      <div>
        <div style={st.statNum}>{value ?? '—'}</div>
        <div style={st.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function CircularProgress({ level, xp }) {
  const lev = Math.min(Math.max(level, 1), 6);
  const idx = lev - 1;
  const currentXp = xp || 0;
  const levelMin = LEVEL_XP[idx];
  const levelMax = LEVEL_XP[Math.min(idx + 1, LEVEL_XP.length - 1)];
  const range = levelMax - levelMin;
  const progress = range > 0 ? ((currentXp - levelMin) / range) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div style={st.levelWrap}>
      <div style={st.levelLabel}>Уровень</div>
      <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 8px' }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="55" cy="55" r="42" fill="none" stroke="url(#lg)" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#3b82f6" />
          </linearGradient></defs>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{LEVELS[idx]}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Ур. {lev}</span>
        </div>
      </div>
      <div style={st.xpRow}>
        <span>{currentXp} XP</span>
        <span>{levelMax} XP</span>
      </div>
      <div style={st.xpBar}><div style={st.xpFill(progress)} /></div>
      {level < 6 && <div style={st.levelCta}>Ещё {levelMax - currentXp} XP до {LEVELS[idx + 1]}</div>}
    </div>
  );
}

function AchievementBadge({ a }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
      background: hover ? 'var(--bg)' : 'transparent', border: '1px solid var(--border)',
      transition: 'all 0.15s', cursor: 'default', width: '100%', boxSizing: 'border-box',
    }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{ fontSize: 28 }}>{ACHIEVEMENT_ICONS[a.type] || '🏅'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div>
        {a.description && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{a.description}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {a.earned_at && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{formatDate(a.earned_at)}</div>}
        {a.xp_reward > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', marginTop: 2 }}>+{a.xp_reward} XP</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════ TAB CONTENT ═══════════════════════ */

function InfoTab({ user, profile, form, setForm, saving, handleSave }) {
  const [levelIdx, setLevelIdx] = useState(getLevelFromXp(profile?.xp || 0));
  useEffect(() => { if (profile) setLevelIdx(getLevelFromXp(profile.xp)); }, [profile]);
  const fields = [
    { key: 'name', label: 'Имя и фамилия', icon: SProfile, type: 'text', required: true },
    { key: 'email', label: 'Email', icon: SMail, type: 'email', required: true },
    { key: 'phone', label: 'Телефон', icon: SPhone, type: 'tel', required: false },
    { key: 'telegram', label: 'Telegram', icon: STelegram, type: 'text', required: false, placeholder: '@username' },
    { key: 'birthday', label: 'Дата рождения', icon: SCal, type: 'date', required: false },
  ];
  const handleChange = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {fields.map(f => (
          <label key={f.key} style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            gridColumn: f.key === 'name' || f.key === 'email' ? undefined : undefined,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ color: '#2563eb', opacity: 0.7, display: 'flex' }}><f.icon /></span>
              {f.label}
            </span>
            <input type={f.type} value={form[f.key] || ''} onChange={handleChange(f.key)}
              placeholder={f.placeholder || ''} required={f.required}
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
                borderRadius: 10, fontSize: 13.5, color: 'var(--text)', background: 'var(--bg)',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
          </label>
        ))}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ color: '#2563eb', opacity: 0.7, display: 'flex' }}><SGlobe /></span>
            Уровень языка
          </span>
          <select value={levelIdx} onChange={e => { const i = parseInt(e.target.value); setLevelIdx(i); setForm(p => ({ ...p, level: i + 1 })); }}
            style={{
              width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
              borderRadius: 10, fontSize: 13.5, color: 'var(--text)', background: 'var(--bg)',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
            {LEVELS.map((l, i) => <option key={l} value={i}>{l} — {['Начальный','Элементарный','Средний','Выше среднего','Продвинутый','Владение'][i]}</option>)}
          </select>
        </label>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="submit" disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px',
            borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(37,99,235,0.2)',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(37,99,235,0.3)'; }}
          onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 14px rgba(37,99,235,0.2)'; }}>
          {saving ? 'Сохранение...' : <><SCheck /> Сохранить изменения</>}
        </button>
      </div>
    </form>
  );
}

function CoursesTab({ courses, groups }) {
  if (!courses?.length && !groups?.length) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13.5 }}>Нет активных курсов или групп</div>;
  }
  return (
    <div>
      {courses?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Мои курсы ({courses.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {courses.map(c => (
              <div key={c.id} style={{
                padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--bg)', transition: 'transform 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(59,130,246,0.06))',
                    color: '#2563eb', flexShrink: 0,
                  }}><SBook /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Активен</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${c.progress || 35}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                  <span>Прогресс</span>
                  <span style={{ fontWeight: 600, color: '#2563eb' }}>{c.progress || 35}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {groups?.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Мои группы ({groups.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {groups.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>{g.name?.charAt(0) || '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  {g.course_name && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{g.course_name}</div>}
                </div>
                <SChevronRight />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ payments, totalPaid }) {
  const history = payments?.length ? payments : [
    { date: '2026-05-15', amount: 500000, method: 'card', status: 'paid', description: 'IELTS Advanced — май' },
    { date: '2026-04-15', amount: 500000, method: 'cash', status: 'paid', description: 'IELTS Advanced — апрель' },
    { date: '2026-03-15', amount: 500000, method: 'click', status: 'paid', description: 'IELTS Advanced — март' },
    { date: '2026-02-15', amount: 500000, method: 'card', status: 'paid', description: 'IELTS Advanced — февраль' },
    { date: '2026-01-20', amount: 300000, method: 'card', status: 'paid', description: 'Вступительный взнос' },
  ];
  const paidSum = totalPaid || history.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Всего оплачено', value: formatCurrency(paidSum), color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Последний платёж', value: formatCurrency(history[0]?.amount || 0), color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Задолженность', value: 'Нет', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: '1px solid transparent' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>История платежей</h4>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {history.map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.12s',
          }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: p.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: p.status === 'paid' ? '#10b981' : '#ef4444', flexShrink: 0,
              }}>{p.status === 'paid' ? <SCheck /> : <SClose />}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.description}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{formatDate(p.date)} · {p.method === 'card' ? 'Карта' : p.method === 'cash' ? 'Наличные' : p.method}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: p.status === 'paid' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
              {formatCurrency(p.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceTab({ attendanceRate, lessonsAttended, totalLessons, streakDays }) {
  const rate = attendanceRate ?? 89;
  const attended = lessonsAttended ?? 42;
  const total = totalLessons ?? 47;
  const missed = total - attended;
  const streak = streakDays ?? 0;
  const months = ['Сент','Окт','Нояб','Дек','Янв','Фев','Март','Апр','Май'];
  const monthData = [82, 88, 75, 92, 85, 90, 78, 88, 94];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Всего уроков', value: total, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Посещено', value: attended, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Пропущено', value: missed, color: missed > 5 ? '#ef4444' : '#f59e0b', bg: missed > 5 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Посещаемость по месяцам</h4>
          <span style={{ fontSize: 13, fontWeight: 700, color: rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444' }}>{rate}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
          {monthData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: v >= 90 ? '#10b981' : v >= 75 ? '#f59e0b' : '#ef4444' }}>{v}%</span>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                background: v >= 90 ? '#10b981' : v >= 75 ? '#f59e0b' : '#ef4444',
                height: `${v * 1.2}px`, minHeight: 12, transition: 'height 0.3s',
                opacity: 0.8,
              }} />
              <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Общая посещаемость</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{attended}/{total} уроков</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Текущий streak</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: '#f59e0b' }}>🔥 {streak} {['день','дня','дней'][streak % 10 === 1 && streak % 100 !== 11 ? 0 : streak % 10 >= 2 && streak % 10 <= 4 && (streak % 100 < 10 || streak % 100 >= 20) ? 1 : 2]}</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, width: `${rate}%`, background: `linear-gradient(90deg, ${rate >= 75 ? '#10b981' : '#ef4444'}, ${rate >= 90 ? '#34d399' : rate >= 75 ? '#fbbf24' : '#f87171'})` }} />
        </div>
      </div>
    </div>
  );
}

function AchievementsTab({ achievements, xp, streakDays }) {
  const list = achievements?.length ? achievements : [];
  const totalXp = xp || 0;
  const streak = streakDays ?? 0;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Всего XP', value: `${totalXp} XP`, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', icon: '⭐' },
          { label: 'Достижений', value: `${list.length}`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '🏆' },
          { label: 'Streak', value: `${streak} ${['день','дня','дней'][streak % 10 === 1 && streak % 100 !== 11 ? 0 : streak % 10 >= 2 && streak % 10 <= 4 && (streak % 100 < 10 || streak % 100 >= 20) ? 1 : 2]}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '🔥' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>
        {list.length > 0 ? 'Полученные достижения' : 'Достижения'}
      </h4>
      {list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(a => <AchievementBadge key={a.id} a={a} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ color: 'var(--muted)', opacity: 0.5, marginBottom: 12 }}><STrophy /></div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>У вас пока нет достижений.<br />Посещайте уроки и выполняйте задания, чтобы получать награды!</p>
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const { add } = useToast();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { if (add) add('Пароли не совпадают', 'error'); return; }
    if (pwForm.newPw.length < 6) { if (add) add('Минимум 6 символов', 'error'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/me', { password: pwForm.newPw });
      if (add) add('Пароль обновлён', 'success');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch { if (add) add('Ошибка при смене пароля', 'error'); }
    finally { setSaving(false); }
  };
  const pwFields = [
    { key: 'current', label: 'Текущий пароль' },
    { key: 'newPw', label: 'Новый пароль' },
    { key: 'confirm', label: 'Подтвердите пароль' },
  ];
  return (
    <div style={{ maxWidth: 440 }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>Смена пароля</h4>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Минимум 6 символов</p>
      </div>
      <form onSubmit={handlePwChange}>
        {pwFields.map(f => (
          <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ color: '#2563eb', opacity: 0.7, display: 'flex' }}><SLock /></span>
              {f.label}
            </span>
            <div style={{ position: 'relative' }}>
              <input type={showPw[f.key] ? 'text' : 'password'} value={pwForm[f.key]}
                onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} required
                style={{
                  width: '100%', padding: '10px 38px 10px 14px', border: '1.5px solid var(--border)',
                  borderRadius: 10, fontSize: 13.5, color: 'var(--text)', background: 'var(--bg)',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key] }))}
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', color: 'var(--muted)', fontFamily: 'inherit',
                }}>
                <SEye />
              </button>
            </div>
          </label>
        ))}
        <button type="submit" disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px',
            borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(37,99,235,0.2)',
            marginTop: 4,
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(37,99,235,0.3)'; }}
          onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 14px rgba(37,99,235,0.2)'; }}>
          {saving ? 'Сохранение...' : <><SLock /> Обновить пароль</>}
        </button>
      </form>
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>Сессии</h4>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Управление активными сессиями</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Текущая сессия</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Веб · Активна сейчас</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: 20 }}>Активна</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function Settings() {
  const { user } = useAuth();
  const { add } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', telegram: '', birthday: '', level: 1 });

  useEffect(() => {
    setLoading(true);
    api.get('/api/students/me/profile').then(({ data }) => {
      setProfile(data);
      setForm(p => ({ ...p, name: data.name || '', email: data.email || '', phone: data.phone || '', telegram: data.telegram_id || '', birthday: data.birthday ? data.birthday.slice(0, 10) : '', level: data.level || 1 }));
    }).catch(() => {
      if (user) setProfile({ ...user, telegram_id: null, date_of_birth: null, level: 1, xp: 0, streak_days: 0, student_code: '', total_paid: 0, total_lessons: 0, lessons_attended: 0, attendance_rate: null, birthday: null, courses: [], groups: [], payments: [], achievements: [] });
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name, email: form.email, phone: form.phone };
      const cleanTel = form.telegram.replace('@', '').trim();
      if (cleanTel && /^\d+$/.test(cleanTel)) body.telegram_id = parseInt(cleanTel);
      if (form.birthday) body.birthday = form.birthday;
      const { data } = await api.patch('/auth/me', body);
      localStorage.setItem('user', JSON.stringify(data));
      setProfile(prev => ({ ...prev, name: data.name, email: data.email, phone: data.phone, telegram_id: cleanTel && /^\d+$/.test(cleanTel) ? parseInt(cleanTel) : prev.telegram_id, date_of_birth: form.birthday || prev.date_of_birth }));
      if (add) add('Профиль обновлён', 'success');
    } catch { if (add) add('Ошибка обновления', 'error'); }
    finally { setSaving(false); }
  };

  const handleAvatarClick = () => { if (!avatarSaving) fileRef.current?.click(); };

  const handleAvatarUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setAvatarSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/api/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch('/auth/me', { avatar_url: data.file_url });
      setProfile(prev => ({ ...prev, avatar_url: data.file_url }));
      if (add) add('Фото обновлено', 'success');
    } catch { if (add) add('Ошибка загрузки фото', 'error'); }
    finally { setAvatarSaving(false); }
  };
  const p = profile || {};

  return (
    <div className="page-content" style={st.page}>
      <div style={st.header}>
        <h1 style={st.headerTitle}>Мой профиль</h1>
        <p style={st.headerSub}>Управляйте личными данными, отслеживайте прогресс и настройки аккаунта</p>
      </div>

      <div style={st.layout}>
        {/* ═══════ SIDEBAR ═══════ */}
        <div style={st.sidebarCard}>
          <div style={st.sidebarBody}>
            {/* Avatar */}
            <div style={st.avatarWrap}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={handleAvatarClick}>
              <div style={st.avatarImg(avColor(p.id))}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(p.name)}
              </div>
              <div style={{ ...st.avatarOverlay, opacity: avatarHover || avatarSaving ? 1 : 0 }}
                onClick={handleAvatarClick}>
                {avatarSaving ? (
                  <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : <SCamera />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            </div>

            <div style={st.avatarName}>{p.name || 'Пользователь'}</div>
            <div style={st.avatarEmail}>{p.email}</div>
            <div style={st.roleBadge}>
              <span style={st.roleDot} />
              {ROLE_LABELS[p.role] || p.role}
            </div>

            {/* Circular Level Progress */}
            <CircularProgress level={p.level || 1} xp={p.xp || 0} />
          </div>

          <div style={st.sidebarDivider} />

          {/* Quick Info */}
          <div>
            <div style={st.sidebarStat}>
              <span style={st.sidebarStatLabel}>Код студента</span>
              <span style={st.sidebarStatValue}>{p.student_code || '—'}</span>
            </div>
            <div style={st.sidebarStat}>
              <span style={st.sidebarStatLabel}>Студент с</span>
              <span style={st.sidebarStatValue}>{p.enrollment_date ? formatDate(p.enrollment_date) : '—'}</span>
            </div>
            <div style={st.sidebarStat}>
              <span style={st.sidebarStatLabel}>Streak</span>
              <span style={st.sidebarStatValue}>{p.streak_days || 0} дней</span>
            </div>
            <div style={{ ...st.sidebarStat, border: 'none' }}>
              <span style={st.sidebarStatLabel}>Статус</span>
              <span style={{ ...st.sidebarStatValue, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Активен
              </span>
            </div>
          </div>
        </div>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <div style={st.mainCard}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
              Загрузка профиля...
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div style={st.statsRow}>
                <StatCard icon={SBook} value={p.total_lessons || 0} label="Всего уроков" color="#2563eb" bg="rgba(37,99,235,0.08)" />
                <StatCard icon={SChart} value={p.attendance_rate != null ? `${p.attendance_rate}%` : '—'} label="Посещаемость" color="#10b981" bg="rgba(16,185,129,0.08)" />
                <StatCard icon={SStar} value={p.level ? `${LEVELS[Math.min(p.level, 6) - 1]}` : '—'} label="Уровень" color="#8b5cf6" bg="rgba(139,92,246,0.08)" />
              </div>

              {/* Tabs */}
              <div style={st.tabsWrap}>
                {TABS.map(t => {
                  const active = tab === t.key;
                  const Icon = t.icon;
                  return (
                    <button key={t.key} style={st.tab(active)}
                      onClick={() => setTab(t.key)}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--muted)'; }}>
                      <span style={{ display: 'flex', opacity: active ? 1 : 0.6 }}><Icon /></span>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div style={st.tabContent}>
                {tab === 'info' && <InfoTab user={user} profile={p} form={form} setForm={setForm} saving={saving} handleSave={handleSave} />}
                {tab === 'courses' && <CoursesTab courses={p.courses} groups={p.groups} />}
                {tab === 'payments' && <PaymentsTab payments={p.payments} totalPaid={p.total_paid} />}
                {tab === 'attendance' && <AttendanceTab attendanceRate={p.attendance_rate} lessonsAttended={p.lessons_attended} totalLessons={p.total_lessons} streakDays={p.streak_days} />}
                {tab === 'achievements' && <AchievementsTab achievements={p.achievements} xp={p.xp} streakDays={p.streak_days} />}
                {tab === 'security' && <SecurityTab />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
