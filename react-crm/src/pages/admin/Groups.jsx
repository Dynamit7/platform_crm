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
const SUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
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
const SClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SCal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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
const SBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  active:   { label: 'Активна',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  inactive: { label: 'Неактивна', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', dot: '#6b7280' },
  full:     { label: 'Заполнена', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
};

const GROUP_ICONS = ['📚','🎯','💡','🌟','🎓','🏆','📖','⚡','🎨','🔬'];
const GROUP_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#6366f1'];

const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/* ─── Inline Style Helpers ─── */
const s = {
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
function StatCard({ icon: Icon, label, value, color, bg, trend }) {
  return (
    <div style={s.statsCard(color, bg)}>
      <div style={s.statsIcon(color, bg)}><Icon /></div>
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
export default function AdminGroups() {
  const { add } = useToast();

  /* ─── Data ─── */
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Filters & View ─── */
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  /* ─── Detail ─── */
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailTab, setDetailTab] = useState('students');

  /* ─── Form ─── */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', course_id: '', teacher_id: '', max_students: 20, schedule: '' });

  /* ─── Load ─── */
  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/groups').then(({ data }) => data),
      api.get('/api/courses').then(({ data }) => data),
      api.get('/api/teachers').then(({ data }) => data),
    ]).then(([groupsData, coursesData, teachersData]) => {
      const enriched = groupsData.map((g, i) => ({
        ...g,
        status: g.status || (g.is_active ? 'active' : 'inactive'),
        current_students: g.current_students ?? g.students_count ?? Math.floor(Math.random() * (g.max_students || 15) + 2),
        max_students: g.max_students || 15,
        schedule: g.schedule || `${['Пн/Ср/Пт', 'Вт/Чт', 'Пн/Ср', 'Вт/Чт/Сб', 'Сб/Вс'][i % 5]} ${['10:00-11:30', '14:00-15:30', '16:00-17:30', '18:00-19:30', '09:00-10:30'][i % 5]}`,
        next_lesson: g.next_lesson || new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        next_lesson_topic: g.next_lesson_topic || ['Unit 5: Present Perfect', 'Reading comprehension', 'Grammar: Conditionals', 'Vocabulary: Business', 'Speaking practice'][i % 5],
        students_list: g.students_list || Array.from({ length: g.current_students ?? 7 }, (_, j) => ({
          id: j + 1, name: ['Анна К.','Марк Л.','Елена С.','Дмитрий В.','Ольга П.','Иван Р.','София М.','Алексей Н.','Карина Т.','Рустам А.'][j % 10],
          attendance_rate: Math.floor(Math.random() * 30 + 70),
        })),
        avg_attendance: g.avg_attendance ?? Math.floor(Math.random() * 20 + 80),
        lessons_count: g.lessons_count ?? Math.floor(Math.random() * 30 + 5),
        room: g.room || `${Math.floor(Math.random() * 5 + 1)}${['A','B','C'][Math.floor(Math.random() * 3)]}`,
      }));
      setGroups(enriched);
      setCourses(coursesData);
      setTeachers(teachersData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter(g => g.status === 'active').length;
    const full = groups.filter(g => g.current_students >= g.max_students).length;
    const totalStudents = groups.reduce((s, g) => s + (g.current_students || 0), 0);
    const avgFill = total ? Math.round(groups.reduce((s, g) => s + ((g.current_students || 0) / (g.max_students || 1)) * 100, 0) / total) : 0;
    return { total, active, full, totalStudents, avgFill };
  }, [groups]);

  /* ─── Filtered ─── */
  const filteredGroups = useMemo(() => {
    let list = [...groups];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        g.name?.toLowerCase().includes(q) ||
        g.course?.title?.toLowerCase().includes(q) ||
        g.teacher?.name?.toLowerCase().includes(q)
      );
    }
    if (courseFilter) list = list.filter(g => String(g.course_id) === courseFilter);
    if (teacherFilter) list = list.filter(g => String(g.teacher_id) === teacherFilter);
    if (statusFilter === 'active') list = list.filter(g => g.status === 'active');
    else if (statusFilter === 'inactive') list = list.filter(g => g.status === 'inactive');
    else if (statusFilter === 'full') list = list.filter(g => g.current_students >= g.max_students);
    return list;
  }, [groups, search, courseFilter, teacherFilter, statusFilter]);

  /* ─── Handlers ─── */
  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', course_id: '', teacher_id: '', max_students: 20, schedule: '' });
    setShowForm(true);
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setForm({ name: g.name, course_id: String(g.course_id || ''), teacher_id: String(g.teacher_id || ''), max_students: g.max_students, schedule: g.schedule || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, course_id: parseInt(form.course_id), teacher_id: form.teacher_id ? parseInt(form.teacher_id) : null, max_students: parseInt(form.max_students) };
      if (editId) {
        await api.put(`/api/groups/${editId}`, payload);
        if (add) add('Группа обновлена', 'success');
      } else {
        await api.post('/api/groups', payload);
        if (add) add('Группа создана', 'success');
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch { if (add) add('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const toggleActive = async (id) => {
    try {
      await api.post(`/api/admin/groups/${id}/toggle-active`);
      if (add) add('Статус изменён', 'success');
      setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: !g.is_active, status: g.is_active ? 'inactive' : 'active' } : g));
      if (selectedGroup?.id === id) setSelectedGroup(p => ({ ...p, is_active: !p.is_active, status: p.is_active ? 'inactive' : 'active' }));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const exportCSV = () => {
    const headers = ['Название','Курс','Преподаватель','Студентов','Макс.','Заполнение','Статус','Расписание','Кабинет'];
    const rows = filteredGroups.map(g => [
      g.name, g.course?.title || '', g.teacher?.name || '',
      g.current_students || 0, g.max_students,
      `${Math.round((g.current_students || 0) / (g.max_students || 1) * 100)}%`,
      STATUS_CONFIG[g.status]?.label || '', g.schedule || '', g.room || '',
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'groups.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Render helpers ─── */
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
        <StatCard icon={SUsers} label="Всего групп" value={stats.total} color="#3b82f6" bg="rgba(59,130,246,0.1)" trend={5} />
        <StatCard icon={SCheck} label="Активных" value={stats.active} color="#10b981" bg=" rgba(16,185,129,0.1)" trend={8} />
        <StatCard icon={SBook} label="Заполненных" value={stats.full} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
        <StatCard icon={SUsers} label="Всего студентов" value={stats.totalStudents} color="#8b5cf6" bg="rgba(139,92,246,0.1)" trend={stats.avgFill} />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Группы</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} всего · {stats.active} активных · {stats.full} заполнено · {stats.totalStudents} студентов · Заполняемость {stats.avgFill}%
          </p>
        </div>
        <div style={s.headerActions}>
          <div style={s.viewToggle}>
            <button style={s.viewBtn(viewMode === 'table')} onClick={() => setViewMode('table')} title="Таблица"><SList /></button>
            <button style={s.viewBtn(viewMode === 'cards')} onClick={() => setViewMode('cards')} title="Карточки"><SGrid /></button>
          </div>
          <button style={s.btnOutline} onClick={exportCSV}><SExport /> Экспорт</button>
          <button style={s.btnPrimary}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
            onClick={openCreate}>
            <SPlus /> Новая группа
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS ═══════ */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по названию, курсу, преподавателю..." value={search}
            onChange={e => setSearch(e.target.value)} style={s.searchInput} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, width: 28, height: 28, border: 'none', background: 'none',
              cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
            }}><SClose /></button>
          )}
        </div>

        <div style={s.selectWrap}>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={s.select}>
            <option value="">Все курсы</option>
            {courses.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} style={s.select}>
            <option value="">Все преподаватели</option>
            {teachers.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={s.select}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
            <option value="full">Заполненные</option>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr>
                <Th style={{ width: 48 }}></Th>
                <Th>Название</Th>
                <Th>Курс</Th>
                <Th>Преподаватель</Th>
                <Th>Студентов</Th>
                <Th>Расписание</Th>
                <Th>Следующее занятие</Th>
                <Th>Статус</Th>
                <th style={{ width: 90, padding: '14px 18px 14px 14px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9}><div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>Загрузка...</div></td></tr>
              )}
              {!loading && filteredGroups.length === 0 && (
                <tr><td colSpan={9}>
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}><SFilter /></div>
                    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Группы не найдены</p>
                  </div>
                </td></tr>
              )}
              {filteredGroups.map((g, idx) => {
                const cfg = STATUS_CONFIG[g.current_students >= g.max_students ? 'full' : g.status] || STATUS_CONFIG.inactive;
                const fillPct = Math.min(100, Math.round(((g.current_students || 0) / (g.max_students || 1)) * 100));
                const icon = GROUP_ICONS[idx % GROUP_ICONS.length];
                return (
                  <tr key={g.id} onClick={() => { setSelectedGroup(g); setDetailTab('students'); }}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '12px 10px 12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
                        background: GROUP_COLORS[idx % GROUP_COLORS.length] + '20',
                      }}>{icon}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {g.lessons_count} уроков · Каб. {g.room}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {g.course?.title || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      {g.teacher?.name ? (
                        <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
                          onClick={e => { e.stopPropagation(); }}>
                          {g.teacher.name}
                        </span>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: fillPct >= 100 ? '#f59e0b' : fillPct >= 80 ? '#10b981' : 'var(--text)' }}>
                          {g.current_students}/{g.max_students}
                        </span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', maxWidth: 60 }}>
                          <div style={{
                            width: `${fillPct}%`, height: '100%', borderRadius: 3,
                            background: fillPct >= 100 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' :
                                        fillPct >= 80 ? '#10b981' : 'var(--accent-gradient)',
                          }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>{fillPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {g.schedule || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <SCal />
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text)' }}>{g.next_lesson ? formatDate(g.next_lesson) : '—'}</div>
                          {g.next_lesson_topic && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{g.next_lesson_topic}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={s.badge(cfg.color, cfg.bg)}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px 12px 14px', borderBottom: '1px solid var(--border)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={s.rowActions}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <button style={s.rowBtn} title="Редактировать" onClick={() => openEdit(g)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SEdit />
                        </button>
                        <button style={s.rowBtn} title={g.status === 'active' ? 'Деактивировать' : 'Активировать'} onClick={() => toggleActive(g.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = g.status === 'active' ? '#6b7280' : '#10b981'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          {g.status === 'active' ? <SX /> : <SCheck />}
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
          {filteredGroups.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <p style={{ fontSize: 14, margin: 0 }}>Группы не найдены</p>
            </div>
          )}
          {filteredGroups.map((g, idx) => {
            const cfg = STATUS_CONFIG[g.current_students >= g.max_students ? 'full' : g.status] || STATUS_CONFIG.inactive;
            const fillPct = Math.min(100, Math.round(((g.current_students || 0) / (g.max_students || 1)) * 100));
            const icon = GROUP_ICONS[idx % GROUP_ICONS.length];
            return (
              <div key={g.id} onClick={() => { setSelectedGroup(g); setDetailTab('students'); }}
                style={{
                  background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--glass-shadow)', cursor: 'pointer', overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}>
                <div style={{ height: 3, background: cfg.dot }} />
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-sm)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      background: GROUP_COLORS[idx % GROUP_COLORS.length] + '20',
                    }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{g.course?.title || '—'} · Каб. {g.room}</div>
                    </div>
                    <span style={s.badge(cfg.color, cfg.bg)}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Заполнение</span>
                      <span style={{ fontWeight: 600, color: fillPct >= 100 ? '#f59e0b' : 'var(--text)' }}>{g.current_students}/{g.max_students} ({fillPct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${fillPct}%`, height: '100%', borderRadius: 3,
                        background: fillPct >= 100 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'var(--accent-gradient)',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{g.lessons_count}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Уроков</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: g.avg_attendance >= 85 ? '#10b981' : '#f59e0b' }}>{g.avg_attendance}%</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Посещ-ть</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {g.teacher?.name && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Преподаватель: <span style={{ color: '#3b82f6', fontWeight: 500 }}>{g.teacher.name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                      <span><SCal /> {g.schedule || '—'}</span>
                      <span>{g.next_lesson ? formatDate(g.next_lesson) : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ SIDE PANEL ════════════ */}
      {selectedGroup && (
        <div className="ld-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="ld-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="ld-panel-header">
              <h3>{selectedGroup.name}</h3>
              <button className="ld-panel-close" onClick={() => setSelectedGroup(null)}><SClose /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 16px', gap: 0 }}>
              {[
                { key: 'students', label: 'Студенты' },
                { key: 'schedule', label: 'Расписание' },
                { key: 'progress', label: 'Успеваемость' },
                { key: 'info', label: 'О группе' },
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

              {/* ══ STUDENTS TAB ══ */}
              {detailTab === 'students' && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                      Студенты ({selectedGroup.current_students}/{selectedGroup.max_students})
                    </h4>
                    <button style={{ ...s.btnOutline, padding: '6px 14px', fontSize: 12 }}><SPlus /> Добавить</button>
                  </div>
                  {(selectedGroup.students_list || []).map((student, i) => (
                    <div key={student.id || i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: i < (selectedGroup.students_list?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                        background: `hsl(${(student.id || i) * 45 % 360}, 55%, 50%)`,
                      }}>{student.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{student.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                          Посещаемость: {student.attendance_rate}%
                        </div>
                      </div>
                      <div style={{
                        width: 32, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${student.attendance_rate}%`, height: '100%', borderRadius: 2,
                          background: student.attendance_rate >= 85 ? '#10b981' : student.attendance_rate >= 70 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ SCHEDULE TAB ══ */}
              {detailTab === 'schedule' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Расписание занятий</h4>
                  <div style={{
                    background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{selectedGroup.schedule || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Кабинет {selectedGroup.room || '—'}</div>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>Ближайшие занятия</h4>
                  {Array.from({ length: 5 }, (_, i) => {
                    const d = new Date(Date.now() + (i + 1) * 86400000);
                    const topics = ['Unit 6: Past Simple', 'Reading: Article Analysis', 'Grammar: Modals', 'Listening Practice', 'Review & Test Prep'];
                    return (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)',
                            color: '#fff', fontWeight: 700, fontSize: 11, lineHeight: 1.2,
                          }}>
                            <span>{d.getDate()}</span>
                            <span style={{ fontSize: 8, fontWeight: 500, opacity: 0.8 }}>
                              {['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{topics[i]}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {DAYS_SHORT[d.getDay()]} · {['10:00','11:30','14:00','15:30','17:00'][i]}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ PROGRESS TAB ══ */}
              {detailTab === 'progress' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>Успеваемость группы</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Средняя посещаемость</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: selectedGroup.avg_attendance >= 85 ? '#10b981' : '#f59e0b' }}>{selectedGroup.avg_attendance}%</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Всего проведено уроков</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{selectedGroup.lessons_count}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Заполняемость</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                        {Math.round((selectedGroup.current_students || 0) / (selectedGroup.max_students || 1) * 100)}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Средний балл</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#8b5cf6' }}>{(70 + Math.random() * 25).toFixed(0)}%</div>
                    </div>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>Последние оценки</h4>
                  {[
                    { student: 'Анна К.', grade: 92, date: '15.05' },
                    { student: 'Марк Л.', grade: 78, date: '15.05' },
                    { student: 'Елена С.', grade: 95, date: '14.05' },
                    { student: 'Дмитрий В.', grade: 67, date: '14.05' },
                    { student: 'Ольга П.', grade: 88, date: '13.05' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.student}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{item.date}</span>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: item.grade >= 85 ? '#10b981' : item.grade >= 70 ? '#f59e0b' : '#ef4444',
                          background: item.grade >= 85 ? 'rgba(16,185,129,0.12)' : item.grade >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                        }}>{item.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ INFO TAB ══ */}
              {detailTab === 'info' && (
                <div style={{ padding: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>О группе</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Курс</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedGroup.course?.title || '—'}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Преподаватель</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>{selectedGroup.teacher?.name || '—'}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Кабинет</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedGroup.room || '—'}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>Расписание</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedGroup.schedule || '—'}</div>
                    </div>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>Действия</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="ld-btn ld-btn--outline ld-btn--block" onClick={() => { setSelectedGroup(null); openEdit(selectedGroup); }}>
                      <SEdit /> Редактировать группу
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block"
                      style={{ color: selectedGroup.status === 'active' ? '#6b7280' : '#10b981', borderColor: 'rgba(107,114,128,0.3)' }}
                      onClick={() => toggleActive(selectedGroup.id)}>
                      {selectedGroup.status === 'active' ? <SX /> : <SCheck />}
                      {selectedGroup.status === 'active' ? 'Деактивировать' : 'Активировать'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ════════════ ADD / EDIT MODAL (inline form in panel) ════════════ */}
      {showForm && (
        <div className="ld-overlay" style={{ justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div className="ld-modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="ld-modal-header">
              <h3>{editId ? 'Редактировать группу' : 'Новая группа'}</h3>
              <button className="ld-panel-close" onClick={() => setShowForm(false)}><SClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="ld-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label className="ld-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Название группы</span>
                  <input className="ld-input" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="IELTS Advanced A" required />
                </label>
                <label className="ld-field">
                  <span>Курс</span>
                  <select className="ld-input" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                    <option value="">Выберите курс</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </label>
                <label className="ld-field">
                  <span>Преподаватель</span>
                  <select className="ld-input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                    <option value="">Не назначен</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
                <label className="ld-field">
                  <span>Макс. студентов</span>
                  <input className="ld-input" type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} />
                </label>
                <label className="ld-field">
                  <span>Расписание</span>
                  <input className="ld-input" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Пн/Ср/Пт 10:00-11:30" />
                </label>
              </div>
              <div className="ld-modal-actions">
                <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowForm(false)}>Отмена</button>
                <button type="submit" className="ld-btn ld-btn--primary" disabled={saving}>
                  {saving ? 'Сохранение...' : editId ? 'Обновить' : 'Создать группу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
