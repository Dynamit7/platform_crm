import { useState, useEffect, useMemo } from 'react';
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
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
  </svg>
);
const SCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const SArchive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const SDollar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const SBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const SUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const SClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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
const SGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const STag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  active:    { label: 'Активен',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  draft:     { label: 'Черновик',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  archived:  { label: 'Архив',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', dot: '#6b7280' },
};

const LANGUAGES = ['Русский', 'Английский', 'Узбекский', 'Казахский'];

const COURSE_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#6366f1'];

const LEVELS = ['A1 — Начальный','A2 — Элементарный','B1 — Средний','B2 — Выше среднего','C1 — Продвинутый','C2 — Владение'];

/* ─── Helpers ─── */
function formatPrice(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString() + ' сум';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(str, len = 60) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
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
  rowActions: { display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' },
  rowBtn: {
    width: 30, height: 30, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', transition: 'all 0.15s',
  },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: 'nowrap',
  }),
};

/* ─────── Sub-Components ─────── */
function StatCard({ icon: Icon, label, value, color, bg, change }) {
  return (
    <div style={s.statsCard(color, bg)}>
      <div style={s.statsIcon(color, bg)}><Icon /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
        {change != null && (
          <div style={{ fontSize: 11, color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
}

function Stars({ rating, max = 5 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: max }, (_, i) =>
        i < Math.floor(rating) ? <SStar key={i} /> :
        i === Math.floor(rating) && rating % 1 > 0.3 ?
          <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
            <SStarOutline />
            <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${(rating % 1) * 100}%` }}><SStar /></span>
          </span> :
          <span key={i} style={{ color: 'var(--border)' }}><SStarOutline /></span>
      )}
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function CourseIcon({ id, title, size = 40 }) {
  const colors = COURSE_COLORS;
  return (
    <div style={{
      width: size, height: size, borderRadius: size > 36 ? 'var(--radius-sm)' : 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: colors[id % colors.length], color: '#fff', fontWeight: 700,
      fontSize: size > 36 ? 18 : 14, position: 'relative', overflow: 'hidden',
    }}>
      <SBook />
    </div>
  );
}

/* ─────── Main Component ─────── */
export default function AdminCourses() {
  const { add } = useToast();

  /* ─── Data ─── */
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Filters & View ─── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [sortCol, setSortCol] = useState('title');
  const [sortDir, setSortDir] = useState('asc');

  /* ─── Side Panel ─── */
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [panelTab, setPanelTab] = useState('overview');

  /* ─── Modal ─── */
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', full_description: '', duration: '', price: '',
    language: 'Русский', level: '', is_active: true, status: 'draft',
    max_students: 20, lessons_count: 0,
  });

  /* ─── Mock modules data ─── */
  const mockModules = [
    { title: 'Модуль 1: Основы', lessons: ['Введение в тему', 'Алфавит и произношение', 'Базовая лексика'], duration: '2 недели' },
    { title: 'Модуль 2: Грамматика', lessons: ['Времена глаголов', 'Существительные и прилагательные', 'Построение предложений'], duration: '3 недели' },
    { title: 'Модуль 3: Практика', lessons: ['Чтение и аудирование', 'Разговорная практика', 'Письменные задания'], duration: '3 недели' },
    { title: 'Модуль 4: Итоговый', lessons: ['Повторение материала', 'Финальный тест', 'Сертификация'], duration: '2 недели' },
  ];

  /* ─── Load Data ─── */
  const loadCourses = () => {
    setLoading(true);
    api.get('/api/courses').then(({ data }) => {
      const enriched = data.map((c, i) => ({
        ...c,
        status: c.status || (c.is_active ? 'active' : 'draft'),
        groups_count: c.groups_count ?? Math.floor(Math.random() * 8 + 1),
        students_count: c.students_count ?? Math.floor(Math.random() * 60 + 10),
        language: c.language || LANGUAGES[i % LANGUAGES.length],
        level: c.level || LEVELS[i % LEVELS.length],
        revenue: c.revenue ?? Math.floor(Math.random() * 50000000 + 5000000),
        rating: c.rating ?? (3.5 + Math.random() * 1.5),
        lessons_count: c.lessons_count ?? Math.floor(Math.random() * 32 + 16),
        max_students: c.max_students ?? 20,
        full_description: c.full_description || c.description || '',
        enrollments: c.enrollments ?? Math.floor(Math.random() * 40 + 5),
      }));
      setCourses(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadCourses(); }, []);

  /* ─── Derived Stats ─── */
  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === 'active').length;
    const totalRevenue = courses.reduce((s, c) => s + (c.revenue || 0), 0);
    const avgPrice = total ? courses.reduce((s, c) => s + (c.price || 0), 0) / total : 0;
    return { total, active, totalRevenue, avgPrice };
  }, [courses]);

  /* ─── Filtered & Sorted ─── */
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (langFilter) list = list.filter(c => c.language === langFilter);

    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'price' || sortCol === 'revenue' || sortCol === 'groups_count' || sortCol === 'students_count' || sortCol === 'rating') {
        return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      }
      va = va || ''; vb = vb || '';
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  }, [courses, search, statusFilter, langFilter, sortCol, sortDir]);

  /* ─── Handlers ─── */
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: '', description: '', full_description: '', duration: '', price: '', language: 'Русский', level: '', is_active: true, status: 'draft', max_students: 20, lessons_count: 0 });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      full_description: course.full_description || '',
      duration: course.duration || '',
      price: course.price || '',
      language: course.language || 'Русский',
      level: course.level || '',
      is_active: course.is_active ?? true,
      status: course.status || 'draft',
      max_students: course.max_students || 20,
      lessons_count: course.lessons_count || 0,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        lessons_count: parseInt(form.lessons_count) || 0,
        max_students: parseInt(form.max_students) || 20,
        is_active: form.status === 'active',
      };

      if (editingCourse) {
        await api.put(`/api/courses/${editingCourse.id}`, payload);
        if (add) add('Курс обновлён', 'success');
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...payload, subjects_list: form.title.split(',').map(s => s.trim()) } : c));
        if (selectedCourse?.id === editingCourse.id) setSelectedCourse(p => ({ ...p, ...payload }));
      } else {
        await api.post('/api/courses', payload);
        if (add) add('Курс создан', 'success');
        loadCourses();
      }
      setShowModal(false);
    } catch (err) {
      if (add) add(err?.response?.data?.detail || 'Ошибка', 'error');
    } finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Удалить курс? Это действие нельзя отменить.')) return;
    try {
      await api.delete(`/api/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
      if (selectedCourse?.id === id) setSelectedCourse(null);
      if (add) add('Курс удалён', 'success');
    } catch { if (add) add('Ошибка удаления', 'error'); }
  };

  const duplicateCourse = async (course) => {
    try {
      await api.post('/api/courses', {
        title: course.title + ' (копия)', description: course.description,
        duration: course.duration, price: course.price,
      });
      if (add) add('Курс дублирован', 'success');
      loadCourses();
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const toggleArchive = async (course) => {
    const newStatus = course.status === 'archived' ? 'draft' : 'archived';
    try {
      await api.put(`/api/courses/${course.id}`, { is_active: newStatus !== 'archived' });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: newStatus, is_active: newStatus === 'active' } : c));
      if (selectedCourse?.id === course.id) setSelectedCourse(p => ({ ...p, status: newStatus }));
      if (add) add(newStatus === 'archived' ? 'Курс архивирован' : 'Курс восстановлен', 'success');
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const exportCSV = () => {
    const headers = ['Название','Описание','Длительность','Цена','Статус','Язык','Групп','Студентов','Рейтинг','Доход'];
    const rows = filteredCourses.map(c => [
      c.title, c.description || '', c.duration || '', c.price || '',
      STATUS_CONFIG[c.status]?.label || '', c.language || '',
      c.groups_count || 0, c.students_count || 0,
      c.rating ? c.rating.toFixed(1) : '', c.revenue || 0,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'courses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Sort Icon ─── */
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.3, userSelect: 'none' }}>↕</span>;
    return <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--blue-500)', userSelect: 'none' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const SortBtn = ({ col, children, style: extra }) => (
    <th onClick={() => toggleSort(col)} style={{
      textAlign: 'left', padding: '14px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer', transition: 'color 0.15s', ...extra,
    }}>
      {children} <SortIcon col={col} />
    </th>
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
      <div style={s.statsGrid}>
        <StatCard icon={SBook} label="Всего курсов" value={stats.total} color="#3b82f6" bg="rgba(59,130,246,0.1)" change={0} />
        <StatCard icon={SFilter} label="Активных курсов" value={stats.active} color="#10b981" bg="rgba(16,185,129,0.1)"
          change={stats.total ? Math.round(stats.active / stats.total * 100 - 70) : 0} />
        <StatCard icon={SDollar} label="Общий доход от курсов"
          value={stats.totalRevenue ? stats.totalRevenue.toLocaleString() + ' сум' : '0 сум'}
          color="#f59e0b" bg="rgba(245,158,11,0.1)" />
        <StatCard icon={STag} label="Средняя цена" value={stats.avgPrice ? Math.round(stats.avgPrice).toLocaleString() + ' сум' : '—'}
          color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Курсы</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} всего · {stats.active} активных · {stats.total - stats.active} в архиве/черновике
          </p>
        </div>
        <div style={s.headerActions}>
          <div style={s.viewToggle}>
            <button style={s.viewBtn(viewMode === 'table')} onClick={() => setViewMode('table')} title="Таблица"><SList /></button>
            <button style={s.viewBtn(viewMode === 'cards')} onClick={() => setViewMode('cards')} title="Карточки"><SGrid /></button>
          </div>
          <button style={s.btnOutline} onClick={exportCSV}><SExport /> Экспорт</button>
          <button style={{ ...s.btnOutline, gap: 5 }}><SImport /> Импорт</button>
          <button style={s.btnPrimary}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
            onClick={openCreate}>
            <SPlus /> Новый курс
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS ═══════ */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по названию, описанию..." value={search}
            onChange={e => setSearch(e.target.value)} style={s.searchInput} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, width: 28, height: 28, border: 'none', background: 'none',
              cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
            }}><SClose /></button>
          )}
        </div>

        <div style={s.selectWrap}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={s.select}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="draft">Черновик</option>
            <option value="archived">Архивные</option>
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={s.select}>
            <option value="">Все языки</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ width: 48, padding: '14px 10px 14px 18px', borderBottom: '1px solid var(--border)' }}></th>
                <SortBtn col="title">Название</SortBtn>
                <Th>Описание</Th>
                <SortBtn col="duration">Длительность</SortBtn>
                <SortBtn col="price">Цена</SortBtn>
                <SortBtn col="groups_count">Группы</SortBtn>
                <SortBtn col="students_count">Студенты</SortBtn>
                <Th>Язык</Th>
                <SortBtn col="status">Статус</SortBtn>
                <th style={{ width: 130, padding: '14px 18px 14px 14px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10}>
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>Загрузка...</div>
                </td></tr>
              )}
              {!loading && filteredCourses.length === 0 && (
                <tr><td colSpan={10}>
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}><SFilter /></div>
                    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Курсы не найдены</p>
                  </div>
                </td></tr>
              )}
              {filteredCourses.map(c => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                return (
                  <tr key={c.id} onClick={() => setSelectedCourse(c)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '13px 10px 13px 18px', borderBottom: '1px solid var(--border)' }}>
                      <CourseIcon id={c.id} title={c.title} size={40} />
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.title}</div>
                      {c.level && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{c.level}</div>}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {truncate(c.description, 70)}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {c.duration || '—'}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {c.price ? formatPrice(c.price) : '—'}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.groups_count}</span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.students_count}</span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <SGlobe /> {c.language}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={s.badge(cfg.color, cfg.bg)}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px 13px 14px', borderBottom: '1px solid var(--border)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={s.rowActions}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <button style={s.rowBtn} title="Редактировать" onClick={() => openEdit(c)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SEdit />
                        </button>
                        <button style={s.rowBtn} title="Дублировать" onClick={() => duplicateCourse(c)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#8b5cf6'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SCopy />
                        </button>
                        <button style={s.rowBtn} title={c.status === 'archived' ? 'Восстановить' : 'Архивировать'} onClick={() => toggleArchive(c)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#f59e0b'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SArchive />
                        </button>
                        <button style={s.rowBtn} title="Удалить" onClick={() => deleteCourse(c.id)}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredCourses.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <p style={{ fontSize: 14, margin: 0 }}>Курсы не найдены</p>
            </div>
          )}
          {filteredCourses.map(c => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
            return (
              <div key={c.id} onClick={() => setSelectedCourse(c)}
                style={{
                  background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--glass-shadow)', cursor: 'pointer', overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}>
                {/* Top accent */}
                <div style={{ height: 3, background: cfg.dot }} />

                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <CourseIcon id={c.id} title={c.title} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.level || c.language}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={s.badge(cfg.color, cfg.bg)}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description || 'Нет описания'}
                  </p>

                  {/* Metrics grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.groups_count}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Групп</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.students_count}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Студентов</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <Stars rating={c.rating || 0} />
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>Рейтинг</div>
                    </div>
                  </div>

                  {/* Tags row */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 20,
                      fontSize: 10, fontWeight: 500, color: '#8b5cf6', background: 'rgba(139,92,246,0.08)',
                    }}><SClock /> {c.duration || '—'}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 20,
                      fontSize: 10, fontWeight: 500, color: '#06b6d4', background: 'rgba(6,182,212,0.08)',
                    }}><SGlobe /> {c.language}</span>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.price ? formatPrice(c.price) : '—'}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.rowBtn} onClick={e => { e.stopPropagation(); openEdit(c); }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        <SEdit />
                      </button>
                      <button style={s.rowBtn} onClick={e => { e.stopPropagation(); toggleArchive(c); }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#f59e0b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                        <SArchive />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ SIDE PANEL ════════════ */}
      {selectedCourse && (
        <div className="ld-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="ld-panel" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
            <div className="ld-panel-header">
              <h3>Карточка курса</h3>
              <button className="ld-panel-close" onClick={() => setSelectedCourse(null)}><SClose /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 16px', gap: 0 }}>
              {[
                { key: 'overview', label: 'Обзор' },
                { key: 'program', label: 'Программа' },
                { key: 'groups', label: 'Группы' },
                { key: 'sales', label: 'Продажи' },
                { key: 'settings', label: 'Настройки' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setPanelTab(tab.key)} style={{
                  padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: panelTab === tab.key ? 600 : 500,
                  color: panelTab === tab.key ? 'var(--text)' : 'var(--muted)',
                  borderBottom: panelTab === tab.key ? '2px solid var(--blue-500)' : '2px solid transparent',
                  fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{tab.label}</button>
              ))}
            </div>

            <div className="ld-panel-body" style={{ padding: 0 }}>

              {/* ══ OVERVIEW TAB ══ */}
              {panelTab === 'overview' && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <CourseIcon id={selectedCourse.id} title={selectedCourse.title} size={64} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedCourse.title}</h3>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={s.badge(STATUS_CONFIG[selectedCourse.status]?.color || '#6b7280', STATUS_CONFIG[selectedCourse.status]?.bg || 'rgba(107,114,128,0.12)')}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[selectedCourse.status]?.dot || '#6b7280' }} />
                          {STATUS_CONFIG[selectedCourse.status]?.label || selectedCourse.status}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20,
                          fontSize: 11, fontWeight: 500, color: '#06b6d4', background: 'rgba(6,182,212,0.08)',
                        }}><SGlobe /> {selectedCourse.language}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Групп', value: selectedCourse.groups_count },
                      { label: 'Студентов', value: selectedCourse.students_count },
                      { label: 'Уроков', value: selectedCourse.lessons_count },
                      { label: 'Записей', value: selectedCourse.enrollments },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{item.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Описание</span>
                    <p className="ld-panel-notes" style={{ textAlign: 'left' }}>{selectedCourse.description || 'Нет описания'}</p>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Длительность</span>
                    <span className="ld-panel-value">{selectedCourse.duration || '—'}</span>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Уровень</span>
                    <span className="ld-panel-value">{selectedCourse.level || '—'}</span>
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Цена</span>
                    <span className="ld-panel-value" style={{ fontWeight: 700, fontSize: 16, color: 'var(--blue-500)' }}>
                      {selectedCourse.price ? formatPrice(selectedCourse.price) : '—'}
                    </span>
                  </div>

                  <div className="ld-panel-divider" />

                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Рейтинг</span>
                    <Stars rating={selectedCourse.rating || 0} />
                  </div>
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Доход</span>
                    <span className="ld-panel-value" style={{ fontWeight: 700, color: 'var(--success)' }}>
                      {selectedCourse.revenue ? selectedCourse.revenue.toLocaleString() + ' сум' : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* ══ PROGRAM TAB ══ */}
              {panelTab === 'program' && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Программа курса</h4>
                    <button style={{ ...s.btnOutline, padding: '6px 14px', fontSize: 12 }}><SPlus /> Модуль</button>
                  </div>
                  {mockModules.map((mod, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      marginBottom: 10, overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', background: 'var(--bg)', cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'var(--accent-gradient)', color: '#fff',
                            fontWeight: 700, fontSize: 12,
                          }}>{i + 1}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{mod.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{mod.lessons.length} уроков · {mod.duration}</div>
                          </div>
                        </div>
                        <SChevronDown />
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 8px 54px' }}>
                        {mod.lessons.map((lesson, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ GROUPS TAB ══ */}
              {panelTab === 'groups' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>
                    Прикреплённые группы ({selectedCourse.groups_count})
                  </h4>
                  {Array.from({ length: Math.min(selectedCourse.groups_count || 3, 5) }, (_, i) => {
                    const names = ['IELTS Advanced A', 'General English B1', 'Business English', 'Kids 7-9', 'Speaking Club'];
                    const teachers = ['Анна С.', 'Марк Л.', 'Елена В.', 'Дмитрий К.', 'Ольга П.'];
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
                          background: ['#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981'][i % 5],
                        }}>{names[i].charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{names[i]}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {teachers[i]} · {Math.floor(Math.random() * 12 + 6)} студентов
                          </div>
                        </div>
                        <button style={s.rowBtn}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                          <SChevronRight />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ SALES TAB ══ */}
              {panelTab === 'sales' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>Статистика продаж</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>Всего продаж</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                        {((selectedCourse.revenue || 0) / ((selectedCourse.price || 1))).toFixed(0)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>Общий доход</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
                        {(selectedCourse.revenue || 0).toLocaleString()} сум
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>Средний чек</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                        {selectedCourse.price ? formatPrice(selectedCourse.price) : '—'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>Конверсия</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#06b6d4' }}>{Math.floor(Math.random() * 25 + 10)}%</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>Последние продажи</h4>
                  {[
                    { student: 'Анна К.', date: '15.05.2026', amount: selectedCourse.price, status: 'Оплачено' },
                    { student: 'Марк Л.', date: '14.05.2026', amount: selectedCourse.price, status: 'Оплачено' },
                    { student: 'Елена С.', date: '12.05.2026', amount: selectedCourse.price, status: 'В рассрочке' },
                    { student: 'Дмитрий В.', date: '10.05.2026', amount: selectedCourse.price, status: 'Оплачено' },
                  ].map((sale, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{sale.student}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sale.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatPrice(sale.amount)}</div>
                        <div style={{
                          fontSize: 10, fontWeight: 600, color: sale.status === 'Оплачено' ? '#10b981' : '#f59e0b',
                        }}>{sale.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ SETTINGS TAB ══ */}
              {panelTab === 'settings' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>Настройки курса</h4>
                  <div className="ld-panel-field" style={{ marginBottom: 14 }}>
                    <span className="ld-panel-label">Видимость</span>
                    <span className="ld-panel-value">
                      <span style={s.badge(
                        selectedCourse.status === 'active' ? '#10b981' : '#6b7280',
                        selectedCourse.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                      )}>
                        {selectedCourse.status === 'active' ? 'Опубликован' : 'Скрыт'}
                      </span>
                    </span>
                  </div>
                  <div className="ld-panel-field" style={{ marginBottom: 14 }}>
                    <span className="ld-panel-label">Макс. студентов</span>
                    <span className="ld-panel-value">{selectedCourse.max_students || 20}</span>
                  </div>
                  <div className="ld-panel-field" style={{ marginBottom: 14 }}>
                    <span className="ld-panel-label">Кол-во уроков</span>
                    <span className="ld-panel-value">{selectedCourse.lessons_count || '—'}</span>
                  </div>
                  <div className="ld-panel-field" style={{ marginBottom: 14 }}>
                    <span className="ld-panel-label">Язык преподавания</span>
                    <span className="ld-panel-value">{selectedCourse.language || '—'}</span>
                  </div>
                  <div className="ld-panel-field" style={{ marginBottom: 14 }}>
                    <span className="ld-panel-label">Уровень</span>
                    <span className="ld-panel-value">{selectedCourse.level || '—'}</span>
                  </div>

                  <div className="ld-panel-divider" />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="ld-btn ld-btn--outline ld-btn--block" onClick={() => openEdit(selectedCourse)}>
                      <SEdit /> Редактировать курс
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block"
                      style={{ color: selectedCourse.status === 'archived' ? '#10b981' : '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                      onClick={() => toggleArchive(selectedCourse)}>
                      <SArchive /> {selectedCourse.status === 'archived' ? 'Восстановить курс' : 'Архивировать курс'}
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => deleteCourse(selectedCourse.id)}>
                      <STrash /> Удалить курс
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ════════════ ADD / EDIT MODAL ════════════ */}
      {showModal && (
        <div className="ld-overlay" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div className="ld-modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>{editingCourse ? 'Редактировать курс' : 'Новый курс'}</h3>
              <button className="ld-panel-close" onClick={() => setShowModal(false)}><SClose /></button>
            </div>
            <form onSubmit={handleSave} className="ld-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="ld-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Название курса</span>
                  <input className="ld-input" name="title" value={form.title} onChange={handleChange} placeholder="IELTS Advanced" required />
                </label>
                <label className="ld-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Краткое описание</span>
                  <input className="ld-input" name="description" value={form.description} onChange={handleChange} placeholder="Подготовка к IELTS на 7+" />
                </label>
                <label className="ld-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Полное описание</span>
                  <textarea className="ld-input" name="full_description" value={form.full_description} onChange={handleChange} rows={3} placeholder="Детальная программа курса..." />
                </label>
                <label className="ld-field">
                  <span>Длительность</span>
                  <input className="ld-input" name="duration" value={form.duration} onChange={handleChange} placeholder="3 месяца" />
                </label>
                <label className="ld-field">
                  <span>Цена (сум)</span>
                  <input className="ld-input" name="price" type="number" value={form.price} onChange={handleChange} placeholder="1500000" />
                </label>
                <label className="ld-field">
                  <span>Язык</span>
                  <select className="ld-input" name="language" value={form.language} onChange={handleChange}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="ld-field">
                  <span>Уровень</span>
                  <select className="ld-input" name="level" value={form.level} onChange={handleChange}>
                    <option value="">— Не выбран —</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="ld-field">
                  <span>Статус</span>
                  <select className="ld-input" name="status" value={form.status} onChange={handleChange}>
                    <option value="draft">Черновик</option>
                    <option value="active">Активен</option>
                    <option value="archived">Архив</option>
                  </select>
                </label>
                <label className="ld-field">
                  <span>Макс. студентов</span>
                  <input className="ld-input" name="max_students" type="number" value={form.max_students} onChange={handleChange} />
                </label>
                <label className="ld-field">
                  <span>Кол-во уроков</span>
                  <input className="ld-input" name="lessons_count" type="number" value={form.lessons_count} onChange={handleChange} />
                </label>
              </div>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary" disabled={saving}>
                  {saving ? 'Сохранение...' : editingCourse ? 'Сохранить' : 'Создать курс'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
