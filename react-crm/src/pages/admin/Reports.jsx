import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

/* ── recharts ── */
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';

/* ── SVG Icons ── */
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconTrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);
const IconRevenue = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconStudents = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5"/>
  </svg>
);
const IconTarget = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconGroups = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconSort = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const KPI_ICONS = [IconRevenue, IconStudents, IconTarget, IconCheckCircle, IconGroups, IconWallet];
const KPI_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
const KPI_BGS = ['rgba(59,130,246,0.12)', 'rgba(16,185,129,0.12)', 'rgba(139,92,246,0.12)', 'rgba(245,158,11,0.12)', 'rgba(236,72,153,0.12)', 'rgba(6,182,212,0.12)'];

const SOURCE_LABELS = { instagram: 'Instagram', telegram: 'Telegram', facebook: 'Facebook', friend: 'По рекомендации', website: 'Сайт', other: 'Другое' };
const SOURCE_COLORS = ['#ec4899', '#3b82f6', '#1877f2', '#10b981', '#8b5cf6', '#94a3b8'];

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('ru-RU');
}

function fmtMoney(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('ru-RU')} сум`;
}

function CustomTooltip({ active, payload, label, prefix }) {
  if (!active || !payload) return null;
  return (
    <div className="rp-tooltip">
      <div className="rp-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="rp-tooltip-row">
          <span className="rp-tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <strong>{prefix}{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

export default function AdminReports() {
  const { theme } = useTheme();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/admin/reports').then(({ data: d }) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="page-content"><div className="page-loading"><div className="spinner" /></div></div>;
  }

  const s = data?.summary || {};
  const kpis = [
    { label: 'Общий доход', value: fmtMoney(s.total_revenue), sub: `${fmtMoney(s.this_month_revenue)} в этом месяце`, growth: s.revenue_growth },
    { label: 'Новых студентов', value: s.new_students, sub: `Всего ${s.total_students}`, growth: s.student_growth },
    { label: 'Конверсия заявок', value: `${s.lead_conversion_rate ?? 0}%`, sub: 'В зачисленных', growth: null },
    { label: 'Посещаемость', value: `${s.avg_attendance ?? 0}%`, sub: 'Средняя', growth: null },
    { label: 'Активных групп', value: s.active_groups, sub: 'Действующие', growth: null },
    { label: 'LTV', value: fmtMoney(s.ltv), sub: 'На одного студента', growth: null },
  ];

  const revMonthly = data?.revenue_monthly || [];
  const revDaily = data?.revenue_daily || [];
  const studentGrowth = data?.student_growth || [];
  const topCourses = data?.top_courses || [];
  const attByGroup = data?.attendance_by_group || [];
  const convBySource = data?.conversion_by_source || [];
  const teacherRatings = data?.teacher_ratings || [];
  const monthComp = data?.month_comparison || {};

  const isDark = theme === 'dark';
  const chartText = isDark ? '#94a3b8' : '#64748b';
  const chartGrid = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)';

  /* ── Detail table ── */
  const detailRows = [];
  const enriched = (data?.enriched_table || topCourses).map(c => ({
    ...c,
    type: 'course',
  }));
  attByGroup.forEach(g => {
    detailRows.push({
      id: `group_${g.id}`,
      name: g.name,
      type: 'group',
      category: g.course_name,
      value1: `${g.rate}%`,
      value2: `${g.attended}/${g.total}`,
      value3: '',
    });
  });
  teacherRatings.forEach(t => {
    detailRows.push({
      id: `teacher_${t.id}`,
      name: t.name,
      type: 'teacher',
      category: `${t.groups} гр.`,
      value1: `${t.students} студ.`,
      value2: `${t.lessons} ур.`,
      value3: t.rating > 0 ? `${t.rating} ★` : '—',
    });
  });
  const filteredRows = detailRows.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const maxCourseStudents = Math.max(...topCourses.map(c => c.students), 1);
  const maxConv = Math.max(...convBySource.map(c => c.total), 1);

  return (
    <div className="page-content">
      {/* ═══ Top Bar ═══ */}
      <div className="rp-topbar">
        <div className="rp-topbar-left">
          <h1 className="rp-title">Отчёты</h1>
          <div className="rp-period-selector">
            <button className="rp-period-btn" onClick={() => setShowPeriodMenu(p => !p)}>
              {period === 'month' ? 'Этот месяц' : period === 'quarter' ? 'Этот квартал' : 'Этот год'}
              <IconChevronDown />
            </button>
            {showPeriodMenu && (
              <div className="rp-period-menu">
                {['month', 'quarter', 'year'].map(p => (
                  <button key={p} className={`rp-period-opt ${period === p ? 'rp-period-opt--sel' : ''}`}
                    onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}>
                    {p === 'month' ? 'Этот месяц' : p === 'quarter' ? 'Этот квартал' : 'Этот год'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="rp-period-divider">|</span>
          <button className="rp-btn rp-btn--ghost" onClick={() => nav('/admin/payments')}>Выбрать период <IconCalendar /></button>
        </div>
        <div className="rp-topbar-right">
          <button className="rp-btn rp-btn--outline"><IconDownload /> Excel</button>
          <button className="rp-btn rp-btn--outline"><IconDownload /> PDF</button>
          <button className="rp-btn rp-btn--primary" onClick={load}><IconRefresh /> Обновить</button>
        </div>
      </div>

      {/* ═══ KPI Grid ═══ */}
      <div className="rp-kpi-grid">
        {kpis.map((kpi, i) => {
          const Icon = KPI_ICONS[i];
          return (
            <div key={kpi.label} className="rp-kpi-card" style={{ '--accent': KPI_COLORS[i] }}>
              <div className="rp-kpi-icon" style={{ background: KPI_BGS[i], color: KPI_COLORS[i] }}><Icon /></div>
              <div className="rp-kpi-body">
                <div className="rp-kpi-value">{kpi.value}</div>
                <div className="rp-kpi-label">{kpi.label}</div>
                <div className="rp-kpi-sub">{kpi.sub}</div>
              </div>
              {kpi.growth !== null && (
                <div className={`rp-kpi-growth ${kpi.growth >= 0 ? 'rp-kpi-growth--up' : 'rp-kpi-growth--down'}`}>
                  {kpi.growth >= 0 ? <IconTrendUp /> : <IconTrendDown />}
                  {Math.abs(kpi.growth)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ Two Big Charts ═══ */}
      <div className="rp-chart-grid">
        {/* Revenue Chart */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3><IconRevenue /> Доход</h3>
            <div className="rp-card-tabs">
              <button className={`rp-card-tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>По дням</button>
              <button className={`rp-card-tab ${period === 'quarter' ? 'active' : ''}`} onClick={() => setPeriod('quarter')}>По месяцам</button>
            </div>
          </div>
          <div className="rp-card-body">
            {revDaily.length === 0 ? (
              <div className="rp-empty">Нет данных о доходах</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revDaily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => {
                    const d = new Date(v + 'T00:00:00');
                    return `${d.getDate()}.${d.getMonth() + 1}`;
                  }} tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" name="Доход" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Student Growth Chart */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3><IconStudents /> Студенты</h3>
            <div className="rp-card-tabs">
              <button className="rp-card-tab active">Новые</button>
              <button className="rp-card-tab">Всего</button>
            </div>
          </div>
          <div className="rp-card-body">
            {studentGrowth.length === 0 ? (
              <div className="rp-empty">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={studentGrowth.filter((_, i) => i % 2 === 0)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => {
                    const d = new Date(v + 'T00:00:00');
                    return `${d.getDate()}.${d.getMonth() + 1}`;
                  }} tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Bar dataKey="new" radius={[4, 4, 0, 0]} fill="#10b981" name="Новые" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Two-column: Top Courses + Attendance ═══ */}
      <div className="rp-grid-2col">
        {/* Top Courses */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3>🏆 Топ курсов</h3>
            <span className="rp-badge-count">{topCourses.length}</span>
          </div>
          <div className="rp-card-body rp-card-body--bars">
            {topCourses.length === 0 ? (
              <div className="rp-empty">Нет данных</div>
            ) : (
              topCourses.slice(0, 8).map((c, i) => {
                const pct = (c.students / maxCourseStudents) * 100;
                return (
                  <div key={c.id} className="rp-hbar-row">
                    <div className="rp-hbar-label">
                      <span className="rp-hbar-rank">{i + 1}</span>
                      <span>{c.title}</span>
                    </div>
                    <div className="rp-hbar-track">
                      <div className="rp-hbar-fill" style={{ width: `${pct}%`, background: KPI_COLORS[i % KPI_COLORS.length] }}>
                        <div className="rp-hbar-glow" />
                      </div>
                    </div>
                    <div className="rp-hbar-meta">
                      <span className="rp-hbar-count">{c.students}</span>
                      <span className="rp-hbar-rev">{fmtMoney(c.revenue)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance by Group */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3>📊 Посещаемость по группам</h3>
            <span className="rp-badge-count">{attByGroup.length}</span>
          </div>
          <div className="rp-card-body rp-card-body--table">
            {attByGroup.length === 0 ? (
              <div className="rp-empty">Нет данных</div>
            ) : (
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Группа</th>
                    <th>Курс</th>
                    <th>Посещаемость</th>
                    <th>Процент</th>
                  </tr>
                </thead>
                <tbody>
                  {attByGroup.slice(0, 10).map(g => (
                    <tr key={g.id}>
                      <td className="rp-td-name">{g.name}</td>
                      <td className="rp-td-muted">{g.course_name}</td>
                      <td><span className="rp-att-num">{g.attended}/{g.total}</span></td>
                      <td>
                        <div className="rp-att-bar-wrap">
                          <div className="rp-att-bar" style={{ width: `${Math.min(100, g.rate)}%` }} />
                          <span className={`rp-att-pct ${g.rate >= 80 ? 'green' : g.rate >= 60 ? 'yellow' : 'red'}`}>{g.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Two-column: Conversion + Teachers ═══ */}
      <div className="rp-grid-2col">
        {/* Conversion by Source */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3>🔀 Конверсия по источникам</h3>
          </div>
          <div className="rp-card-body rp-card-body--bars">
            {convBySource.length === 0 ? (
              <div className="rp-empty">Нет данных</div>
            ) : (
              convBySource.map((src, i) => {
                const pct = (src.total / maxConv) * 100;
                const convPct = src.rate;
                return (
                  <div key={src.source} className="rp-conv-row">
                    <div className="rp-conv-header">
                      <span className="rp-conv-source" style={{ color: SOURCE_COLORS[i % SOURCE_COLORS.length] }}>
                        {SOURCE_LABELS[src.source] || src.source}
                      </span>
                      <span className="rp-conv-total">{src.total} заявок</span>
                    </div>
                    <div className="rp-conv-track">
                      <div className="rp-conv-bar-conv" style={{ width: `${convPct}%` }} />
                      <div className="rp-conv-bar-total" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="rp-conv-footer">
                      <span className="rp-conv-rate">{src.converted} зачислено</span>
                      <span className="rp-conv-pct">{convPct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Teacher Effectiveness */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3>👨‍🏫 Эффективность преподавателей</h3>
            <span className="rp-badge-count">{teacherRatings.length}</span>
          </div>
          <div className="rp-card-body rp-card-body--table">
            {teacherRatings.length === 0 ? (
              <div className="rp-empty">Нет данных</div>
            ) : (
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Преподаватель</th>
                    <th>Групп</th>
                    <th>Студентов</th>
                    <th>Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRatings.slice(0, 8).map(t => (
                    <tr key={t.id}>
                      <td className="rp-td-name">{t.name}</td>
                      <td className="rp-td-num">{t.groups}</td>
                      <td className="rp-td-num">{t.students}</td>
                      <td>
                        <span className={`rp-rating ${t.rating >= 4 ? 'high' : t.rating >= 3 ? 'mid' : 'low'}`}>
                          {t.rating > 0 ? `${t.rating} ★` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Month Comparison ═══ */}
      <div className="rp-compare-grid">
        {['this_month', 'last_month'].map(key => {
          const m = monthComp[key] || {};
          const isThis = key === 'this_month';
          return (
            <div key={key} className={`rp-compare-card ${isThis ? 'rp-compare-card--current' : ''}`}>
              <div className="rp-compare-header">
                <span className="rp-compare-badge">{isThis ? 'Текущий месяц' : 'Прошлый месяц'}</span>
              </div>
              <div className="rp-compare-stats">
                <div className="rp-compare-stat">
                  <span className="rp-compare-stat-label">Доход</span>
                  <span className="rp-compare-stat-value">{fmtMoney(m.revenue)}</span>
                </div>
                <div className="rp-compare-stat">
                  <span className="rp-compare-stat-label">Новые студенты</span>
                  <span className="rp-compare-stat-value">{m.new_students ?? 0}</span>
                </div>
                <div className="rp-compare-stat">
                  <span className="rp-compare-stat-label">Новые заявки</span>
                  <span className="rp-compare-stat-value">{m.new_leads ?? 0}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="rp-compare-diff">
          <div className="rp-compare-diff-icon"><IconArrowRight /></div>
          {s.revenue_growth != null && (
            <div className="rp-compare-diff-info">
              <span className="rp-compare-diff-label">Изменение дохода</span>
              <span className={`rp-compare-diff-value ${s.revenue_growth >= 0 ? 'green' : 'red'}`}>
                {s.revenue_growth >= 0 ? '+' : ''}{s.revenue_growth}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Detail Table ═══ */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3><IconSort /> Детальная таблица</h3>
          <div className="rp-card-header-right">
            <input className="rp-search-input" type="text" placeholder="Поиск..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="rp-card-tabs">
              <button className={`rp-card-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Все данные</button>
              <button className={`rp-card-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>Группы</button>
              <button className={`rp-card-tab ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>Преподаватели</button>
            </div>
          </div>
        </div>
        <div className="rp-card-body">
          {sortedRows.length === 0 ? (
            <div className="rp-empty">Ничего не найдено</div>
          ) : (
            <table className="rp-table rp-table--full">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')} className="rp-th-sort">
                    Название {sortKey === 'name' && <span className="rp-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th onClick={() => toggleSort('category')} className="rp-th-sort">
                    Категория {sortKey === 'category' && <span className="rp-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>Показатель 1</th>
                  <th>Показатель 2</th>
                  <th>Показатель 3</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.filter(r => {
                  if (activeTab === 'groups') return r.type === 'group';
                  if (activeTab === 'teachers') return r.type === 'teacher';
                  return true;
                }).map(r => (
                  <tr key={r.id}>
                    <td className="rp-td-name">{r.name}</td>
                    <td className="rp-td-muted">{r.category}</td>
                    <td>{r.value1}</td>
                    <td>{r.value2}</td>
                    <td>{r.value3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* Inline calendar icon */
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
