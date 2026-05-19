import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

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
const SExport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const SImport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const SList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const SGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const SCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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
const SPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SEnvelope = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
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
const SMore = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
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
const SClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const SBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const SChat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const SDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
  </svg>
);
const SChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const SUserCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
  </svg>
);
const SUserX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>
  </svg>
);

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  active:   { label: 'Активен',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  vacation: { label: 'На отпуске', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  inactive: { label: 'Неактивен',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
};

/* ─── Helpers ─── */
function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name) {
  return name ? name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) : '?';
}

/* ─── Inline Style Helpers ─── */
const s = {
  page: { padding: '24px 28px' },
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
  viewToggle: { display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 3, border: '1px solid var(--border)' },
  viewBtn: (isActive) => ({
    width: 34, height: 34, border: 'none', background: isActive ? 'var(--surface)' : 'none',
    borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: isActive ? 'var(--text)' : 'var(--muted)', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s',
  }),
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
  btnIcon: {
    width: 38, height: 38, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  },
  tag: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 500, color: color || '#3b82f6', background: bg || 'rgba(59,130,246,0.1)',
    whiteSpace: 'nowrap',
  }),
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: 'nowrap',
  }),
  rowActions: { display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' },
  rowBtn: {
    width: 30, height: 30, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', transition: 'all 0.15s',
  },
};

/* ─────── Sub-Components ─────── */
function StatCard({ icon: Icon, label, value, color, bg, change, changeLabel }) {
  return (
    <div style={s.statsCard(color, bg)}>
      <div style={s.statsIcon(color, bg)}><Icon /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
        {change != null && (
          <div style={{ fontSize: 11, color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {changeLabel || ''}
          </div>
        )}
      </div>
    </div>
  );
}

function Stars({ rating, max = 5 }) {
  const full = Math.floor(rating);
  const fraction = rating - full;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        i < full ? <SStar key={i} /> :
        i === full && fraction > 0.3 ?
          <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
            <SStarOutline />
            <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fraction * 100}%` }}><SStar /></span>
          </span> :
          <span key={i} style={{ color: 'var(--border)' }}><SStarOutline /></span>
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}

export default function AdminTeachers() {
  const { add } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  /* ─── Data ─── */
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Filters & View ─── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table | cards | calendar
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  /* ─── Side Panel ─── */
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [panelTab, setPanelTab] = useState('profile');

  /* ─── Modal ─── */
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', subjects: '', bio: '', status: 'active' });

  /* ─── Mock extended data ─── */
  const [mockExtended] = useState(() => {
    const groups = ['IELTS Advanced', 'General English A2', 'Business English', 'Kids 7-9', 'Speaking Club'];
    const reviews = [
      { student: 'Анна К.', rating: 5, text: 'Отличный преподаватель!', date: '2026-04-15' },
      { student: 'Марк Л.', rating: 4, text: 'Хорошо объясняет грамматику', date: '2026-04-10' },
      { student: 'Елена С.', rating: 5, text: 'Занятия всегда интересные', date: '2026-03-28' },
    ];
    return { groups, reviews };
  });

  /* ─── Load Data ─── */
  const loadTeachers = () => {
    setLoading(true);
    api.get('/api/admin/teachers?search=' + search).then(({ data }) => {
      const enriched = data.map(t => ({
        ...t,
        status: t.status || (t.is_active ? 'active' : 'inactive'),
        subjects_list: t.subjects ? t.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
        work_hours: t.work_hours || Math.floor(Math.random() * 20 + 10),
        groups_count: t.groups_count || Math.floor(Math.random() * 5),
        salary: t.salary || (Math.floor(Math.random() * 500 + 300)),
        rating: t.rating || (3 + Math.random() * 2),
        hire_date: t.hire_date || t.created_at,
        last_active: t.last_active || new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        lesson_count: t.lesson_count || Math.floor(Math.random() * 50 + 10),
        student_count: t.student_count || Math.floor(Math.random() * 30 + 5),
        attendance_rate: t.attendance_rate || Math.floor(Math.random() * 20 + 80),
      }));
      setTeachers(enriched);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  };

  useEffect(() => { loadTeachers(); }, [search]);

  useEffect(() => {
    api.get('/api/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  /* ─── Derived stats ─── */
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.status === 'active').length;
    const avgHours = total ? (teachers.reduce((s, t) => s + (t.work_hours || 0), 0) / total) : 0;
    const avgRating = total ? (teachers.reduce((s, t) => s + (t.rating || 0), 0) / total) : 0;
    return { total, active, avgHours, avgRating, onVacation: teachers.filter(t => t.status === 'vacation').length };
  }, [teachers]);

  /* ─── Filtered & Sorted ─── */
  const filteredTeachers = useMemo(() => {
    let list = [...teachers];

    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }
    if (courseFilter) {
      list = list.filter(t => t.subjects_list?.some(s => s.toLowerCase().includes(courseFilter)));
    }

    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'name') { va = va || ''; vb = vb || ''; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'salary' || sortCol === 'work_hours' || sortCol === 'groups_count' || sortCol === 'rating') {
        return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      }
      return sortDir === 'asc' ? (va || '').localeCompare(vb || '') : (vb || '').localeCompare(va || '');
    });

    return list;
  }, [teachers, statusFilter, courseFilter, sortCol, sortDir]);

  /* ─── Handlers ─── */
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else {
      setSelectedIds(new Set(filteredTeachers.map(t => t.id)));
      setSelectAll(true);
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/users/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active, status: t.is_active ? 'inactive' : 'active' } : t));
      if (selectedTeacher?.id === id) setSelectedTeacher(p => ({ ...p, is_active: !p.is_active, status: p.is_active ? 'inactive' : 'active' }));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditingTeacher(null);
    setForm({ name: '', email: '', phone: '', password: '', subjects: '', bio: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '',
      subjects: (teacher.subjects_list || []).join(', '),
      bio: teacher.bio || '',
      status: teacher.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTeacher) {
        const { data } = await api.put(`/api/admin/teachers/${editingTeacher.id}`, form);
        if (add) add('Преподаватель обновлён', 'success');
        setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, ...data, name: form.name, email: form.email, phone: form.phone, subjects: form.subjects, bio: form.bio, subjects_list: form.subjects.split(',').map(s => s.trim()).filter(Boolean) } : t));
        if (selectedTeacher?.id === editingTeacher.id) setSelectedTeacher(p => ({ ...p, ...data, name: form.name, email: form.email }));
      } else {
        const { data } = await api.post('/api/admin/teachers', form);
        if (add) add('Преподаватель создан', 'success');
        loadTeachers();
      }
      setShowModal(false);
    } catch (err) {
      if (add) add(err?.response?.data?.detail || 'Ошибка', 'error');
    } finally { setSaving(false); }
  };

  const deleteTeacher = async (id) => {
    if (!confirm('Удалить преподавателя?')) return;
    try {
      await api.delete(`/api/admin/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t.id !== id));
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
      if (add) add('Преподаватель удалён', 'success');
    } catch { if (add) add('Ошибка удаления', 'error'); }
  };

  const exportCSV = () => {
    const headers = ['Имя','Email','Телефон','Статус','Предметы','Нагрузка (ч/нед)','Групп','Рейтинг','Дата найма'];
    const rows = filteredTeachers.map(t => [
      t.name, t.email, t.phone || '', STATUS_CONFIG[t.status]?.label || '',
      (t.subjects_list || []).join('; '), t.work_hours || '', t.groups_count || '',
      t.rating ? t.rating.toFixed(1) : '', formatDate(t.hire_date),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'teachers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Sort Icon ─── */
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.3, userSelect: 'none' }}>↕</span>;
    return <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--blue-500)', userSelect: 'none' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const SortBtn = ({ col, children }) => (
    <th style={{
      textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer', transition: 'color 0.15s',
    }} onClick={() => toggleSort(col)}>
      {children} <SortIcon col={col} />
    </th>
  );

  /* ───────────── RENDER ───────────── */
  return (
    <div className="page-content" style={{ padding: '24px 28px' }}>

      {/* ═══════ STATS BAR ═══════ */}
      <div style={s.statsGrid}>
        <StatCard icon={SUsers} label="Всего преподавателей" value={stats.total} color="#3b82f6" bg="rgba(59,130,246,0.1)" change={0} changeLabel="к прошлому месяцу" />
        <StatCard icon={SUserCheck} label="Активных" value={stats.active} color="#10b981" bg="rgba(16,185,129,0.1)" change={stats.total ? Math.round(stats.active / stats.total * 100 - 80) : 0} />
        <StatCard icon={SClock} label="Средняя нагрузка" value={`${Math.round(stats.avgHours)} ч/нед`} color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        <StatCard icon={SStar} label="Средний рейтинг" value={<Stars rating={stats.avgRating} />} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>
            Преподаватели
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} всего · {stats.active} активных · {stats.onVacation} на отпуске
          </p>
        </div>
        <div style={s.headerActions}>
          <div style={s.viewToggle}>
            <button style={s.viewBtn(viewMode === 'table')} onClick={() => setViewMode('table')} title="Таблица"><SList /></button>
            <button style={s.viewBtn(viewMode === 'cards')} onClick={() => setViewMode('cards')} title="Карточки"><SGrid /></button>
            <button style={s.viewBtn(viewMode === 'calendar')} onClick={() => setViewMode('calendar')} title="Календарь нагрузки"><SCalendar /></button>
          </div>
          <button style={s.btnOutline} onClick={exportCSV}><SExport /> Экспорт</button>
          <button style={{ ...s.btnOutline, gap: 5 }}><SImport /> Импорт</button>
          {selectedIds.size > 0 && (
            <button style={{ ...s.btnOutline, gap: 5, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <STrash /> {selectedIds.size}
            </button>
          )}
          <button style={s.btnPrimary}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
            onClick={openCreate}>
            <SPlus /> Добавить преподавателя
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS ═══════ */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по имени, email, телефону..." value={search}
            onChange={e => setSearch(e.target.value)} style={s.searchInput} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, width: 28, height: 28, border: 'none', background: 'none',
              cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)',
            }}><SClose /></button>
          )}
        </div>

        <div style={s.selectWrap}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={s.select}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="vacation">На отпуске</option>
            <option value="inactive">Неактивные</option>
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={s.select}>
            <option value="">Все курсы</option>
            {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>
      </div>

      {/* ════════════ TABLE VIEW ════════════ */}
      {viewMode === 'table' && (
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)',
          overflow: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead>
              <tr>
                <th style={{ width: 36, padding: '14px 10px 14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#3b82f6', width: 15, height: 15 }} />
                </th>
                <SortBtn col="name">ФИО</SortBtn>
                <th style={{
                  textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}>Email</th>
                <th style={{
                  textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}>Телефон</th>
                <th style={{
                  textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}>Предметы / Курсы</th>
                <SortBtn col="groups_count">Группы</SortBtn>
                <SortBtn col="work_hours">Нагрузка</SortBtn>
                <SortBtn col="rating">Статус</SortBtn>
                <SortBtn col="hire_date">Дата найма</SortBtn>
                {isSuperAdmin && <SortBtn col="salary">Ставка</SortBtn>}
                <th style={{
                  textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}>Активность</th>
                <th style={{ width: 110, padding: '14px 18px 14px 14px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={isSuperAdmin ? 12 : 11}>
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>Загрузка...</div>
                </td></tr>
              )}
              {!loading && filteredTeachers.length === 0 && (
                <tr><td colSpan={isSuperAdmin ? 12 : 11}>
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}><SFilter /></div>
                    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Преподаватели не найдены</p>
                  </div>
                </td></tr>
              )}
              {filteredTeachers.map(t => {
                const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.inactive;
                return (
                  <tr key={t.id} onClick={() => setSelectedTeacher(t)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '13px 10px 13px 18px', borderBottom: '1px solid var(--border)' }}
                      onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)}
                        style={{ cursor: 'pointer', accentColor: '#3b82f6', width: 15, height: 15 }} />
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                          background: `hsl(${t.id * 37 % 360}, 55%, 50%)`,
                          position: 'relative',
                        }}>
                          {getInitials(t.name)}
                          {t.status === 'active' && (
                            <span style={{
                              position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                              borderRadius: '50%', background: '#10b981', border: '2px solid var(--surface)',
                            }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
                          {t.bio && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.bio}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{t.email}</td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{t.phone || '—'}</td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                        {(t.subjects_list || []).length > 0 ? t.subjects_list.map((sub, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20,
                            fontSize: 10, fontWeight: 500, color: '#3b82f6', background: 'rgba(59,130,246,0.08)',
                            whiteSpace: 'nowrap',
                          }}>{sub}</span>
                        )) : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.groups_count}</span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>{t.work_hours} ч</span>
                        <div style={{
                          width: 40, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden',
                        }}>
                          <div style={{ width: `${Math.min(100, (t.work_hours / 30) * 100)}%`, height: '100%', borderRadius: 2, background: 'var(--accent-gradient)' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={s.badge(cfg.color, cfg.bg)}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(t.hire_date)}</td>
                    {isSuperAdmin && (
                      <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                        {t.salary ? `${Number(t.salary).toLocaleString()} сум` : '—'}
                      </td>
                    )}
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <SClock />
                        {timeAgo(t.last_active)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px 13px 14px', borderBottom: '1px solid var(--border)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={s.rowActions}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <button style={s.rowBtn} title="Редактировать" onClick={() => openEdit(t)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SEdit />
                        </button>
                        <button style={s.rowBtn} title={t.status === 'active' ? 'Деактивировать' : 'Активировать'} onClick={() => toggleActive(t.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = t.status === 'active' ? '#ef4444' : '#10b981'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          {t.status === 'active' ? <SUserX /> : <SUserCheck />}
                        </button>
                        <button style={s.rowBtn} title="Удалить" onClick={() => deleteTeacher(t.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <STrash />
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

      {/* ════════════ CARDS VIEW ════════════ */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredTeachers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <p style={{ fontSize: 14, margin: 0 }}>Преподаватели не найдены</p>
            </div>
          )}
          {filteredTeachers.map(t => {
            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.inactive;
            return (
              <div key={t.id}
                onClick={() => setSelectedTeacher(t)}
                style={{
                  background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--glass-shadow)', padding: 0, cursor: 'pointer',
                  transition: 'all 0.25s ease', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}>
                {/* Top accent bar */}
                <div style={{ height: 3, background: cfg.dot }} />

                {/* Card content */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
                      background: `hsl(${t.id * 37 % 360}, 55%, 50%)`,
                      position: 'relative',
                    }}>
                      {getInitials(t.name)}
                      {t.status === 'active' && (
                        <span style={{
                          position: 'absolute', bottom: 1, right: 1, width: 12, height: 12,
                          borderRadius: '50%', background: '#10b981', border: '2px solid var(--surface)',
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                    </div>
                    <span style={s.badge(cfg.color, cfg.bg)}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Quick metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{t.groups_count}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Групп</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{t.work_hours}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Часов/нед</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <Stars rating={t.rating || 0} />
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>Рейтинг</div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(t.subjects_list || []).slice(0, 4).map((sub, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
                        fontSize: 10, fontWeight: 500, color: '#3b82f6', background: 'rgba(59,130,246,0.08)',
                      }}>{sub}</span>
                    ))}
                    {(t.subjects_list || []).length > 4 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
                        fontSize: 10, fontWeight: 500, color: 'var(--muted)', background: 'var(--bg)',
                      }}>+{t.subjects_list.length - 4}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
                      <SClock />
                      {timeAgo(t.last_active)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDate(t.hire_date)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ CALENDAR VIEW ════════════ */}
      {viewMode === 'calendar' && (
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)',
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Нагрузка преподавателей</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button style={{ ...s.btnOutline, padding: '7px 14px', fontSize: 12 }}><SChevronLeft /> Неделя</button>
              <span style={{ fontSize: 14, fontWeight: 600 }}>18 — 24 мая 2026</span>
              <button style={{ ...s.btnOutline, padding: '7px 14px', fontSize: 12 }}>Неделя <SChevronRight /></button>
            </div>
          </div>
          {filteredTeachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>Нет данных для отображения</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--glass-bg)' }}>Преподаватель</th>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
                      <th key={i} style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', minWidth: 80 }}>{d}<br /><span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{18 + i}</span></th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)' }}>Всего</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.slice(0, 15).map(t => {
                    const hours = Array.from({ length: 7 }, () => Math.floor(Math.random() * 4));
                    const total = hours.reduce((s, h) => s + h, 0);
                    return (
                      <tr key={t.id}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, position: 'sticky', left: 0, background: 'var(--glass-bg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0,
                              background: `hsl(${t.id * 37 % 360}, 55%, 50%)`,
                            }}>{getInitials(t.name)}</div>
                            {t.name}
                          </div>
                        </td>
                        {hours.map((h, i) => (
                          <td key={i} style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                            {h > 0 ? (
                              <span style={{
                                display: 'inline-block', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: h > 2 ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.1)',
                                color: h > 2 ? '#3b82f6' : '#10b981',
                                minWidth: 32,
                              }}>{h}ч</span>
                            ) : <span style={{ color: 'var(--border)' }}>—</span>}
                          </td>
                        ))}
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{total}ч</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════ SIDE PANEL ════════════ */}
      {selectedTeacher && (
        <div className="ld-overlay" onClick={() => setSelectedTeacher(null)}>
          <div className="ld-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="ld-panel-header">
              <h3>Карточка преподавателя</h3>
              <button className="ld-panel-close" onClick={() => setSelectedTeacher(null)}><SClose /></button>
            </div>

            {/* Panel tabs */}
            <div style={{
              display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 16px', gap: 0,
            }}>
              {[
                { key: 'profile', label: 'Профиль' },
                { key: 'groups', label: 'Группы и уроки' },
                { key: 'reviews', label: 'Отзывы' },
                { key: 'docs', label: 'Документы' },
                { key: 'activity', label: 'Активность' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setPanelTab(tab.key)}
                  style={{
                    padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: panelTab === tab.key ? 600 : 500,
                    color: panelTab === tab.key ? 'var(--text)' : 'var(--muted)',
                    borderBottom: panelTab === tab.key ? '2px solid var(--blue-500)' : '2px solid transparent',
                    fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="ld-panel-body" style={{ padding: 0 }}>
              {/* ══ PROFILE TAB ══ */}
              {panelTab === 'profile' && (
                <div style={{ padding: 24 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26, margin: '0 auto 12px',
                      background: `hsl(${selectedTeacher.id * 37 % 360}, 55%, 50%)`,
                    }}>
                      {getInitials(selectedTeacher.name)}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedTeacher.name}</h3>
                    <div style={{ marginTop: 8 }}>
                      <StatusDot status={selectedTeacher.status} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedTeacher.groups_count}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Групп</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedTeacher.work_hours} ч</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Нагрузка/нед</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedTeacher.student_count}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Студентов</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedTeacher.attendance_rate}%</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Посещаемость</div>
                    </div>
                  </div>

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Email</span>
                    <a href={`mailto:${selectedTeacher.email}`} className="ld-panel-value ld-panel-value--link">{selectedTeacher.email}</a>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Телефон</span>
                    <a href={`tel:${selectedTeacher.phone}`} className="ld-panel-value ld-panel-value--link">{selectedTeacher.phone || '—'}</a>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Предметы</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {(selectedTeacher.subjects_list || []).map((sub, i) => (
                        <span key={i} style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                          color: '#3b82f6', background: 'rgba(59,130,246,0.08)',
                        }}>{sub}</span>
                      ))}
                    </div>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Дата найма</span>
                    <span className="ld-panel-value">{formatDate(selectedTeacher.hire_date)}</span>
                  </div>
                  {isSuperAdmin && (
                    <div className="ld-panel-field">
                      <span className="ld-panel-label">Ставка</span>
                      <span className="ld-panel-value" style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {selectedTeacher.salary ? `${Number(selectedTeacher.salary).toLocaleString()} сум` : '—'}
                      </span>
                    </div>
                  )}

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-field">
                    <span className="ld-panel-label">О себе</span>
                    <p className="ld-panel-notes" style={{ textAlign: 'left' }}>{selectedTeacher.bio || 'Нет информации'}</p>
                  </div>

                  {/* Workload mini-chart */}
                  <div className="ld-panel-divider" />
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Нагрузка (7 дней)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, marginBottom: 12 }}>
                    {Array.from({ length: 7 }, (_, i) => {
                      const h = Math.floor(Math.random() * 4 + 1);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{
                            width: '100%', height: `${(h / 5) * 48}px`, borderRadius: '4px 4px 0 0',
                            background: 'var(--accent-gradient)', opacity: 0.7, transition: 'opacity 0.2s',
                          }} />
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="ld-panel-actions" style={{ flexDirection: 'row' }}>
                    <button className="ld-btn ld-btn--primary ld-btn--block" onClick={() => { window.location.href = `tel:${selectedTeacher.phone}`; }} disabled={!selectedTeacher.phone}>
                      <SPhone /> Позвонить
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block" onClick={() => { window.location.href = `mailto:${selectedTeacher.email}`; }}>
                      <SEnvelope /> Написать
                    </button>
                  </div>
                </div>
              )}

              {/* ══ GROUPS TAB ══ */}
              {panelTab === 'groups' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Группы ({selectedTeacher.groups_count})</h4>
                  {mockExtended.groups.slice(0, selectedTeacher.groups_count || 3).map((g, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
                        background: ['#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981'][i % 5],
                      }}>{g.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{g}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {Math.floor(Math.random() * 8 + 4)} уроков · {Math.floor(Math.random() * 6 + 3)} студентов
                        </div>
                      </div>
                      <button style={{ ...s.rowBtn, color: 'var(--blue-500)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                        <SChevronRight />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ REVIEWS TAB ══ */}
              {panelTab === 'reviews' && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Stars rating={selectedTeacher.rating || 0} />
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{mockExtended.reviews.length} отзыва</span>
                  </div>
                  {mockExtended.reviews.map((r, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                      marginBottom: 8, border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.student}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>"{r.text}"</p>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{formatDate(r.date)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ DOCUMENTS TAB ══ */}
              {panelTab === 'docs' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Документы и контракт</h4>
                  {[
                    { name: 'Трудовой договор.pdf', date: '15.01.2026', size: '2.4 MB' },
                    { name: 'Паспортные данные.pdf', date: '10.01.2026', size: '1.1 MB' },
                    { name: 'Диплом об образовании.pdf', date: '05.01.2026', size: '3.8 MB' },
                    { name: 'Сертификат IELTS (8.0).pdf', date: '20.12.2025', size: '0.8 MB' },
                  ].map((doc, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 6,
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                      <div style={{ color: '#3b82f6' }}><SDoc /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{doc.date} · {doc.size}</div>
                      </div>
                      <button style={{ ...s.rowBtn }} title="Скачать"
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button className="ld-btn ld-btn--outline ld-btn--block" style={{ marginTop: 12 }}>
                    <SPlus /> Добавить документ
                  </button>
                </div>
              )}

              {/* ══ ACTIVITY TAB ══ */}
              {panelTab === 'activity' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>История активности</h4>
                  {[
                    { text: 'Проведён урок IELTS Advanced', time: new Date(Date.now() - 3600000).toISOString(), type: 'lesson' },
                    { text: 'Выставлены оценки 6 студентам', time: new Date(Date.now() - 7200000).toISOString(), type: 'grade' },
                    { text: 'Обновлён учебный план General English', time: new Date(Date.now() - 86400000).toISOString(), type: 'plan' },
                    { text: 'Зачислен новый студент Марк Л.', time: new Date(Date.now() - 172800000).toISOString(), type: 'enroll' },
                    { text: 'Проведена консультация с родителем', time: new Date(Date.now() - 259200000).toISOString(), type: 'meeting' },
                    { text: 'Отчёт о посещаемости за апрель', time: new Date(Date.now() - 345600000).toISOString(), type: 'report' },
                  ].map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, padding: '10px 0',
                      borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: i % 2 === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: i % 2 === 0 ? '#3b82f6' : '#10b981' }}>
                        <SActivity />
                      </div>
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

      {/* ════════════ ADD / EDIT MODAL ════════════ */}
      {showModal && (
        <div className="ld-overlay" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div className="ld-modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>{editingTeacher ? 'Редактировать преподавателя' : 'Новый преподаватель'}</h3>
              <button className="ld-panel-close" onClick={() => setShowModal(false)}><SClose /></button>
            </div>
            <form onSubmit={handleSave} className="ld-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="ld-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Имя и фамилия</span>
                  <input className="ld-input" name="name" value={form.name} onChange={handleChange} placeholder="Иван Петров" required />
                </label>
                <label className="ld-field">
                  <span>Email</span>
                  <input className="ld-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="ivan@example.com" required />
                </label>
                <label className="ld-field">
                  <span>Телефон</span>
                  <input className="ld-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+998901234567" />
                </label>
                <label className="ld-field">
                  <span>Пароль {editingTeacher && '(оставьте пустым, чтобы не менять)'}</span>
                  <input className="ld-input" name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder={editingTeacher ? 'Не менять' : 'Минимум 6 символов'} required={!editingTeacher} />
                </label>
                <label className="ld-field">
                  <span>Статус</span>
                  <select className="ld-input" name="status" value={form.status} onChange={handleChange}>
                    <option value="active">Активен</option>
                    <option value="vacation">На отпуске</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </label>
              </div>
              <label className="ld-field">
                <span>Предметы (через запятую)</span>
                <input className="ld-input" name="subjects" value={form.subjects} onChange={handleChange} placeholder="IELTS, General English, Business English" required />
              </label>
              <label className="ld-field">
                <span>Биография</span>
                <textarea className="ld-input" name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Опыт работы, образование..." />
              </label>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary" disabled={saving}>
                  {saving ? 'Сохранение...' : editingTeacher ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
