import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend, Line } from 'recharts';

const SPlus = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SExport = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const SChevronDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const SClose = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SArrowUp = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const SArrowDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>);
const SSearch = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const SEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const STrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const SList = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);
const SGrid = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const SFileText = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const SRefresh = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);

const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const EXPENSE_CATEGORIES = [
  { id: 'salary', label: 'Зарплата преподавателей', color: '#ef4444', icon: '👨‍🏫' },
  { id: 'rent', label: 'Аренда', color: '#f97316', icon: '🏢' },
  { id: 'marketing', label: 'Маркетинг / Реклама', color: '#8b5cf6', icon: '📢' },
  { id: 'utilities', label: 'Коммунальные услуги', color: '#06b6d4', icon: '💡' },
  { id: 'other', label: 'Прочие расходы', color: '#6b7280', icon: '📎' },
];
const INCOME_CATEGORIES = [
  { id: 'tuition', label: 'Оплата за обучение', color: '#10b981' },
  { id: 'materials', label: 'Учебные материалы', color: '#3b82f6' },
  { id: 'exam', label: 'Экзамены / Сертификаты', color: '#8b5cf6' },
  { id: 'other_income', label: 'Прочие доходы', color: '#06b6d4' },
];
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Наличные', color: '#10b981' },
  { id: 'card', label: 'Карта', color: '#3b82f6' },
  { id: 'transfer', label: 'Перевод', color: '#8b5cf6' },
  { id: 'click', label: 'Click', color: '#06b6d4' },
  { id: 'payme', label: 'Payme', color: '#f59e0b' },
];
const STATUS_CONFIG = {
  completed: { label: 'Проведён', color: '#10b981', dot: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pending: { label: 'Ожидает', color: '#f59e0b', dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Отменён', color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function fmtMoney(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU') + ' сум';
}

function fmtShort(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('ru-RU');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const s = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 },
  statsCard: { background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--glass-shadow)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'var(--accent-gradient)', color: '#fff', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', color: 'var(--text)', whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'none', color: 'var(--muted)', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  chip: (active) => ({ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: active ? 'none' : '1px solid var(--glass-border)', background: active ? 'var(--accent-gradient)' : 'var(--glass-bg)', color: active ? '#fff' : 'var(--text)', fontFamily: 'inherit', transition: 'all 0.15s' }),
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: p.type === 'line' ? '50%' : 2, background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <strong style={{ color: 'var(--text)' }}>{fmtMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AdminProfitLoss() {
  const { add } = useToast();
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState('month');
  const [view, setView] = useState('chart');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [customDateMode, setCustomDateMode] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('income');
  const [addForm, setAddForm] = useState({ type: 'income', category: 'tuition', amount: '', description: '', date: new Date().toISOString().slice(0, 10), status: 'completed', method: 'cash' });
  const [showNewExpenseCat, setShowNewExpenseCat] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/payments').then(({ data }) => data),
      api.get('/api/courses').then(({ data }) => data).catch(() => []),
      api.get('/api/groups').then(({ data }) => data).catch(() => []),
      api.get('/api/admin/teachers').then(({ data }) => data).catch(() => []),
    ]).then(([payData, coursesData, groupsData, teachersData]) => {
      setPayments(Array.isArray(payData) ? payData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      generateTransactions(Array.isArray(payData) ? payData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getDateRange = () => {
    const now = new Date();
    let from, to = now;
    if (customDateMode && customStart && customEnd) {
      from = new Date(customStart);
      to = new Date(customEnd);
      return { from, to };
    }
    if (period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === 'quarter') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); }
    else { from = new Date(now.getFullYear(), 0, 1); }
    return { from, to };
  };

  const generateTransactions = (payData) => {
    const txns = [];
    const { from } = getDateRange();
    payData.forEach(p => {
      const d = new Date(p.created_at);
      if (!from || d >= from) {
        const studentName = p.student?.name || p.student_name || 'Студент';
        const courseName = p.course?.title || p.course_name || '';
        txns.push({
          id: `inc_${p.id}`, type: 'income', date: p.created_at, category: p.type || 'tuition',
          categoryLabel: INCOME_CATEGORIES.find(c => c.id === (p.type || 'tuition'))?.label || 'Оплата',
          description: `Оплата от ${studentName}${courseName ? ' — ' + courseName : ''}`,
          amount: p.amount || 0, status: p.status || 'completed', method: p.method,
          source: studentName, ref_id: p.id,
        });
      }
    });
    txns.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(txns);
  };

  const { from, to } = useMemo(() => getDateRange(), [period, customDateMode, customStart, customEnd]);

  const filteredTxns = useMemo(() => {
    let list = [...transactions];
    const f = from, t = to;
    if (f) list = list.filter(x => new Date(x.date) >= f);
    if (t) list = list.filter(x => new Date(x.date) <= t);
    if (typeFilter === 'income') list = list.filter(x => x.type === 'income');
    else if (typeFilter === 'expense') list = list.filter(x => x.type === 'expense');
    if (search) { const q = search.toLowerCase(); list = list.filter(x => x.description?.toLowerCase().includes(q) || x.categoryLabel?.toLowerCase().includes(q)); }
    list.sort((a, b) => {
      let va = a[sortCol] || '', vb = b[sortCol] || '';
      if (sortCol === 'amount') return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      va = String(va); vb = String(vb);
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [transactions, from, to, typeFilter, search, sortCol, sortDir]);

  const stats = useMemo(() => {
    const incomeTxns = transactions.filter(x => x.type === 'income' && (!from || new Date(x.date) >= from) && (!to || new Date(x.date) <= to));
    const expenseTxns = transactions.filter(x => x.type === 'expense' && (!from || new Date(x.date) >= from) && (!to || new Date(x.date) <= to));
    const totalIncome = incomeTxns.reduce((s, x) => s + (x.amount || 0), 0);
    const totalExpense = expenseTxns.reduce((s, x) => s + (x.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;
    const cashFlow = totalIncome;
    const paymentCount = incomeTxns.length;
    const avgCheck = incomeTxns.length ? totalIncome / incomeTxns.length : 0;

    const prevFrom = new Date(from);
    const prevTo = new Date(to);
    const diff = to - from;
    prevFrom.setTime(prevFrom.getTime() - diff);
    prevTo.setTime(prevTo.getTime() - diff);
    const prevIncome = transactions.filter(x => x.type === 'income' && new Date(x.date) >= prevFrom && new Date(x.date) <= prevTo).reduce((s, x) => s + (x.amount || 0), 0);
    const prevExpense = transactions.filter(x => x.type === 'expense' && new Date(x.date) >= prevFrom && new Date(x.date) <= prevTo).reduce((s, x) => s + (x.amount || 0), 0);
    const prevNet = prevIncome - prevExpense;

    return { totalIncome, totalExpense, netProfit, cashFlow, paymentCount, avgCheck, prevIncome, prevExpense, prevNet };
  }, [transactions, from, to]);

  const chartData = useMemo(() => {
    const dayMap = {};
    const f = from, t = to;
    let cursor = new Date(f);
    while (cursor <= t) {
      const key = cursor.toISOString().slice(0, 10);
      dayMap[key] = { date: key, income: 0, expense: 0, profit: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
    transactions.forEach(x => {
      const key = new Date(x.date).toISOString().slice(0, 10);
      if (dayMap[key]) {
        if (x.type === 'income') dayMap[key].income += x.amount || 0;
        else dayMap[key].expense += x.amount || 0;
      }
    });
    const data = Object.values(dayMap);
    data.forEach(d => { d.profit = d.income - d.expense; });
    if (data.length > 60) {
      const aggregated = [];
      const weekCount = Math.ceil(data.length / 7);
      for (let i = 0; i < data.length; i += 7) {
        const week = data.slice(i, i + 7);
        aggregated.push({ date: week[0].date, income: week.reduce((s, d) => s + d.income, 0), expense: week.reduce((s, d) => s + d.expense, 0), profit: week.reduce((s, d) => s + d.profit, 0) });
      }
      return aggregated;
    }
    return data;
  }, [transactions, from, to]);

  const incomeByCourse = useMemo(() => {
    const map = {};
    const relevant = payments.filter(p => transactions.some(t => t.ref_id === p.id));
    relevant.forEach(p => {
      const name = p.course_name || 'Без курса';
      map[name] = (map[name] || 0) + (p.amount || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const others = sorted.slice(5);
    const result = sorted.slice(0, 5).map(([name, value]) => ({ name, value }));
    if (others.length > 0) result.push({ name: 'Остальные', value: others.reduce((s, [, v]) => s + v, 0) });
    return result;
  }, [payments, transactions]);

  const incomeByMethod = useMemo(() => {
    const map = {};
    const relevant = payments.filter(p => transactions.some(t => t.ref_id === p.id));
    relevant.forEach(p => {
      const m = p.method || 'cash';
      map[m] = (map[m] || 0) + (p.amount || 0);
    });
    return Object.entries(map).map(([id, value]) => ({ name: PAYMENT_METHODS.find(m => m.id === id)?.label || id, value }));
  }, [payments, transactions]);

  const incomeByManager = useMemo(() => {
    const map = {};
    const relevant = payments.filter(p => transactions.some(t => t.ref_id === p.id));
    relevant.forEach(p => {
      const m = p.manager || 'Не указан';
      map[m] = (map[m] || 0) + (p.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [payments, transactions]);

  const expenseByCategory = useMemo(() => {
    const map = {};
    const currentExpenses = transactions.filter(x => x.type === 'expense' && (!from || new Date(x.date) >= from) && (!to || new Date(x.date) <= to));
    currentExpenses.forEach(x => { map[x.category] = (map[x.category] || 0) + (x.amount || 0); });
    return expenseCategories.map(cat => ({ name: cat.label, value: map[cat.id] || 0, color: cat.color })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [transactions, from, to, expenseCategories]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newTxn = {
        id: `new_${Date.now()}`, type: addType, date: new Date(addForm.date).toISOString(),
        category: addForm.category, categoryLabel: addType === 'income' ? (INCOME_CATEGORIES.find(c => c.id === addForm.category)?.label || addForm.category) : (expenseCategories.find(c => c.id === addForm.category)?.label || addForm.category),
        description: addForm.description, amount: parseFloat(addForm.amount) || 0,
        status: addForm.status, method: addForm.method, source: addType === 'income' ? 'Новый доход' : addForm.category,
      };
      setTransactions(prev => [newTxn, ...prev]);
      if (add) add(addType === 'income' ? 'Доход добавлен' : 'Расход добавлен', 'success');
      setShowAddModal(false);
      setAddForm({ type: 'income', category: 'tuition', amount: '', description: '', date: new Date().toISOString().slice(0, 10), status: 'completed', method: 'cash' });
    } catch { if (add) add('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const addExpenseCategory = () => {
    if (!newExpenseCat.trim()) return;
    const id = `custom_${Date.now()}`;
    setExpenseCategories(prev => [...prev, { id, label: newExpenseCat.trim(), color: `hsl(${Math.random() * 360}, 55%, 55%)`, icon: '📌' }]);
    setNewExpenseCat('');
    setShowNewExpenseCat(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    if (add) add('Операция удалена', 'success');
  };

  const currentMonthLabel = period === 'month' ? 'Этот месяц' : period === 'quarter' ? 'Этот квартал' : period === 'year' ? 'Этот год' : 'Период';

  const Th = ({ col, children }) => (
    <th onClick={col ? () => toggleSort(col) : undefined} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', userSelect: 'none', cursor: col ? 'pointer' : 'default' }}>
      {children} {col && <span style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  if (loading) {
    return <div className="page-content ed-page ed-admin"><div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>Загрузка финансовых данных...</div></div>;
  }

  const periodLabel = customDateMode ? `${formatDate(customStart)} — ${formatDate(customEnd)}` : currentMonthLabel;
  const periodDays = Math.ceil((to - from) / (86400000)) || 1;
  const chartInterval = chartData.length > 60 ? Math.ceil(chartData.length / 8) : Math.ceil(chartData.length / 10);

  return (
    <div className="page-content ed-page ed-admin">

      {/* ═══ HEADER ═══ */}
      <div style={s.header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Доходы и Расходы</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
            Финансовый результат · {periodLabel}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div style={{ position: 'relative' }}>
            <button style={s.btnOutline} onClick={() => { setShowPeriodMenu(p => !p); setShowDatePicker(false); }}>
              <SChevronDown /> {customDateMode ? `${formatDate(customStart)} — ${formatDate(customEnd)}` : currentMonthLabel}
            </button>
            {showPeriodMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180, padding: 6 }}>
                {['month', 'quarter', 'year'].map(p => (
                  <button key={p} onClick={() => { setPeriod(p); setCustomDateMode(false); setShowPeriodMenu(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: period === p && !customDateMode ? 'rgba(37,99,235,0.1)' : 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', borderRadius: 6, textAlign: 'left', fontFamily: 'inherit' }}>
                    {p === 'month' ? 'Этот месяц' : p === 'quarter' ? 'Этот квартал' : 'Этот год'}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button onClick={() => { setCustomDateMode(true); setShowPeriodMenu(false); setShowDatePicker(true); }} style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: customDateMode ? 'rgba(37,99,235,0.1)' : 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', borderRadius: 6, textAlign: 'left', fontFamily: 'inherit' }}>
                  Произвольный период
                </button>
              </div>
            )}
          </div>

          {/* Custom date picker */}
          {showDatePicker && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--glass-bg)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }} />
              <span style={{ color: 'var(--muted)' }}>—</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }} />
              <button onClick={() => setShowDatePicker(false)} style={s.btnGhost}><SClose /></button>
            </div>
          )}

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 3, border: '1px solid var(--glass-border)' }}>
            {['chart', 'table', 'report'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 12px', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: view === v ? 'var(--accent-gradient)' : 'none', color: view === v ? '#fff' : 'var(--muted)',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
              }}>
                {v === 'chart' ? <><SGrid /> График</> : v === 'table' ? <><SList /> Таблица</> : <><SFileText /> Отчёт</>}
              </button>
            ))}
          </div>

          <button style={s.btnPrimary} onClick={() => { setAddType('income'); setShowAddModal(true); }} onMouseEnter={e => { e.target.style.boxShadow = 'var(--shadow-glow)'; e.target.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}>
            <SPlus /> Новый доход
          </button>
          <button style={s.btnOutline} onClick={() => { setAddType('expense'); setShowAddModal(true); }}>
            <SPlus /> Новый расход
          </button>
          <button style={s.btnOutline}><SExport /> Экспорт</button>
        </div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div style={s.statsGrid}>
        {[
          { label: 'Общий доход', value: stats.totalIncome, color: '#10b981', bg: 'rgba(16,185,129,0.1)', prefix: '', prev: stats.prevIncome },
          { label: 'Общие расходы', value: stats.totalExpense, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', prefix: '', prev: stats.prevExpense },
          { label: 'Чистая прибыль', value: stats.netProfit, color: stats.netProfit >= 0 ? '#10b981' : '#ef4444', bg: stats.netProfit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', prefix: '', prev: stats.prevNet },
          { label: 'Cash Flow', value: stats.cashFlow, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', prefix: '', prev: null },
          { label: 'Количество оплат', value: stats.paymentCount, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', prefix: 'шт.', prev: null },
          { label: 'Средний чек', value: stats.avgCheck, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', prefix: '', prev: null },
        ].map((card, i) => {
          const growth = card.prev != null && card.prev !== 0 ? ((card.value - card.prev) / Math.abs(card.prev)) * 100 : 0;
          const isPositive = growth >= 0;
          const isGood = card.label === 'Общие расходы' ? !isPositive : isPositive;
          return (
            <div key={i} style={s.statsCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{card.label}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{card.label === 'Общий доход' ? '↑' : card.label === 'Общие расходы' ? '↓' : card.label === 'Чистая прибыль' ? '✓' : card.label === 'Cash Flow' ? '$' : card.label === 'Количество оплат' ? '#' : 'Ø'}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 8, letterSpacing: '-0.3px' }}>{card.prefix === 'шт.' ? card.value : fmtShort(card.value)}{card.prefix}</div>
              {card.prev != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ color: isGood ? '#10b981' : '#ef4444', display: 'flex' }}>{isPositive ? <SArrowUp /> : <SArrowDown />}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isGood ? '#10b981' : '#ef4444' }}>{Math.abs(growth).toFixed(1)}%</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>vs пред. период</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ VIEW: CHART ═══ */}
      {view === 'chart' && (
        <>
          {/* Main chart */}
          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Динамика доходов и расходов</h3>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>За {periodDays} дней · {chartData.length} точек данных</p>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Доход</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} /> Расход</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: '#3b82f6' }} /> Прибыль</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} interval={chartInterval} tickFormatter={v => { const d = new Date(v); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => fmtShort(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Доход" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.7} />
                <Bar dataKey="expense" name="Расход" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.7} />
                <Area type="monotone" dataKey="profit" name="Прибыль" stroke="#3b82f6" strokeWidth={2} fill="rgba(59,130,246,0.08)" dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Income breakdown */}
            <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px', color: 'var(--text)' }}>Доходы по категориям</h3>

              {/* By Course */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 10 }}>По курсам</div>
                {incomeByCourse.slice(0, 4).map((item, i) => {
                  const pct = stats.totalIncome ? (item.value / stats.totalIncome) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: `hsl(${120 + i * 30}, 55%, 50%)` }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', minWidth: 60, textAlign: 'right' }}>{fmtShort(item.value)}</div>
                    </div>
                  );
                })}
              </div>

              {/* By Method */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 10 }}>По методам оплаты</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {incomeByMethod.map((item, i) => {
                    const pct = stats.totalIncome ? (item.value / stats.totalIncome) * 100 : 0;
                    return (
                      <div key={i} style={{ padding: '8px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PAYMENT_METHODS.find(m => m.label === item.name)?.color || '#6b7280' }} />
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{item.name}</span>
                        <strong style={{ fontSize: 12 }}>{pct.toFixed(1)}%</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Manager */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 10 }}>По менеджерам</div>
                {incomeByManager.slice(0, 4).map((item, i) => {
                  const pct = stats.totalIncome ? (item.value / stats.totalIncome) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', background: `hsl(${i * 60}, 55%, 50%)` }}>{item.name.charAt(0)}</div>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{item.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{fmtShort(item.value)}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expense breakdown */}
            <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Расходы по категориям</h3>
                <button style={{ ...s.btnGhost, fontSize: 11 }} onClick={() => setShowNewExpenseCat(true)}><SPlus /> Категория</button>
              </div>

              {showNewExpenseCat && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                  <input type="text" placeholder="Название категории" value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--glass-bg)', color: 'var(--text)', fontFamily: 'inherit' }} />
                  <button onClick={addExpenseCategory} style={{ ...s.btnPrimary, padding: '8px 16px', fontSize: 12 }}>Добавить</button>
                  <button onClick={() => { setShowNewExpenseCat(false); setNewExpenseCat(''); }} style={s.btnGhost}>Отмена</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {expenseByCategory.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>Нет расходов за выбранный период</div>}
                {expenseByCategory.map((item, i) => {
                  const pct = stats.totalExpense ? (item.value / stats.totalExpense) * 100 : 0;
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{EXPENSE_CATEGORIES.find(c => c.label === item.name)?.icon || '📌'}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
                        </div>
                        <strong style={{ fontSize: 13, color: '#ef4444' }}>{fmtShort(item.value)}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: item.color || '#6b7280' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ VIEW: TABLE ═══ */}
      {view === 'table' && (
        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', overflow: 'auto' }}>
          {/* Table filters */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 280, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
              <input type="text" placeholder="Поиск по описанию..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 36px 9px 38px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--glass-border)' }}>
              {[{ id: 'all', label: 'Все' }, { id: 'income', label: 'Доходы' }, { id: 'expense', label: 'Расходы' }].map(t => (
                <button key={t.id} onClick={() => setTypeFilter(t.id)} style={{
                  padding: '5px 14px', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: typeFilter === t.id ? 'var(--accent-gradient)' : 'none', color: typeFilter === t.id ? '#fff' : 'var(--muted)', fontFamily: 'inherit',
                }}>{t.label}</button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Найдено: {filteredTxns.length}</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <Th col="date">Дата</Th>
                <Th>Тип</Th>
                <Th col="categoryLabel">Категория</Th>
                <Th col="description">Описание</Th>
                <Th col="amount">Сумма</Th>
                <Th col="status">Статус</Th>
                <th style={{ width: 70, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>Нет операций за выбранный период</td></tr>
              )}
              {filteredTxns.map((txn) => {
                const isIncome = txn.type === 'income';
                const cfg = STATUS_CONFIG[txn.status] || STATUS_CONFIG.completed;
                return (
                  <tr key={txn.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(txn.date)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: isIncome ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isIncome ? '#10b981' : '#ef4444' }}>
                        {isIncome ? '↑ Доход' : '↓ Расход'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)' }}>{txn.categoryLabel}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>{txn.description}</span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: isIncome ? '#10b981' : '#ef4444' }}>
                      {isIncome ? '+' : '-'}{fmtShort(txn.amount)}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} /> {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 2, opacity: 0.6 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                        <button onClick={() => deleteTransaction(txn.id)} style={{ width: 28, height: 28, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><STrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ VIEW: REPORT ═══ */}
      {view === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>Сводка P&L</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Общий доход', value: stats.totalIncome, color: '#10b981' },
                { label: 'Общие расходы', value: stats.totalExpense, color: '#ef4444' },
                { label: '', value: null, color: '', divider: true },
                { label: 'Чистая прибыль', value: stats.netProfit, color: stats.netProfit >= 0 ? '#10b981' : '#ef4444', bold: true },
                { label: 'Маржа', value: stats.totalIncome ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) + '%' : '0%', color: stats.netProfit >= 0 ? '#10b981' : '#ef4444' },
                { label: 'Cash Flow', value: stats.cashFlow, color: '#3b82f6' },
                { label: 'Средний чек', value: stats.avgCheck, color: '#f59e0b' },
              ].map((row, i) => row.divider ? <div key={i} style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} /> : (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: row.bold ? 600 : 400, color: 'var(--text)' }}>{row.label}</span>
                  <strong style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color }}>{typeof row.value === 'number' ? fmtShort(row.value) : row.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--backdrop-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>Сравнение с прошлым периодом</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Доход', current: stats.totalIncome, prev: stats.prevIncome, good: 'up' },
                { label: 'Расходы', current: stats.totalExpense, prev: stats.prevExpense, good: 'down' },
                { label: 'Чистая прибыль', current: stats.netProfit, prev: stats.prevNet, good: 'up' },
              ].map((row, i) => {
                const growth = row.prev ? ((row.current - row.prev) / Math.abs(row.prev)) * 100 : 0;
                const isPositive = growth >= 0;
                const isGood = row.good === 'up' ? isPositive : !isPositive;
                return (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>было {fmtShort(row.prev)}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isGood ? '#10b981' : '#ef4444' }}>{fmtShort(row.current)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: isGood ? '#10b981' : '#ef4444', display: 'flex' }}>{isPositive ? <SArrowUp /> : <SArrowDown />}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isGood ? '#10b981' : '#ef4444' }}>{Math.abs(growth).toFixed(1)}%</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>vs прошлый период</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD MODAL ═══ */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={addType === 'income' ? 'Новый доход' : 'Новый расход'}
        width={480}
        footer={
          <>
            <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowAddModal(false)}>Отмена</button>
            <button type="submit" form="profitloss-add-form" className="ld-btn ld-btn--primary" style={{ background: addType === 'expense' ? '#ef4444' : undefined }} disabled={saving}>
              {saving ? 'Сохранение...' : addType === 'income' ? 'Добавить доход' : 'Добавить расход'}
            </button>
          </>
        }
      >
        <form id="profitloss-add-form" onSubmit={handleAddTransaction}>
          <label className="ld-field">
            <span>Тип</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => { setAddType('income'); setAddForm(p => ({ ...p, type: 'income', category: 'tuition' })); }} style={{
                flex: 1, padding: '9px 0', border: '2px solid', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
                background: addType === 'income' ? 'rgba(16,185,129,0.1)' : 'none', borderColor: addType === 'income' ? '#10b981' : 'var(--border)', color: addType === 'income' ? '#10b981' : 'var(--muted)',
              }}>↑ Доход</button>
              <button type="button" onClick={() => { setAddType('expense'); setAddForm(p => ({ ...p, type: 'expense', category: 'rent' })); }} style={{
                flex: 1, padding: '9px 0', border: '2px solid', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
                background: addType === 'expense' ? 'rgba(239,68,68,0.1)' : 'none', borderColor: addType === 'expense' ? '#ef4444' : 'var(--border)', color: addType === 'expense' ? '#ef4444' : 'var(--muted)',
              }}>↓ Расход</button>
            </div>
          </label>

          <label className="ld-field">
            <span>Категория</span>
            <select className="ld-input" value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}>
              {addType === 'income' ? INCOME_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                : expenseCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>

          <label className="ld-field">
            <span>Сумма</span>
            <input className="ld-input" type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" required min="1" />
          </label>

          <label className="ld-field">
            <span>Описание</span>
            <input className="ld-input" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Назначение платежа" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="ld-field">
              <span>Дата</span>
              <input className="ld-input" type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} />
            </label>
            <label className="ld-field">
              <span>Статус</span>
              <select className="ld-input" value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}>
                <option value="completed">Проведён</option>
                <option value="pending">Ожидает</option>
                <option value="cancelled">Отменён</option>
              </select>
            </label>
          </div>

          {addType === 'income' && (
            <label className="ld-field">
              <span>Метод оплаты</span>
              <select className="ld-input" value={addForm.method} onChange={e => setAddForm(p => ({ ...p, method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
          )}
        </form>
      </Modal>

    </div>
  );
}
