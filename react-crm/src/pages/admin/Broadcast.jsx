import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

/* ── Icons ── */
const SPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const SSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const SEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const SCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SDelete = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const SEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const SDuplicate = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CHANNELS = {
  telegram: { label: 'Telegram', color: '#2481cc', bg: 'rgba(36,129,204,0.1)', icon: '✈️' },
  email: { label: 'Email', color: '#ea580c', bg: 'rgba(234,88,12,0.1)', icon: '📧' },
  sms: { label: 'SMS', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '💬' },
};
const STATUS_CONFIG = {
  draft: { label: 'Черновик', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  scheduled: { label: 'Запланирована', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  sent: { label: 'Отправлена', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'Отменена', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};
const TABS = [
  { key: 'all', label: 'Все рассылки' },
  { key: 'draft', label: 'Черновики' },
  { key: 'sent', label: 'Отправленные' },
  { key: 'scheduled', label: 'Запланированные' },
];
const VARIABLES = [
  { key: '{Имя}', desc: 'Имя студента' },
  { key: '{Группа}', desc: 'Название группы' },
  { key: '{Курс}', desc: 'Название курса' },
  { key: '{Дата}', desc: 'Текущая дата' },
];
const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Все студенты' },
  { value: 'role', label: 'По роли' },
  { value: 'group', label: 'По группе' },
  { value: 'course', label: 'По курсу' },
];

const s = {
  page: { padding: '28px 32px', maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  hTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  hSub: { fontSize: 13, color: 'var(--muted)', marginTop: 2 },
  createBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: 'var(--accent-gradient)', color: '#fff',
    transition: 'all 0.2s', fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(37,99,235,0.2)',
  },
  tabs: { display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' },
  tab: (active) => ({
    padding: '12px 22px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', background: 'none', color: active ? 'var(--text)' : 'var(--muted)',
    borderBottom: active ? '2px solid var(--blue-500)' : '2px solid transparent',
    transition: 'all 0.15s', marginBottom: -1,
  }),
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: (color) => ({
    background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
    padding: '16px 20px', borderLeft: `3px solid ${color}`,
  }),
  statValue: { fontSize: 24, fontWeight: 700, color: 'var(--text)' },
  statLabel: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  card: { background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid var(--border)',
    background: 'rgba(0,0,0,0.02)', whiteSpace: 'nowrap',
  },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, color, background, whiteSpace: 'nowrap',
  }),
  chLabel: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6,
    fontSize: 11, fontWeight: 600, color, background, whiteSpace: 'nowrap',
  }),
  rowActions: { display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' },
  rowBtn: {
    width: 30, height: 30, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', transition: 'all 0.15s', fontFamily: 'inherit',
  },
  searchWrap: { position: 'relative', flex: 1, maxWidth: 260 },
  searchInput: {
    width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  searchIcon: { position: 'absolute', left: 12, top: '50%', marginTop: -8, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 },
};
const formatDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const formatShort = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); };

/* ── Stat Card ── */
function BStatCard({ icon, label, value, color }) {
  return (
    <div style={s.statCard(color)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={s.statValue}>{value ?? '—'}</div>
          <div style={s.statLabel}>{label}</div>
        </div>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ── Create / Edit Modal ── */
function CampaignModal({ campaign, onClose, onSaved }) {
  const { add } = useToast();
  const [form, setForm] = useState({
    title: campaign?.title || '',
    channel: campaign?.channel || 'telegram',
    message: campaign?.message || '',
    audience_config: campaign?.audience_config || { type: 'all' },
    status: campaign?.status || 'draft',
    scheduled_at: campaign?.scheduled_at || '',
  });
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get('/api/admin/broadcast/groups').then(({ data }) => setGroups(data)).catch(() => {});
    api.get('/api/admin/broadcast/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const insertVar = (v) => setForm(f => ({ ...f, message: f.message + v }));

  const previewText = form.message
    .replace(/\{Имя\}/g, 'Иван')
    .replace(/\{Группа\}/g, 'Group A')
    .replace(/\{Курс\}/g, 'IELTS Advanced')
    .replace(/\{Дата\}/g, new Date().toLocaleDateString('ru-RU'));

  const handleSave = async () => {
    if (!form.title.trim()) { if (add) add('Введите название', 'error'); return; }
    if (!form.message.trim()) { if (add) add('Введите текст сообщения', 'error'); return; }
    setSaving(true);
    try {
      const url = campaign
        ? `/api/admin/broadcast/campaigns/${campaign.id}`
        : '/api/admin/broadcast/campaigns';
      const method = campaign ? 'put' : 'post';
      await api[method](url, form);
      if (add) add(campaign ? 'Кампания обновлена' : 'Кампания создана', 'success');
      onSaved();
    } catch { if (add) add('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  };

  const handleSend = async () => {
    if (!campaign?.id) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/broadcast/campaigns/${campaign.id}/send`);
      if (add) add('Рассылка отправлена!', 'success');
      onSaved();
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Ошибка отправки';
      if (add) add(detail, 'error');
    }
    finally { setSaving(false); }
  };

  const ac = form.audience_config || {};
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ width: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 20,
        background: 'var(--surface)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {campaign ? 'Редактировать рассылку' : 'Новая рассылка'}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--muted)', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}>
            <SClose />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Campaign Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>Название кампании</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Например: Напоминание об оплате"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Channel Selection */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>Канал отправки</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(CHANNELS).map(([key, ch]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, channel: key }))}
                  style={{
                    flex: 1, padding: '12px 16px', border: `2px solid ${form.channel === key ? ch.color : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', background: form.channel === key ? ch.bg : 'transparent',
                    textAlign: 'center', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{ch.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.channel === key ? ch.color : 'var(--muted)' }}>{ch.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>Получатели</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AUDIENCE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm(f => ({ ...f, audience_config: { type: opt.value } }))}
                  style={{
                    padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${ac.type === opt.value ? 'var(--blue-500)' : 'var(--border)'}`,
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                    background: ac.type === opt.value ? 'rgba(37,99,235,0.08)' : 'transparent',
                    color: ac.type === opt.value ? 'var(--blue-500)' : 'var(--text-secondary)',
                    transition: 'all 0.1s',
                  }}>{opt.label}</button>
              ))}
            </div>
            {ac.type === 'group' && (
              <select value={ac.value || ''} onChange={e => setForm(f => ({ ...f, audience_config: { ...ac, value: e.target.value } }))}
                style={{ marginTop: 8, width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
                <option value="">Выберите группу</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.course_name}</option>)}
              </select>
            )}
            {ac.type === 'course' && (
              <select value={ac.value || ''} onChange={e => setForm(f => ({ ...f, audience_config: { ...ac, value: e.target.value } }))}
                style={{ marginTop: 8, width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
                <option value="">Выберите курс</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            {ac.type === 'role' && (
              <select value={ac.value || 'student'} onChange={e => setForm(f => ({ ...f, audience_config: { ...ac, value: e.target.value } }))}
                style={{ marginTop: 8, width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
                <option value="student">Только студенты</option>
                <option value="teacher">Только преподаватели</option>
                <option value="admin">Администраторы</option>
                <option value="all">Все пользователи</option>
              </select>
            )}
          </div>

          {/* Message Editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Текст сообщения</label>
              <button onClick={() => setShowPreview(!showPreview)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: 'var(--blue-500)', fontFamily: 'inherit', padding: 0 }}>
                <SEye /> {showPreview ? 'Редактор' : 'Предпросмотр'}
              </button>
            </div>
            {showPreview ? (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg)', border: '1.5px solid var(--border)', minHeight: 120, fontSize: 13, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {previewText || <span style={{ color: 'var(--muted)' }}>Пусто</span>}
              </div>
            ) : (
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Введите текст сообщения... Поддерживается Markdown"
                style={{ width: '100%', padding: 12, border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', minHeight: 120, resize: 'vertical', boxSizing: 'border-box' }} />
            )}
            {/* Variable chips */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 4 }}>Переменные:</span>
              {VARIABLES.map(v => (
                <button key={v.key} onClick={() => insertVar(v.key)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-500)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  title={v.desc}>
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
              <input type="checkbox" checked={!!form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.checked ? new Date(Date.now() + 3600000).toISOString().slice(0, 16) : '' }))}
                style={{ marginRight: 8 }} />
              Запланировать отправку
            </label>
            {form.scheduled_at && (
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Отмена</button>
          <button onClick={() => { setForm(f => ({ ...f, status: 'draft' })); handleSave(); }}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'inherit' }}>
            {saving ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
          {campaign?.status !== 'sent' && (
            <button onClick={async () => {
              if (!campaign) {
                await handleSave();
              }
              handleSend();
            }} disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, border: 'none', background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(37,99,235,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.2)'; }}>
              <SSend /> {saving ? 'Отправка...' : (form.scheduled_at ? 'Запланировать' : 'Отправить сейчас')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Broadcast() {
  const { add } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [search, setSearch] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/broadcast/campaigns');
      setCampaigns(data);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту рассылку?')) return;
    try {
      await api.delete(`/api/admin/broadcast/campaigns/${id}`);
      if (add) add('Кампания удалена', 'success');
      load();
    } catch { if (add) add('Ошибка удаления', 'error'); }
  };

  const handleDuplicate = (c) => {
    setEditCampaign(null);
    setShowModal(true);
    setTimeout(() => {
      setEditCampaign({ ...c, id: null, title: c.title + ' (копия)', status: 'draft' });
    }, 50);
  };

  const filtered = campaigns.filter(c => {
    if (tab !== 'all' && c.status !== tab) return false;
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: campaigns.length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.hTitle}>Рассылка</h1>
          <p style={s.hSub}>Создание и управление массовыми рассылками</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}><SSearch /></span>
            <input type="text" placeholder="Поиск рассылок..." style={s.searchInput} value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} />
          </div>
          <button style={s.createBtn} onClick={() => { setEditCampaign(null); setShowModal(true); }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.2)'; }}>
            <SPlus /> Создать новую рассылку
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <BStatCard icon="📨" label="Всего рассылок" value={stats.total} color="#2563eb" />
        <BStatCard icon="📝" label="Черновиков" value={stats.drafts} color="#6b7280" />
        <BStatCard icon="✅" label="Отправлено" value={stats.sent} color="#10b981" />
        <BStatCard icon="📅" label="Запланировано" value={stats.scheduled} color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Campaign Table */}
      <div style={s.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Название</th>
                <th style={s.th}>Канал</th>
                <th style={s.th}>Получатели</th>
                <th style={s.th}>Текст</th>
                <th style={s.th}>Дата</th>
                <th style={s.th}>Статус</th>
                <th style={s.th}>Статистика</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                    {search ? 'Ничего не найдено' : 'Пока нет рассылок. Создайте первую!'}
                  </td>
                </tr>
              )}
              {filtered.map(c => {
                const ch = CHANNELS[c.channel] || CHANNELS.telegram;
                const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === (c.audience_config?.type))?.label || 'Все студенты';
                const displayStats = c.status === 'sent' && c.stats;
                return (
                  <tr key={c.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                    </td>
                    <td style={s.td}>
                      <span style={s.chLabel(ch.color, ch.bg)}>{ch.icon} {ch.label}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{audienceLabel}</span>
                    </td>
                    <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {c.message ? c.message.slice(0, 60) + (c.message.length > 60 ? '...' : '') : '—'}
                    </td>
                    <td style={s.td}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {c.status === 'scheduled' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SClock /> {formatShort(c.scheduled_at)}</span>
                        ) : c.status === 'sent' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>✅ {formatShort(c.sent_at)}</span>
                        ) : (
                          formatShort(c.created_at)
                        )}
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(st.color, st.bg)}>{st.label}</span>
                    </td>
                    <td style={s.td}>
                      {displayStats ? (
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                          <span>📨 {c.stats?.sent || 0}</span>
                          <span>❌ {c.stats?.failed || 0}</span>
                          <span>👁 {c.stats?.opened || 0}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', padding: '12px 8px' }}>
                      <div style={{ ...s.rowActions, opacity: hoveredRow === c.id ? 1 : 0 }}>
                        {c.status !== 'sent' && (
                          <button style={s.rowBtn} title="Редактировать" onClick={() => { setEditCampaign(c); setShowModal(true); }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                            <SEdit />
                          </button>
                        )}
                        {c.status !== 'sent' && (
                          <button style={s.rowBtn} title="Удалить" onClick={() => handleDelete(c.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                            <SDelete />
                          </button>
                        )}
                        <button style={s.rowBtn} title="Дублировать" onClick={() => handleDuplicate(c)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SDuplicate />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
            Загрузка...
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <CampaignModal campaign={editCampaign} onClose={() => { setShowModal(false); setEditCampaign(null); }} onSaved={() => { load(); setShowModal(false); setEditCampaign(null); }} />
      )}
    </div>
  );
}
