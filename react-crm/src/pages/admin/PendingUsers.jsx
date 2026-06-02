import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const SOURCES = [
  { key: '', label: 'Все источники', icon: '🌐' },
  { key: 'web', label: 'Сайт', icon: '🌐' },
  { key: 'telegram', label: 'Telegram', icon: '✈️' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'referral', label: 'Реферал', icon: '🔗' },
  { key: 'crm_convert', label: 'Из CRM', icon: '📋' },
];

const STATUS_OPTS = [
  { key: '', label: 'Все статусы' },
  { key: 'new', label: 'Новые' },
  { key: 'contacted', label: 'Обработаны' },
];

const PERIOD_OPTS = [
  { key: '', label: 'За всё время' },
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'За неделю' },
  { key: 'month', label: 'За месяц' },
];

const s = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '24px 32px' },
  header: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'var(--muted)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 },
  statCard: {
    background: 'var(--surface)', borderRadius: 14, padding: '18px 22px',
    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.2s', cursor: 'default',
  },
  statStat: { fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' },
  statIcon: { fontSize: 20, marginBottom: 6, opacity: 0.7 },
  filters: {
    display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20,
    padding: '14px 18px', background: 'var(--surface)', borderRadius: 12,
    border: '1px solid var(--border)',
  },
  select: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
  },
  searchInput: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
    minWidth: 200, outline: 'none',
  },
  panel: {
    background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
    overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)',
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text)', verticalAlign: 'middle' },
  tdMuted: { padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12, verticalAlign: 'middle' },
  sourceBadge: (source) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: source === 'telegram' ? '#e8f5e9' : source === 'instagram' ? '#fce4ec' : source === 'referral' ? '#fff3e0' : '#e3f2fd',
    color: source === 'telegram' ? '#2e7d32' : source === 'instagram' ? '#c62828' : source === 'referral' ? '#e65100' : '#1565c0',
  }),
  empty: { padding: 60, textAlign: 'center', color: 'var(--muted)' },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  actions: { display: 'flex', gap: 6, alignItems: 'center' },
  btnPrimary: (disabled) => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  }),
  btnOutline: (color) => ({
    padding: '6px 12px', borderRadius: 8, border: `1px solid var(--border)`, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', background: 'transparent', color: color || 'var(--text)', transition: 'all 0.2s', whiteSpace: 'nowrap',
  }),
  btnDanger: {
    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', background: '#fee2e2', color: '#dc2626', transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  bulkBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
  },
  checkbox: { cursor: 'pointer', width: 16, height: 16, accentColor: '#667eea' },
  rowHover: { transition: 'background 0.15s' },
  timeText: (isToday) => ({
    fontSize: 12, color: isToday ? 'var(--text)' : 'var(--muted)',
    fontWeight: isToday ? 600 : 400,
  }),
  contactBtn: {
    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', background: '#e8f5e9', color: '#2e7d32', transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  pagination: { display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 0' },
  pageBtn: (active) => ({
    padding: '6px 12px', borderRadius: 6, border: active ? 'none' : '1px solid var(--border)',
    fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
    color: active ? '#fff' : 'var(--text)', transition: 'all 0.2s',
  }),
};

export default function PendingUsers() {
  const { add } = useToast();
  const [data, setData] = useState({ users: [], stats: { total: 0, today: 0, week: 0, conversion_rate: 0 } });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [selected, setSelected] = useState(new Set());

  const [source, setSource] = useState('');
  const [period, setPeriod] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (period) params.set('period', period);
      if (search) params.set('search', search);
      const { data: res } = await api.get(`/api/admin/pending-users?${params}`);
      setData(res);
    } catch { if (add) add('Ошибка загрузки', 'error'); }
    finally { setLoading(false); }
  }, [source, period, search, add]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approve = async (id, role = 'student') => {
    setBusy(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/api/admin/pending-users/${id}/approve`, { role });
      if (add) add(role === 'student' ? '✅ Стал студентом' : '👨‍🏫 Назначен преподавателем', 'success');
      setData(p => ({ ...p, users: p.users.filter(u => u.id !== id) }));
      setSelected(p => { const n = new Set(p); n.delete(id); return n; });
    } catch { if (add) add('Ошибка', 'error'); }
    finally { setBusy(p => ({ ...p, [id]: false })); }
  };

  const reject = async (id) => {
    if (!confirm('Отклонить заявку?')) return;
    setBusy(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/api/admin/pending-users/${id}/reject`, {});
      if (add) add('❌ Заявка отклонена', 'success');
      setData(p => ({ ...p, users: p.users.filter(u => u.id !== id) }));
      setSelected(p => { const n = new Set(p); n.delete(id); return n; });
    } catch { if (add) add('Ошибка', 'error'); }
    finally { setBusy(p => ({ ...p, [id]: false })); }
  };

  const bulkAction = async (action) => {
    if (selected.size === 0) return;
    const verb = action === 'approve' ? 'Подтвердить' : 'Отклонить';
    if (!confirm(`${verb} ${selected.size} заяв${selected.size > 1 ? 'ок' : 'ку'}?`)) return;
    setLoading(true);
    try {
      await api.post('/api/admin/pending-users/bulk', { ids: [...selected], action, role: 'student' });
      if (add) add(`✅ ${verb === 'Подтвердить' ? 'Подтверждено' : 'Отклонено'} ${selected.size} заявок`, 'success');
      setSelected(new Set());
      await fetchData();
    } catch { if (add) add('Ошибка массового действия', 'error'); }
    finally { setLoading(false); }
  };

  const toggleAll = () => {
    if (selected.size === data.users.length) setSelected(new Set());
    else setSelected(new Set(data.users.map(u => u.id)));
  };

  const toggle = (id) => {
    setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="ed-page ed-admin" style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={s.title}>Заявки на регистрацию</h1>
            <p style={s.subtitle}>Управление регистрациями пользователей</p>
          </div>
          <button onClick={fetchData} style={s.btnOutline()}>
            🔄 {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { icon: '📝', value: data.stats.total, label: 'Всего заявок', color: '#667eea' },
          { icon: '🆕', value: data.stats.today, label: 'Сегодня', color: '#22c55e' },
          { icon: '📅', value: data.stats.week, label: 'За неделю', color: '#f59e0b' },
          { icon: '📈', value: `${data.stats.conversion_rate}%`, label: 'Конверсия в студенты', color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={{ ...s.statStat, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <select style={s.select} value={source} onChange={e => setSource(e.target.value)}>
          {SOURCES.map(o => <option key={o.key} value={o.key}>{o.icon} {o.label}</option>)}
        </select>
        <select style={s.select} value={period} onChange={e => setPeriod(e.target.value)}>
          {PERIOD_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <input
          style={s.searchInput} placeholder="🔍 Поиск по имени, email, телефону..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {(source || period || search) && (
          <button onClick={() => { setSource(''); setPeriod(''); setSearch(''); }}
            style={{ ...s.btnOutline(), color: '#ef4444' }}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div style={s.panel}>
        {/* Bulk bar */}
        {selected.size > 0 && (
          <div style={s.bulkBar}>
            <input type="checkbox" checked={selected.size === data.users.length} onChange={toggleAll} style={s.checkbox} />
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Выбрано: {selected.size}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => bulkAction('approve')} style={s.btnPrimary(false)}>
                ✅ Подтвердить
              </button>
              <button onClick={() => bulkAction('reject')} style={s.btnDanger}>
                🗑 Отклонить
              </button>
            </div>
          </div>
        )}

        {loading && data.users.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Загрузка...</div>
        ) : data.users.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>✅</div>
            <div>Нет заявок на регистрацию</div>
            <div style={{ fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>Все заявки обработаны</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th} width={36}>
                    <input type="checkbox" checked={selected.size === data.users.length && data.users.length > 0}
                      onChange={toggleAll} style={s.checkbox} />
                  </th>
                  <th style={s.th}>Дата и время</th>
                  <th style={s.th}>ФИО / Имя</th>
                  <th style={s.th}>Телефон</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Источник</th>
                  <th style={s.th}>Telegram</th>
                  <th style={s.th}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => {
                  const isToday = u.created_at?.startsWith(todayStr);
                  return (
                    <tr key={u.id} style={{
                      ...s.rowHover, background: selected.has(u.id) ? 'var(--bg)' : 'transparent',
                    }}
                      onMouseEnter={e => { if (!selected.has(u.id)) e.currentTarget.style.background = 'var(--bg)'; }}
                      onMouseLeave={e => { if (!selected.has(u.id)) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={s.td}><input type="checkbox" checked={selected.has(u.id)}
                        onChange={() => toggle(u.id)} style={s.checkbox} /></td>
                      <td style={{ ...s.tdMuted, ...s.timeText(isToday) }}>
                        {u.created_at?.replace('T', ' ') || '—'}
                      </td>
                      <td style={s.td}><strong>{u.name}</strong></td>
                      <td style={s.tdMuted}>{u.phone || '—'}</td>
                      <td style={s.tdMuted}>{u.email}</td>
                      <td style={s.td}>
                        <span style={s.sourceBadge(u.registration_source)}>
                          {SOURCES.find(s => s.key === u.registration_source)?.icon || '🌐'}
                          {' '}{SOURCES.find(s => s.key === u.registration_source)?.label || u.registration_source}
                        </span>
                      </td>
                      <td style={s.tdMuted}>
                        {u.telegram_id ? (
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ {u.telegram_id}</span>
                        ) : '—'}
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          {u.telegram_id && (
                            <button style={s.contactBtn}
                              title="Написать в Telegram"
                              onClick={() => window.open(`https://t.me/${u.telegram_id}`, '_blank')}>
                              ✉️ Связаться
                            </button>
                          )}
                          {!u.telegram_id && (
                            <button style={s.btnOutline('#6366f1')}
                              title="Скопировать email"
                              onClick={() => { navigator.clipboard.writeText(u.email); if (add) add('Email скопирован', 'success'); }}>
                              📋 Email
                            </button>
                          )}
                          <button onClick={() => approve(u.id, 'student')} disabled={busy[u.id]}
                            style={s.btnPrimary(busy[u.id])}>
                            👤 Студент
                          </button>
                          <button onClick={() => approve(u.id, 'teacher')} disabled={busy[u.id]}
                            style={s.btnOutline('#7c3aed')}>
                            👩‍🏫 Учитель
                          </button>
                          <button onClick={() => reject(u.id)} disabled={busy[u.id]}
                            style={s.btnDanger}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
        Показано: {data.users.length} заявок
      </div>
    </div>
  );
}