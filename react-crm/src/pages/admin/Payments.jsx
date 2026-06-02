import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

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
const SPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
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
const SChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
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
const SReceipt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SHistory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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
const SRepeat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const SUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const SBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const SCal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const STrendUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const SBank = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 21 21 21 21 16 3 16 3 21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="5 6 12 2 19 6"/>
  </svg>
);

/* ─── Config ─── */
const STATUS_CONFIG = {
  paid:     { label: 'Оплачен',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981', icon: '✅' },
  pending:  { label: 'Ожидает',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b', icon: '⏳' },
  overdue:  { label: 'Просрочен',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444', icon: '❌' },
  refunded: { label: 'Возврат',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', dot: '#8b5cf6', icon: '↩️' },
};

const METHOD_CONFIG = {
  cash:     { label: 'Наличные',   icon: '💵', color: '#10b981' },
  card:     { label: 'Карта',      icon: '💳', color: '#3b82f6' },
  bank:     { label: 'Банк',       icon: '🏦', color: '#8b5cf6' },
  click:    { label: 'Click',      icon: '🖱️', color: '#06b6d4' },
  payme:    { label: 'Payme',      icon: '📱', color: '#ec4899' },
  transfer: { label: 'Перевод',    icon: '💸', color: '#f97316' },
};

const PAYMENT_TYPES = [
  { value: 'full', label: 'За курс' },
  { value: 'monthly', label: 'За месяц' },
  { value: 'installment', label: 'Рассрочка' },
  { value: 'trial', label: 'Пробный' },
  { value: 'material', label: 'Материалы' },
  { value: 'exam', label: 'Экзамен' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'За всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Эта неделя' },
  { value: 'month', label: 'Этот месяц' },
  { value: 'quarter', label: 'Квартал' },
];

function formatPrice(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString() + ' сум';
}

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
  filters: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchWrap: { flex: 1, minWidth: 200, maxWidth: 280, position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: {
    width: '100%', padding: '10px 36px 10px 38px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit', backdropFilter: 'var(--backdrop-blur)',
  },
  selectWrap: { position: 'relative', minWidth: 130 },
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
function StatCard({ icon: Icon, label, value, color, bg, trend, trendLabel }) {
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
            <span style={{ fontSize: 11, fontWeight: 600, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────── Main ─────── */
export default function AdminPayments() {
  const { add } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  /* ─── Data ─── */
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Filters ─── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');

  /* ─── Sort ─── */
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  /* ─── Side Panel ─── */
  const [selectedPayment, setSelectedPayment] = useState(null);

  /* ─── Receipt Modal ─── */
  const [receiptPayment, setReceiptPayment] = useState(null);

  /* ─── Modal ─── */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: '', method: 'cash', description: '', type: 'monthly', course_id: '', group_id: '' });

  /* ─── Load ─── */
  useEffect(() => {
    setLoading(true);
    api.get('/api/payments').then(({ data }) => {
      const enriched = data.map(p => ({
        ...p,
        status: p.status || 'pending',
        method: p.method || 'cash',
        type: p.type || 'monthly',
      }));
      setPayments(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.get('/api/admin/students').then(({ data }) => setStudents(data)).catch(() => {});
  }, []);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const paid = payments.filter(p => p.status === 'paid');
    const pending = payments.filter(p => p.status === 'pending');
    const overdue = payments.filter(p => p.status === 'overdue');
    const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);
    const totalOverdue = overdue.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      total: payments.length,
      totalRevenue: totalPaid,
      pendingAmount: totalPending,
      overdueAmount: totalOverdue,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      avgCheck: paid.length ? Math.round(totalPaid / paid.length) : 0,
    };
  }, [payments]);

  /* ─── Generate 30-day revenue mock ─── */
  const revenueData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().slice(0, 10),
        day: d.getDate(),
        month: d.getMonth() + 1,
        value: Math.floor(Math.random() * 8000000 + 2000000),
      };
    });
  }, []);

  const maxRevenue = Math.max(...revenueData.map(d => d.value), 1);

  /* ─── Filtered & Sorted ─── */
  const filteredPayments = useMemo(() => {
    let list = [...payments];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.student?.name || '').toLowerCase().includes(q) ||
        (p.student?.email || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter(p => p.status === statusFilter);
    if (methodFilter) list = list.filter(p => p.method === methodFilter);
    if (typeFilter) list = list.filter(p => p.type === typeFilter);
    if (periodFilter !== 'all') {
      const now = new Date();
      const start = new Date(now);
      if (periodFilter === 'today') start.setHours(0, 0, 0, 0);
      else if (periodFilter === 'week') start.setDate(now.getDate() - now.getDay());
      else if (periodFilter === 'month') start.setDate(1);
      else if (periodFilter === 'quarter') start.setMonth(now.getMonth() - 3);
      list = list.filter(p => p.created_at && new Date(p.created_at) >= start);
    }

    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'amount') return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      va = va || ''; vb = vb || '';
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return list;
  }, [payments, search, statusFilter, methodFilter, typeFilter, periodFilter, sortCol, sortDir]);

  /* ─── Top Students ─── */
  const topStudents = useMemo(() => {
    const map = {};
    payments.filter(p => p.status === 'paid').forEach(p => {
      const name = p.student?.name || 'Неизвестно';
      map[name] = (map[name] || 0) + (p.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [payments]);

  /* ─── Recent payments ─── */
  const recentPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
  }, [payments]);

  /* ─── Handlers ─── */
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir(col === 'created_at' ? 'desc' : 'asc'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/payments/${id}/status`, { status });
      if (add) add(`Статус обновлён на «${STATUS_CONFIG[status]?.label || status}»`, 'success');
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      if (selectedPayment?.id === id) setSelectedPayment(p => ({ ...p, status }));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/payments', {
        student_id: parseInt(form.student_id), amount: parseFloat(form.amount),
        method: form.method, description: form.description, type: form.type,
      });
      if (add) add('Платёж создан', 'success');
      setShowModal(false);
      setForm({ student_id: '', amount: '', method: 'cash', description: '', type: 'monthly', course_id: '', group_id: '' });
      const { data } = await api.get('/api/payments');
      setPayments(data.map(p => ({ ...p, status: p.status || 'pending', method: p.method || 'cash', type: p.type || 'monthly' })));
    } catch (err) {
      if (add) add(err?.response?.data?.detail || 'Ошибка', 'error');
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ['Студент','Сумма','Метод','Тип','Статус','Курс','Группа','Дата','Описание'];
    const rows = filteredPayments.map(p => [
      p.student?.name || '', p.amount || '', p.method || '', p.payment_type?.label || '',
      STATUS_CONFIG[p.status]?.label || '', p.course_name || '', p.group_name || '',
      formatDate(p.created_at), p.description || '',
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
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
    <div className="page-content ed-page ed-admin">

      {/* ═══════ TWO-COLUMN TOP: Stats + Chart (super_admin only) ═══════ */}
      {isSuperAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <StatCard icon={SWallet} label="Всего оплачено" value={formatPrice(stats.totalRevenue)}
              color="#10b981" bg="rgba(16,185,129,0.1)" trend={15} trendLabel="к прошлому месяцу" />
            <StatCard icon={SCal} label="Ожидает оплаты" value={formatPrice(stats.pendingAmount)}
              color="#f59e0b" bg="rgba(245,158,11,0.1)" />
            <StatCard icon={SX} label="Просрочено" value={formatPrice(stats.overdueAmount)}
              color="#ef4444" bg="rgba(239,68,68,0.1)" trend={-5} trendLabel="за неделю" />
            <StatCard icon={SBank} label="Средний чек" value={formatPrice(stats.avgCheck)}
              color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
          </div>
          <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Доход за 30 дней</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                {revenueData.reduce((s, d) => s + d.value, 0).toLocaleString()} сум
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 72 }}>
              {revenueData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, position: 'relative' }}>
                  <div style={{
                    width: '100%', height: `${Math.max(2, (d.value / maxRevenue) * 64)}px`,
                    borderRadius: '2px 2px 0 0',
                    background: i === revenueData.length - 1 ? 'var(--accent-gradient)' : 'var(--blue-400)',
                    opacity: i === revenueData.length - 1 ? 1 : 0.4,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer', position: 'relative',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => { e.currentTarget.style.opacity = i === revenueData.length - 1 ? 1 : 0.4; }} />
                  {i % 5 === 0 && (
                    <span style={{ fontSize: 8, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                      {d.day}/{d.month}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ HEADER ═══════ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Платежи</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            {stats.total} операций · {stats.paidCount} оплачено · {stats.pendingCount} ожидает · {stats.overdueCount} просрочено
          </p>
        </div>
        <div style={s.headerActions}>
          <button style={s.btnOutline} onClick={exportCSV}><SExport /> Экспорт</button>
          <button style={s.btnOutline}><SPrinter /> Печать</button>
          <button style={s.btnPrimary}
            onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
            onClick={() => setShowModal(true)}>
            <SPlus /> Добавить оплату
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS ═══════ */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по студенту, описанию..." value={search}
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
            <option value="">Все статусы</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={s.select}>
            <option value="">Все методы</option>
            {Object.entries(METHOD_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={s.select}>
            <option value="">Все типы</option>
            {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>

        <div style={s.selectWrap}>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} style={s.select}>
            {PERIOD_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><SChevronDown /></span>
        </div>
      </div>

      {/* ════════════ TWO-COLUMN LAYOUT ════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* ══ TABLE ══ */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)',
          overflow: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <SortBtn col="student">Студент</SortBtn>
                <SortBtn col="amount">Сумма</SortBtn>
                <Th>Метод</Th>
                <Th>Тип</Th>
                <Th>Курс / Группа</Th>
                <SortBtn col="status">Статус</SortBtn>
                <SortBtn col="created_at">Дата</SortBtn>
                <th style={{ width: 120, padding: '14px 18px 14px 14px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}><div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>Загрузка...</div></td></tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr><td colSpan={8}>
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}><SWallet /></div>
                    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Платежи не найдены</p>
                  </div>
                </td></tr>
              )}
              {filteredPayments.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.cash;
                const typeLabel = PAYMENT_TYPES.find(t => t.value === p.type)?.label || p.type;
                return (
                  <tr key={p.id} onClick={() => setSelectedPayment(p)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                          background: `hsl(${(p.student_id || p.id || 0) * 37 % 360}, 55%, 50%)`,
                        }}>
                          {p.student?.name ? p.student.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) : '?'.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.student?.name || '—'}</div>
                          {p.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatPrice(p.amount)}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{methodCfg.icon} {methodCfg.label}</span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {typeLabel}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div>{p.course_name || '—'}</div>
                      {p.group_name && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{p.group_name}</div>}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={s.badge(cfg.color, cfg.bg)}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td style={{ padding: '13px 18px 13px 14px', borderBottom: '1px solid var(--border)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={s.rowActions}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        {p.status === 'pending' && (
                          <>
                            <button style={s.rowBtn} title="Подтвердить" onClick={() => updateStatus(p.id, 'paid')}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#10b981'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                              <SCheck />
                            </button>
                            <button style={s.rowBtn} title="Отменить" onClick={() => updateStatus(p.id, 'overdue')}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                              <SX />
                            </button>
                          </>
                        )}
                        {p.status === 'paid' && (
                          <button style={s.rowBtn} title="Возврат" onClick={() => updateStatus(p.id, 'refunded')}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = '#8b5cf6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                            <SRepeat />
                          </button>
                        )}
                        <button style={s.rowBtn} title="Чек" onClick={() => setReceiptPayment(p)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SReceipt />
                        </button>
                        <button style={s.rowBtn} title="История"
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}>
                          <SHistory />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ══ SIDEBAR WIDGETS ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top Students */}
          <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 20,
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>
              <SUsers /> Топ студентов
            </h4>
            {topStudents.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Нет данных</p>
            ) : (
              topStudents.map(([name, amount], i) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < topStudents.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : 'var(--bg)',
                    color: i < 3 ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 11, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                    {amount.toLocaleString()} сум
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Payments */}
          <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 20,
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px', color: 'var(--text)' }}>
              <SHistory /> Последние платежи
            </h4>
            {recentPayments.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Нет платежей</p>
            ) : (
              recentPayments.map((p, i) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                return (
                  <div key={p.id} onClick={() => setSelectedPayment(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: i < recentPayments.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.12s', borderRadius: 4, margin: '0 -4px', padding: '8px 4px',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11,
                    }}>
                      {p.student?.name ? p.student.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.student?.name || '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{timeAgo(p.created_at)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{formatPrice(p.amount)}</div>
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cfg.dot,
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* ════════════ PAYMENT DETAIL — portal-based centered modal ════════════ */}
      <Modal
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Карточка платежа"
        width={480}
      >
        {selectedPayment && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 12px',
                  background: `hsl(${(selectedPayment.student_id || selectedPayment.id || 0) * 37 % 360}, 55%, 50%)`,
                  color: '#fff', fontWeight: 700, fontSize: 24,
                }}>
                  {selectedPayment.student?.name ? selectedPayment.student.name.charAt(0).toUpperCase() : '?'}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedPayment.student?.name || '—'}</h3>
                <div style={{ marginTop: 8 }}>
                  <span style={s.badge(
                    STATUS_CONFIG[selectedPayment.status]?.color || '#6b7280',
                    STATUS_CONFIG[selectedPayment.status]?.bg || 'rgba(107,114,128,0.12)',
                  )}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[selectedPayment.status]?.dot || '#6b7280' }} />
                    {STATUS_CONFIG[selectedPayment.status]?.label || selectedPayment.status}
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue-500)', marginTop: 14 }}>
                  {formatPrice(selectedPayment.amount)}
                </div>
              </div>

              <div className="ld-panel-divider" />

              <div className="ld-panel-field">
                <span className="ld-panel-label">Метод оплаты</span>
                <span className="ld-panel-value">
                  {METHOD_CONFIG[selectedPayment.method]?.icon} {METHOD_CONFIG[selectedPayment.method]?.label || selectedPayment.method}
                </span>
              </div>
              <div className="ld-panel-field">
                <span className="ld-panel-label">Тип платежа</span>
                <span className="ld-panel-value">
                  {PAYMENT_TYPES.find(t => t.value === selectedPayment.type)?.label || selectedPayment.type || '—'}
                </span>
              </div>
              <div className="ld-panel-field">
                <span className="ld-panel-label">Курс</span>
                <span className="ld-panel-value">{selectedPayment.course_name || '—'}</span>
              </div>
              <div className="ld-panel-field">
                <span className="ld-panel-label">Группа</span>
                <span className="ld-panel-value">{selectedPayment.group_name || '—'}</span>
              </div>
              <div className="ld-panel-field">
                <span className="ld-panel-label">Дата создания</span>
                <span className="ld-panel-value">{formatDate(selectedPayment.created_at)}</span>
              </div>
              {selectedPayment.description && (
                <>
                  <div className="ld-panel-divider" />
                  <div className="ld-panel-field">
                    <span className="ld-panel-label">Описание</span>
                    <p className="ld-panel-notes" style={{ textAlign: 'left' }}>{selectedPayment.description}</p>
                  </div>
                </>
              )}

              <div className="ld-panel-divider" />

              {/* Payment history mock */}
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: 'var(--text)' }}>История</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { action: 'Платёж создан', date: selectedPayment.created_at, user: 'Система' },
                  { action: selectedPayment.status === 'paid' ? 'Платёж подтверждён' : selectedPayment.status === 'refunded' ? 'Возврат оформлен' : 'Ожидает подтверждения', date: selectedPayment.updated_at || selectedPayment.created_at, user: 'Администратор' },
                ].filter(Boolean).map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, fontSize: 10,
                      background: i === 0 ? 'rgba(59,130,246,0.1)' : selectedPayment.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: i === 0 ? '#3b82f6' : selectedPayment.status === 'paid' ? '#10b981' : '#f59e0b',
                    }}>{i === 0 ? <SPlus /> : <SCheck />}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{h.action}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.user} · {timeAgo(h.date)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ld-panel-divider" />

              <div className="ld-panel-actions">
                {selectedPayment.status === 'pending' && (
                  <>
                    <button className="ld-btn ld-btn--primary ld-btn--block" onClick={() => updateStatus(selectedPayment.id, 'paid')}>
                      <SCheck /> Подтвердить оплату
                    </button>
                    <button className="ld-btn ld-btn--outline ld-btn--block" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => updateStatus(selectedPayment.id, 'overdue')}>
                      <SX /> Отменить платёж
                    </button>
                  </>
                )}
                {selectedPayment.status === 'paid' && (
                  <button className="ld-btn ld-btn--outline ld-btn--block" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' }}
                    onClick={() => updateStatus(selectedPayment.id, 'refunded')}>
                    <SRepeat /> Оформить возврат
                  </button>
                )}
              </div>
          </div>
        )}
      </Modal>

      {/* ════════════ ADD MODAL ════════════ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Новый платёж"
        width={500}
        footer={
          <>
            <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowModal(false)}>Отмена</button>
            <button type="submit" form="payment-create-form" className="ld-btn ld-btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Создать платёж'}
            </button>
          </>
        }
      >
        <form id="payment-create-form" onSubmit={handleCreate}>
          <label className="ld-field">
            <span>Студент</span>
            <select className="ld-input" name="student_id" value={form.student_id} onChange={handleChange} required>
              <option value="">Выберите студента</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="ld-field">
              <span>Сумма (сум)</span>
              <input className="ld-input" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="1000000" required />
            </label>
            <label className="ld-field">
              <span>Метод оплаты</span>
              <select className="ld-input" name="method" value={form.method} onChange={handleChange}>
                <option value="cash">💵 Наличные</option>
                <option value="card">💳 Карта</option>
                <option value="bank">🏦 Банк</option>
                <option value="click">🖱️ Click</option>
                <option value="payme">📱 Payme</option>
                <option value="transfer">💸 Перевод</option>
              </select>
            </label>
          </div>
          <label className="ld-field">
            <span>Тип платежа</span>
            <select className="ld-input" name="type" value={form.type} onChange={handleChange}>
              {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="ld-field">
            <span>Описание</span>
            <input className="ld-input" name="description" value={form.description} onChange={handleChange} placeholder="Оплата за курс..." />
          </label>
        </form>
      </Modal>

      {/* ════════════ RECEIPT MODAL ════════════ */}
      <Modal
        open={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        title="Квитанция об оплате"
        width={420}
      >
        {receiptPayment && (
          <div id="receipt-content" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>TIL USER</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Языковая школа</div>
            </div>
            <div style={{ borderTop: '2px dashed var(--border)', borderBottom: '2px dashed var(--border)', padding: '16px 0', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>№ платежа:</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>#{receiptPayment.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Студент:</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{receiptPayment.student_name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Дата:</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(receiptPayment.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Сумма:</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#10b981' }}>{formatPrice(receiptPayment.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Метод:</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {METHOD_CONFIG[receiptPayment.method]?.icon} {METHOD_CONFIG[receiptPayment.method]?.label || receiptPayment.method}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Статус:</span>
                <span style={{
                  fontWeight: 600, fontSize: 13,
                  color: STATUS_CONFIG[receiptPayment.status]?.color || 'var(--text)',
                }}>
                  {STATUS_CONFIG[receiptPayment.status]?.label || receiptPayment.status}
                </span>
              </div>
            </div>
            {receiptPayment.description && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                {receiptPayment.description}
              </div>
            )}
            <button className="ld-btn ld-btn--primary" style={{ width: '100%' }}
              onClick={() => window.print()}>
              🖨️ Распечатать
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
