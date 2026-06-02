import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  camera: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  profile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  book: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  card: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  chart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
};

const TABS = [
  { key: 'info', label: 'Профиль', icon: ico.profile },
  { key: 'courses', label: 'Курсы', icon: ico.book },
  { key: 'payments', label: 'Платежи', icon: ico.card },
  { key: 'attendance', label: 'Посещаемость', icon: ico.chart },
  { key: 'achievements', label: 'Награды', icon: ico.star },
  { key: 'security', label: 'Безопасность', icon: ico.shield },
];

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const LEVEL_NAMES = ['Начальный','Элементарный','Средний','Выше среднего','Продвинутый','Владение'];
const LEVEL_XP = [0, 100, 300, 600, 1000, 1600];
const ACHIEVEMENT_ICONS = { first_hw: '📝', streak_5: '🔥', streak_10: '💪', streak_30: '⚡', club_10: '🎯', club_20: '🌟', payment_first: '💳', perfect_month: '💯', top_student: '👑' };
const ROLE_LABELS = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', super_admin: 'Супер админ' };

const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatCurrency = (n) => Math.round(n || 0).toLocaleString('ru-RU') + ' сум';
const getLevelFromXp = (xp) => { for (let i = LEVEL_XP.length - 1; i >= 0; i--) if (xp >= LEVEL_XP[i]) return i; return 0; };
const pluralDay = (n) => ['день','дня','дней'][n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];

/* ═══════ INFO TAB ═══════ */
function InfoTab({ profile, form, setForm, saving, handleSave }) {
  const [levelIdx, setLevelIdx] = useState(getLevelFromXp(profile?.xp || 0));
  useEffect(() => { if (profile) setLevelIdx(getLevelFromXp(profile.xp)); }, [profile]);
  const fields = [
    { key: 'name', label: 'Имя и фамилия', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Телефон', type: 'tel' },
    { key: 'telegram', label: 'Telegram', type: 'text', placeholder: '@username' },
    { key: 'birthday', label: 'Дата рождения', type: 'date' },
  ];
  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        {fields.map(f => (
          <div key={f.key} className="ed-field" style={{ marginBottom: 0 }}>
            <label className="ed-field-label">
              {f.label}{f.required && <span style={{ color: 'var(--ed-coral)' }}> *</span>}
            </label>
            <input className="ed-input" type={f.type} value={form[f.key] || ''}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder || ''} required={f.required} />
          </div>
        ))}
        <div className="ed-field" style={{ marginBottom: 0 }}>
          <label className="ed-field-label">Уровень языка</label>
          <select className="ed-input" value={levelIdx}
            onChange={e => { const i = parseInt(e.target.value); setLevelIdx(i); setForm(p => ({ ...p, level: i + 1 })); }}>
            {LEVELS.map((l, i) => <option key={l} value={i}>{l} — {LEVEL_NAMES[i]}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--ed-border)' }}>
        <button type="submit" disabled={saving} className="ed-btn">
          {saving ? 'Сохранение…' : <>{ico.check} Сохранить</>}
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>
          Изменения сохранятся мгновенно
        </span>
      </div>
    </form>
  );
}

/* ═══════ COURSES TAB ═══════ */
function CoursesTab({ courses, groups }) {
  if (!courses?.length && !groups?.length) {
    return (
      <div className="ed-empty" style={{ background: 'transparent', border: 'none', padding: '40px 20px' }}>
        <div className="ed-empty-eyebrow">— Empty shelf —</div>
        <div className="ed-empty-title" style={{ fontSize: 28 }}>Курсов\nне назначено</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {courses?.length > 0 && (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 14 }}>Мои курсы · {courses.length}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {courses.map(c => (
              <div key={c.id} style={{ padding: 18, borderRadius: 18, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--ed-text)', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 14 }}>Active</div>
                <div className="ed-course-bar">
                  <div className="ed-course-bar-fill" style={{ width: `${c.progress || 0}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span style={{ color: 'var(--ed-text-mute)' }}>progress</span>
                  <span style={{ color: 'var(--ed-iris)', fontWeight: 700 }}>{c.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {groups?.length > 0 && (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 14 }}>Мои группы · {groups.length}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {groups.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--ed-ink)', color: 'var(--ed-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 18 }}>
                  {g.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 14, color: 'var(--ed-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  {g.course_name && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.course_name}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════ PAYMENTS TAB ═══════ */
function PaymentsTab({ payments, totalPaid }) {
  const history = payments?.length ? payments : [];
  const paidSum = totalPaid || history.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0);
  const last = history[0];

  if (history.length === 0) {
    return (
      <div className="ed-empty" style={{ background: 'transparent', border: 'none', padding: '40px 20px' }}>
        <div className="ed-empty-eyebrow">— Quiet wallet —</div>
        <div className="ed-empty-title" style={{ fontSize: 28 }}>Платежей\nне было</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Всего оплачено', value: formatCurrency(paidSum) },
          { label: 'Последний', value: last ? formatCurrency(last.amount) : '—' },
          { label: 'Долг', value: 'Нет' },
        ].map((s, i) => (
          <div key={i} style={{ padding: 18, borderRadius: 18, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ed-text)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 12 }}>История</div>
      <div className="ed-list" style={{ border: '1px solid var(--ed-border)', borderRadius: 18, padding: '4px 20px' }}>
        {history.map((p, i) => (
          <div key={i} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
            <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="ed-row-main">
              <div className="ed-row-title" style={{ fontSize: 16 }}>{p.description}</div>
              <div className="ed-row-sub">{formatDate(p.date)} · {p.method === 'card' ? 'Card' : p.method === 'cash' ? 'Cash' : p.method}</div>
            </div>
            <span className={`ed-tag ${p.status === 'paid' ? 'ed-tag--lime' : 'ed-tag--coral'}`}>{p.status === 'paid' ? 'PAID' : 'FAILED'}</span>
            <span className="ed-row-value" style={{ fontSize: 18 }}><em>{formatCurrency(p.amount)}</em></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ ATTENDANCE TAB ═══════ */
function AttendanceTab({ attendanceRate, lessonsAttended, totalLessons, streakDays }) {
  const rate = attendanceRate ?? 0;
  const attended = lessonsAttended ?? 0;
  const total = totalLessons ?? 0;
  const missed = Math.max(total - attended, 0);
  const streak = streakDays ?? 0;
  const months = ['СЕН','ОКТ','НОЯ','ДЕК','ЯНВ','ФЕВ','МАР','АПР','МАЙ'];
  const monthData = [82, 88, 75, 92, 85, 90, 78, 88, 94];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Всего', value: total },
          { label: 'Посещено', value: attended },
          { label: 'Пропущено', value: missed },
          { label: 'Посещаемость', value: `${rate}%`, italic: true },
        ].map((s, i) => (
          <div key={i} style={{ padding: 18, borderRadius: 18, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 32, letterSpacing: '-0.03em', color: s.italic ? 'var(--ed-iris)' : 'var(--ed-text)', fontStyle: s.italic ? 'italic' : 'normal', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>По месяцам</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 17, color: rate >= 80 ? 'var(--ed-iris)' : 'var(--ed-coral)' }}>{rate}% средняя</div>
      </div>
      <div className="ed-heatmap">
        {monthData.map((v, i) => (
          <div key={i} className="ed-heatmap-bar">
            <span className="ed-heatmap-num">{v}</span>
            <div className="ed-heatmap-col" style={{ height: `${Math.max(v * 1.4, 14)}px` }} />
            <span className="ed-heatmap-label">{months[i]}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 22, borderRadius: 18, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>Общая посещаемость</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 22, marginTop: 4 }}>{attended}<span style={{ color: 'var(--ed-text-mute)', fontWeight: 400 }}>/{total}</span> уроков</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>Текущий streak</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 22, marginTop: 4, color: 'var(--ed-coral)' }}>🔥 {streak} {pluralDay(streak)}</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 100, background: 'var(--ed-border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${rate}%`, background: 'var(--ed-ink)', borderRadius: 100, transition: 'width 1.2s' }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════ ACHIEVEMENTS TAB ═══════ */
function AchievementsTab({ achievements, xp, streakDays }) {
  const list = achievements?.length ? achievements : [];
  const totalXp = xp || 0;
  const streak = streakDays ?? 0;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'XP', value: totalXp },
          { label: 'Наград', value: list.length },
          { label: 'Streak', value: `${streak}` },
        ].map((s, i) => (
          <div key={i} style={{ padding: 18, borderRadius: 18, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 32, letterSpacing: '-0.03em', color: 'var(--ed-text)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 12 }}>
        {list.length > 0 ? 'Полученные награды' : 'Награды'}
      </div>
      {list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((a, i) => (
            <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 16, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--ed-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--ed-border)'; }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--ed-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {ACHIEVEMENT_ICONS[a.type] || '🏅'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 16, letterSpacing: '-0.015em', color: 'var(--ed-text)' }}>{a.title}</div>
                {a.description && <div style={{ fontSize: 12.5, color: 'var(--ed-text-soft)', marginTop: 2 }}>{a.description}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {a.earned_at && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ed-text-mute)' }}>{formatDate(a.earned_at)}</div>}
                {a.xp_reward > 0 && <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 17, color: 'var(--ed-iris)', marginTop: 2 }}>+{a.xp_reward} XP</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-empty" style={{ background: 'transparent', border: 'none', padding: '40px 20px' }}>
          <div className="ed-empty-eyebrow">— Empty wall —</div>
          <div className="ed-empty-title" style={{ fontSize: 28 }}>Наград\nпока нет</div>
          <div className="ed-empty-desc">Посещайте уроки и выполняйте задания</div>
        </div>
      )}
    </div>
  );
}

/* ═══════ SECURITY TAB ═══════ */
function SecurityTab() {
  const { add } = useToast();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { add && add('Пароли не совпадают', 'error'); return; }
    if (pwForm.newPw.length < 6) { add && add('Минимум 6 символов', 'error'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/me', { password: pwForm.newPw });
      add && add('Пароль обновлён', 'success');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch { add && add('Ошибка при смене пароля', 'error'); }
    finally { setSaving(false); }
  };

  const fields = [
    { key: 'current', label: 'Текущий пароль' },
    { key: 'newPw', label: 'Новый пароль' },
    { key: 'confirm', label: 'Подтверждение' },
  ];

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>Смена пароля</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 19, marginTop: 4, color: 'var(--ed-text)' }}>Используйте надёжный пароль.</div>
      </div>
      <form onSubmit={handlePwChange}>
        {fields.map(f => (
          <div key={f.key} className="ed-field">
            <label className="ed-field-label">{f.label}</label>
            <div style={{ position: 'relative' }}>
              <input className="ed-input" type={showPw[f.key] ? 'text' : 'password'}
                value={pwForm[f.key]}
                onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                required style={{ paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key] }))}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--ed-text-mute)' }}>
                {showPw[f.key] ? ico.eyeOff : ico.eye}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={saving} className="ed-btn" style={{ marginTop: 6 }}>
          {saving ? 'Сохранение…' : 'Обновить пароль'}
        </button>
      </form>

      <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--ed-border)' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>Сессии</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 19, marginTop: 4, marginBottom: 16, color: 'var(--ed-text)' }}>Контроль доступа.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 16, background: 'var(--ed-paper-soft)', border: '1px solid var(--ed-border)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ed-ink)', color: 'var(--ed-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 16 }}>Текущая сессия</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginTop: 2 }}>Web · active now</div>
          </div>
          <span className="ed-tag ed-tag--lime">Активна</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */
export default function Settings() {
  const { user } = useAuth();
  const { add } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
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
      const cleanTel = (form.telegram || '').replace('@', '').trim();
      if (cleanTel && /^\d+$/.test(cleanTel)) body.telegram_id = parseInt(cleanTel);
      if (form.birthday) body.birthday = form.birthday;
      const { data } = await api.patch('/auth/me', body);
      localStorage.setItem('user', JSON.stringify(data));
      setProfile(prev => ({ ...prev, name: data.name, email: data.email, phone: data.phone, telegram_id: cleanTel && /^\d+$/.test(cleanTel) ? parseInt(cleanTel) : prev.telegram_id, date_of_birth: form.birthday || prev.date_of_birth }));
      add && add('Профиль обновлён', 'success');
    } catch { add && add('Ошибка обновления', 'error'); }
    finally { setSaving(false); }
  };

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
      add && add('Фото обновлено', 'success');
    } catch { add && add('Ошибка загрузки', 'error'); }
    finally { setAvatarSaving(false); }
  };

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Открываем личное дело…</div>
      </div>
    </div>
  );

  const p = profile || {};
  const levelIdx = Math.min(Math.max((p.level || 1) - 1, 0), 5);

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 06 / PROFILE</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r">
          <span>{p.student_code || 'STUDENT'}</span>
        </div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Profile / 06</div>
        <h1 className="ed-page-title">Личное <em>дело</em>.</h1>
        <p className="ed-page-lead">Управляйте профилем, отслеживайте прогресс, настройки и историю платежей.</p>
      </div>

      <div className="ed-profile-layout">
        {/* Sidebar */}
        <div className="ed-profile-card">
          <div className="ed-profile-avatar" onClick={() => !avatarSaving && fileRef.current?.click()}>
            {p.avatar_url ? <img src={p.avatar_url} alt="" /> : initials(p.name)}
            <div className="ed-profile-avatar-edit">
              {avatarSaving ? <div className="ed-spinner" style={{ width: 22, height: 22 }} /> : ico.camera}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
          </div>
          <div className="ed-profile-name">{p.name || 'Пользователь'}</div>
          <div className="ed-profile-email">{p.email}</div>

          <div className="ed-profile-stats-strip">
            <div>
              <div className="ed-profile-stat-num"><em>{LEVELS[levelIdx]}</em></div>
              <div className="ed-profile-stat-label">Уровень</div>
            </div>
            <div>
              <div className="ed-profile-stat-num">{(p.xp || 0).toLocaleString('ru-RU')}</div>
              <div className="ed-profile-stat-label">XP</div>
            </div>
          </div>

          <div>
            <div className="ed-profile-row">
              <span className="ed-profile-row-label">Role</span>
              <span className="ed-profile-row-value">{ROLE_LABELS[p.role] || p.role}</span>
            </div>
            <div className="ed-profile-row">
              <span className="ed-profile-row-label">Code</span>
              <span className="ed-profile-row-value">{p.student_code || '—'}</span>
            </div>
            <div className="ed-profile-row">
              <span className="ed-profile-row-label">Since</span>
              <span className="ed-profile-row-value">{p.enrollment_date ? formatDate(p.enrollment_date) : '—'}</span>
            </div>
            <div className="ed-profile-row">
              <span className="ed-profile-row-label">Streak</span>
              <span className="ed-profile-row-value">🔥 {p.streak_days || 0}</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="ed-profile-main">
          <div className="ed-profile-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`ed-profile-tab ${tab === t.key ? 'ed-profile-tab--active' : ''}`} onClick={() => setTab(t.key)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="ed-profile-body">
            {tab === 'info' && <InfoTab profile={p} form={form} setForm={setForm} saving={saving} handleSave={handleSave} />}
            {tab === 'courses' && <CoursesTab courses={p.courses} groups={p.groups} />}
            {tab === 'payments' && <PaymentsTab payments={p.payments} totalPaid={p.total_paid} />}
            {tab === 'attendance' && <AttendanceTab attendanceRate={p.attendance_rate} lessonsAttended={p.lessons_attended} totalLessons={p.total_lessons} streakDays={p.streak_days} />}
            {tab === 'achievements' && <AchievementsTab achievements={p.achievements} xp={p.xp} streakDays={p.streak_days} />}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
