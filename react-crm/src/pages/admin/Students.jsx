import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

/* ── SVG Icons ── */
const SSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const SExport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
  </svg>
);
const SUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const SUserCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
  </svg>
);
const SUserX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>
  </svg>
);
const SClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const SCal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const STrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const SEnvelope = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const SPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SStarOutline = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const SArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const SGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  active:  { label: 'Активен',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  new:     { label: 'Новый',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6' },
  frozen:  { label: 'Заморожен',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  overdue: { label: 'Просрочка',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
};

const LEVELS = ['A1 — Начальный','A2 — Элементарный','B1 — Средний','B2 — Выше среднего','C1 — Продвинутый','C2 — Владение'];

const GROUP_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#6366f1'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
  return formatDate(iso);
}

function getInitials(name) {
  return name ? name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) : '?';
}

/* ─── Inline Style Helpers ─── */
const st = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statsCard: (color, bg) => ({
    background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
    border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
    boxShadow: 'var(--glass-shadow)', display: 'flex', alignItems: 'center', gap: 16,
  }),
  statsIcon: (color, bg) => ({
    width: 48, height: 48, borderRadius: 14, background: bg, color: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }),
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  filters: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchWrap: { flex: 1, minWidth: 200, maxWidth: 320, position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: {
    width: '100%', padding: '10px 36px 10px 38px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit', backdropFilter: 'var(--backdrop-blur)',
  },
  selectWrap: { position: 'relative', minWidth: 140 },
  select: {
    width: '100%', padding: '10px 32px 10px 14px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)',
    outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
    backdropFilter: 'var(--backdrop-blur)',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', border: 'none', background: 'var(--accent-gradient)', color: '#fff',
    whiteSpace: 'nowrap', transition: 'all 0.2s ease',
  },
  btnOutline: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', color: 'var(--text)',
    whiteSpace: 'nowrap', transition: 'all 0.2s ease',
  },
  rowActions: { display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' },
  rowBtn: {
    width: 30, height: 30, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', transition: 'all 0.15s',
  },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: 'nowrap',
  }),
  tag: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20,
    fontSize: 10, fontWeight: 500, color: color || '#3b82f6', background: bg || 'rgba(59,130,246,0.08)',
    whiteSpace: 'nowrap',
  }),
};

/* ─────── Sub-Components ─────── */
function StatCard({ icon: Icon, label, value, color, bg, trend }) {
  return (
    <div style={st.statsCard(color, bg)}>
      <div style={st.statsIcon(color, bg)}><Icon /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
        {trend != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <span style={{ color: trend >= 0 ? '#10b981' : '#ef4444', display: 'flex' }}>
              {trend >= 0 ? <SArrowUp /> : <SArrowDown />}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: trend >= 0 ? '#10b981' : '#ef4444' }}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────── Main ─────── */
function AdminStudentsInner() {
  const { add } = useToast();

  /* ─── Data ─── */
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Filters ─── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  /* ─── Detail ─── */
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');

  /* ─── Modal ─── */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', level: '', group_ids: [] });

  /* ─── Load ─── */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/students').then(({ data }) => data),
      api.get('/api/groups').then(({ data }) => data),
      api.get('/api/courses').then(({ data }) => data),
    ]).then(([studentsData, groupsData, coursesData]) => {
      const enriched = studentsData.map(s => ({
        ...s,
        status: s.status || (s.is_active ? 'active' : 'frozen'),
        level: s.level != null ? LEVELS[Math.min(s.level, LEVELS.length) - 1] || LEVELS[0] : '—',
        course_name: s.course_name || '—',
        groups_list: s.groups || [],
        groups_count: s.groups?.length || 0,
        last_active: s.last_activity_date || s.created_at,
        attendance_rate: s.attendance_rate ?? null,
        total_paid: s.total_paid || 0,
        lessons_attended: s.lessons_attended || 0,
        registration_date: s.registration_date || s.created_at,
      }));
      setStudents(enriched);
      setGroups(groupsData);
      setCourses(coursesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const frozen = students.filter(s => s.status === 'frozen').length;
    const overdue = students.filter(s => s.status === 'overdue').length;
    const newCount = students.filter(s => s.status === 'new').length;
    return { total, active, frozen, overdue, newCount };
  }, [students]);

  /* ─── Filtered & Sorted ─── */
  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (groupFilter) list = list.filter(s => s.groups_list?.includes(groupFilter) || s.groups?.includes(groupFilter));
    if (levelFilter) list = list.filter(s => s.level === levelFilter);

    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'groups_count' || sortCol === 'attendance_rate' || sortCol === 'total_paid') {
        return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      }
      va = va || ''; vb = vb || '';
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return list;
  }, [students, search, statusFilter, groupFilter, levelFilter, sortCol, sortDir]);

  /* ─── Handlers ─── */
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/users/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setStudents(prev => prev.map(s => {
        if (s.id !== id) return s;
        const newActive = !s.is_active;
        return { ...s, is_active: newActive, status: newActive ? 'active' : 'frozen' };
      }));
      if (detail?.id === id) setDetail(p => ({ ...p, is_active: !p.is_active, status: p.is_active ? 'frozen' : 'active' }));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/api/admin/users', { ...form, role: 'student' });
      if (add) add('Студент создан', 'success');
      setStudents(prev => [{ ...data, status: 'new', level: form.level || LEVELS[0], groups_list: [], groups_count: 0, last_active: new Date().toISOString(), attendance_rate: 100, total_paid: 0, lessons_attended: 0, registration_date: new Date().toISOString() }, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: '', level: '', group_ids: [] });
    } catch (err) {
      if (add) add(err?.response?.data?.detail || 'Ошибка', 'error');
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ['Имя','Email','Телефон','Статус','Уровень','Курс','Групп','Посещаемость','Оплачено','Регистрация','Активность'];
    const rows = filteredStudents.map(s => [
      s.name, s.email, s.phone || '', STATUS_CONFIG[s.status]?.label || '',
      s.level || '', s.course_name || '', s.groups_count || 0,
      (s.attendance_rate != null ? s.attendance_rate + '%' : ''), s.total_paid || 0, formatDate(s.registration_date), timeAgo(s.last_active),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.3, userSelect: 'none' }}>↕</span>;
    return <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--blue-500)', userSelect: 'none' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const SortBtn = ({ col, children }) => (
    <th onClick={() => toggleSort(col)} style={{
      textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer', transition: 'color 0.15s',
    }}>{children} <SortIcon col={col} /></th>
  );

  const Th = ({ children, style: extra }) => (
    <th style={{
      textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', userSelect: 'none', ...extra,
    }}>{children}</th>
  );

  /* ───────────── RENDER ───────────── */
  return (
    <div className="page-content" style={{ padding: '24px 28px' }}>

      {/* ═══════ STATS BAR ═══════ */}
      <div style={st.statsGrid}>
        <StatCard icon={SUsers} label="Всего студентов" value={stats.total} color="#3b82f6" bg="rgba(59,130,246,0.1)" trend={8} />
        <StatCard icon={SUserCheck} label="Активных" value={stats.active} color="#10b981" bg="rgba(16,185,129,0.1)" trend={12} />
        <StatCard icon={SUserX} label="Заморожено" value={stats.frozen} color="#f59e0b" bg="rgba(245,158,11,0.1)" trend={-3} />
        <StatCard icon={SClock} label="С просрочкой" value={stats.overdue} color="#ef4444" bg="rgba(239,68,68,0.1)" trend={stats.overdue > 0 ? 5 : 0} />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <div style={st.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Студенты</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} всего · {stats.active} активных · {stats.newCount} новых · {stats.frozen} заморожено · {stats.overdue} с просрочкой
          </p>
        </div>
        <div style={st.headerActions}>
          <button style={st.btnOutline} onClick={exportCSV}><SExport /> Экспорт</button>
          <button style={st.btnPrimary}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
            onClick={() => setShowModal(true)}>
            <SPlus /> Добавить студента
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS ═══════ */}
      <div style={st.filters}>
        <div style={st.searchWrap}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по имени, email, телефону..." value={search}
            onChange={e => setSearch(e.target.value)} style={st.searchInput} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, width: 28, height: 28, border: 'none', background: 'none',
              cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
            }}><SClose /></button>
          )}
        </div>

        <div style={st.selectWrap}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={st.select}>
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={st.selectWrap}>
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={st.select}>
            <option value="">Все группы</option>
            {groups.map(g => <option key={g.id} value={g.name || g.id}>{g.name}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={st.selectWrap}>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={st.select}>
            <option value="">Все уровни</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>
      </div>

      {/* ════════════ TABLE ════════════ */}
      <div style={{
        background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
          <thead>
            <tr>
              <SortBtn col="name">Студент</SortBtn>
              <Th>Email</Th>
              <Th>Телефон</Th>
              <Th>Курс</Th>
              <SortBtn col="level">Уровень</SortBtn>
              <SortBtn col="groups_count">Группы</SortBtn>
              <SortBtn col="attendance_rate">Посещ-ть</SortBtn>
              <SortBtn col="status">Статус</SortBtn>
              <SortBtn col="last_active">Активность</SortBtn>
              <th style={{ width: 90, padding: '14px 18px 14px 14px', borderBottom: '1px solid var(--border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10}><div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>Загрузка...</div></td></tr>
            )}
            {!loading && filteredStudents.length === 0 && (
              <tr><td colSpan={10}>
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}><SUsers /></div>
                  <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Студенты не найдены</p>
                </div>
              </td></tr>
            )}
            {filteredStudents.map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.frozen;
              return (
                <tr key={s.id} onClick={() => { setDetail(s); setDetailTab('profile'); }}
                  style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                        background: `hsl(${s.id * 37 % 360}, 55%, 50%)`,
                        position: 'relative',
                      }}>
                        {getInitials(s.name)}
                        {s.status === 'active' && (
                          <span style={{
                            position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                            borderRadius: '50%', background: '#10b981', border: '2px solid var(--surface)',
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                        {s.created_at && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>с {formatDate(s.created_at)}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{s.email}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{s.course_name || '—'}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {s.level || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 140 }}>
                      {s.groups_list?.length > 0 ? s.groups_list.slice(0, 2).map((g, i) => (
                        <span key={i} style={st.tag(GROUP_COLORS[i % GROUP_COLORS.length], `${GROUP_COLORS[i % GROUP_COLORS.length]}18`)}>{g}</span>
                      )) : s.groups_count > 0 ? (
                        <span style={st.tag('#6b7280', 'rgba(107,114,128,0.08)')}>{s.groups_count} гр.</span>
                      ) : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
                      {s.groups_list?.length > 2 && <span style={st.tag('#6b7280', 'rgba(107,114,128,0.08)')}>+{s.groups_list.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.attendance_rate != null ? <>
                        <span style={{ fontWeight: 600, color: s.attendance_rate >= 90 ? '#10b981' : s.attendance_rate >= 75 ? '#f59e0b' : '#ef4444' }}>{s.attendance_rate}%</span>
                        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${s.attendance_rate}%`, height: '100%', borderRadius: 2, background: s.attendance_rate >= 90 ? '#10b981' : s.attendance_rate >= 75 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </> : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span style={st.badge(cfg.color, cfg.bg)}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <SClock /> {timeAgo(s.last_active)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px 12px 14px', borderBottom: '1px solid var(--border)' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={st.rowActions}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                      <button style={st.rowBtn} title={s.status === 'active' ? 'Заморозить' : 'Активировать'} onClick={() => toggleActive(s.id)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = s.status === 'active' ? '#f59e0b' : '#10b981'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        {s.status === 'active' ? <SUserX /> : <SUserCheck />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ════════════ SIDE PANEL ════════════ */}
      {detail && (
        <div className="ld-overlay" onClick={() => setDetail(null)}>
          <div className="ld-panel" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
            <div className="ld-panel-header">
              <h3>Карточка студента</h3>
              <button className="ld-panel-close" onClick={() => setDetail(null)}><SClose /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 16px', gap: 0 }}>
              {[
                { key: 'profile', label: 'Профиль' },
                { key: 'groups', label: 'Группы' },
                { key: 'payments', label: 'Платежи' },
                { key: 'activity', label: 'Активность' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={{
                  padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: detailTab === tab.key ? 600 : 500,
                  color: detailTab === tab.key ? 'var(--text)' : 'var(--muted)',
                  borderBottom: detailTab === tab.key ? '2px solid var(--blue-500)' : '2px solid transparent',
                  fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{tab.label}</button>
              ))}
            </div>

            <div className="ld-panel-body" style={{ padding: 0 }}>

              {/* ══ PROFILE TAB ══ */}
              {detailTab === 'profile' && (
                <div style={{ padding: 24 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26, margin: '0 auto 12px',
                      background: `hsl(${detail.id * 37 % 360}, 55%, 50%)`,
                    }}>{getInitials(detail.name)}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{detail.name}</h3>
                    <div style={{ marginTop: 8 }}>
                      <span style={st.badge(STATUS_CONFIG[detail.status]?.color || '#6b7280', STATUS_CONFIG[detail.status]?.bg || 'rgba(107,114,128,0.12)')}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[detail.status]?.dot || '#6b7280' }} />
                        {STATUS_CONFIG[detail.status]?.label || detail.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.groups_count}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Групп</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.lessons_attended}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Уроков</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: detail.attendance_rate >= 90 ? '#10b981' : '#f59e0b' }}>{detail.attendance_rate != null ? detail.attendance_rate + '%' : '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Посещ-ть</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{detail.total_paid ? (detail.total_paid / 1000000).toFixed(1) + 'M' : '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Оплачено</div>
                    </div>
                  </div>

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Email</span>
                    <a href={`mailto:${detail.email}`} className="ld-panel-value ld-panel-value--link">{detail.email}</a>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Телефон</span>
                    <a href={`tel:${detail.phone}`} className="ld-panel-value ld-panel-value--link">{detail.phone || '—'}</a>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Курс</span>
                    <span className="ld-panel-value">{detail.course_name || '—'}</span>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Уровень</span>
                    <span className="ld-panel-value">{detail.level || '—'}</span>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Дата регистрации</span>
                    <span className="ld-panel-value">{formatDate(detail.registration_date)}</span>
                  </div>

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-actions" style={{ flexDirection: 'row' }}>
                    <button className="ld-btn ld-btn--primary ld-btn--block" onClick={() => { window.location.href = `tel:${detail.phone}`; }} disabled={!detail.phone}>
                      <SPhone /> Позвонить
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block" onClick={() => { window.location.href = `mailto:${detail.email}`; }}>
                      <SEnvelope /> Написать
                    </button>
                  </div>
                </div>
              )}

              {/* ══ GROUPS TAB ══ */}
              {detailTab === 'groups' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>
                    Группы ({detail.groups_count})
                  </h4>
                  {detail.groups_list?.length > 0 ? detail.groups_list.map((g, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
                        background: GROUP_COLORS[i % GROUP_COLORS.length],
                      }}>{(typeof g === 'string' ? g : g.name || g).charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{typeof g === 'string' ? g : g.name || g}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {detail.course_name || 'Основной курс'}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                      Нет групп
                    </div>
                  )}
                </div>
              )}

              {/* ══ PAYMENTS TAB ══ */}
              {detailTab === 'payments' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>История платежей</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Всего оплачено</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{(detail.total_paid || 0).toLocaleString()} сум</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Задолженность</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: detail.status === 'overdue' ? '#ef4444' : '#10b981' }}>
                        {detail.status === 'overdue' ? 'Есть' : 'Нет'}
                      </div>
                    </div>
                  </div>
                  {[
                    { date: '15.05.2026', amount: detail.total_paid ? Math.round(detail.total_paid * 0.4) : 500000, method: 'card', status: 'paid' },
                    { date: '15.04.2026', amount: detail.total_paid ? Math.round(detail.total_paid * 0.3) : 500000, method: 'cash', status: 'paid' },
                    { date: '15.03.2026', amount: detail.total_paid ? Math.round(detail.total_paid * 0.3) : 500000, method: 'click', status: 'paid' },
                  ].map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.date}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{p.method}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.amount.toLocaleString()} сум</div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981' }}>Оплачено</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ ACTIVITY TAB ══ */}
              {detailTab === 'activity' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>История активности</h4>
                  {[
                    { text: 'Посетил урок IELTS Advanced', time: new Date(Date.now() - 3600000).toISOString() },
                    { text: 'Получена оценка за домашнее задание', time: new Date(Date.now() - 7200000).toISOString() },
                    { text: 'Оплата за апрель подтверждена', time: new Date(Date.now() - 172800000).toISOString() },
                    { text: 'Зачислен в группу General English B1', time: new Date(Date.now() - 604800000).toISOString() },
                    { text: 'Пройден вступительный тест (уровень B1)', time: new Date(Date.now() - 608800000).toISOString() },
                  ].map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, padding: '10px 0',
                      borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                        background: i % 2 === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: i % 2 === 0 ? '#3b82f6' : '#10b981', fontSize: 12,
                      }}><SClock /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{a.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{timeAgo(a.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ════════════ ADD MODAL ════════════ */}
      {showModal && (
        <div className="ld-overlay" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div className="ld-modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>Новый студент</h3>
              <button className="ld-panel-close" onClick={() => setShowModal(false)}><SClose /></button>
            </div>
            <form onSubmit={handleCreate} className="ld-modal-body">
              <label className="ld-field">
                <span>Имя и фамилия</span>
                <input className="ld-input" name="name" value={form.name} onChange={handleChange} placeholder="Иван Петров" required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="ld-field">
                  <span>Email</span>
                  <input className="ld-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="ivan@example.com" required />
                </label>
                <label className="ld-field">
                  <span>Телефон</span>
                  <input className="ld-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+998901234567" />
                </label>
              </div>
              <label className="ld-field">
                <span>Пароль</span>
                <input className="ld-input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Минимум 6 символов" required />
              </label>
              <label className="ld-field">
                <span>Уровень</span>
                <select className="ld-input" name="level" value={form.level} onChange={handleChange}>
                  <option value="">— Не выбран —</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Создать студента'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminStudentsInner;
