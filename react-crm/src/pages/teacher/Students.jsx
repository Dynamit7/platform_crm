import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ── SVG Icons ── */
const SSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
  </svg>
);
const SPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const SSort = ({ active, dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--blue-400)' : 'var(--muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'asc' ? (
      <polyline points="18 15 12 9 6 15"/>
    ) : (
      <polyline points="6 9 12 15 18 9"/>
    )}
  </svg>
);
const SArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const SArrowDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const SStar = ({ filled }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SGradCap = () => (
  <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
    <rect x="10" y="20" width="100" height="80" rx="16" fill="currentColor" opacity="0.04"/>
    <path d="M60 28L20 50L60 72L100 50L60 28Z" fill="url(#g-grad)" opacity="0.12"/>
    <path d="M60 28L20 50L60 72L100 50L60 28Z" stroke="url(#g-grad)" strokeWidth="1.5" opacity="0.3"/>
    <line x1="60" y1="72" x2="60" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.15"/>
    <path d="M45 82L60 90L75 82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
    <circle cx="60" cy="92" r="4" fill="currentColor" opacity="0.08"/>
    <path d="M35 55V68C35 68 45 75 60 75C75 75 85 68 85 68V55" stroke="url(#g-grad)" strokeWidth="1.2" opacity="0.2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="g-grad" x1="20" y1="28" x2="100" y2="72">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
  </svg>
);
const SMore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);
const SRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const SBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const SPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const SClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SUserPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);

/* ── Utils ── */
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const avColors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#4f46e5','#be185d'];
const avColor = (id) => avColors[(id || 0) % avColors.length];
const statusLabel = { active: 'Активен', vacation: 'В отпуске', inactive: 'Неактивен' };
const levelLabel = { 1: 'Начальный', 2: 'Продолжающий', 3: 'Средний', 4: 'Продвинутый', 5: 'Эксперт' };

const formatLastVisit = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds); const n = new Date();
  const diff = Math.floor((n - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  if (diff < 7) return `${diff} дн. назад`;
  return d.toLocaleDateString();
};

const formatRegDate = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

/* ── Components ── */
const StatusBadge = ({ status }) => {
  const colors = { active: 'green', vacation: 'yellow', inactive: 'red' };
  const c = colors[status] || 'muted';
  return (
    <span className={`ts-badge ts-badge--${c}`}>
      <span className="ts-badge-dot" />
      {statusLabel[status] || status}
    </span>
  );
};

const Stars = ({ level }) => (
  <div className="ts-stars">
    {[1,2,3,4,5].map(i => <SStar key={i} filled={i <= level} />)}
  </div>
);

const TH = ({ children, sortKey, sort, onSort, style }) => {
  const active = sort.key === sortKey;
  return (
    <th style={style} className={`ts-th ${active ? 'ts-th--active' : ''}`} onClick={() => onSort(sortKey)}>
      {children}
      <span className="ts-th-arrows">
        <SSort active={active} dir={active ? sort.dir : 'asc'} />
      </span>
    </th>
  );
};

/* ── Main ── */
export default function TeacherStudents() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/teacher/groups/${user.id}`).then(({ data }) => {
        setGroups(data);
        if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0].id);
      }).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/api/groups/${selectedGroup}/students`).then(({ data }) => setStudents(data)).catch(() => setStudents([]));
      setPage(1);
    }
  }, [selectedGroup]);

  const selName = groups.find(g => g.id === selectedGroup)?.name || '';

  const filtered = useMemo(() => {
    let arr = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
      );
    }
    if (sort.key) {
      arr = [...arr].sort((a, b) => {
        const va = (a[sort.key] || '').toString().toLowerCase();
        const vb = (b[sort.key] || '').toString().toLowerCase();
        return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return arr;
  }, [students, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice(0, page * perPage);
  const hasMore = paginated.length < filtered.length;

  const handleSort = (key) => {
    setSort(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div className="page-content">
      {/* ═══ Header ═══ */}
      <div className="ts-hdr">
        <div>
          <h1 className="ts-hdr-title">Мои студенты</h1>
          <p className="ts-hdr-sub">
            {selectedGroup
              ? `${filtered.length} студент${filtered.length !== 1 ? 'ов' : ''} в группе «${selName}»`
              : 'Выберите группу'}
          </p>
        </div>
        <button className="ts-add-btn" onClick={() => {}}>
          <SPlus /> Добавить студента
        </button>
      </div>

      {/* ═══ Toolbar ═══ */}
      <div className="ts-toolbar">
        <div className="ts-search">
          <SSearch />
          <input type="text" placeholder="Поиск по студентам..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ts-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="ts-group-select" onClick={() => setShowDropdown(!showDropdown)}>
          <span>{selName || 'Выберите группу'}</span>
          <SChevron />
          {showDropdown && (
            <div className="ts-dropdown">
              {groups.map(g => (
                <button key={g.id} className={`ts-dropdown-item ${g.id === selectedGroup ? 'ts-dropdown-item--active' : ''}`}
                  onClick={e => { e.stopPropagation(); setSelectedGroup(g.id); setShowDropdown(false); }}>
                  <span className="ts-dropdown-dot" />
                  <span>{g.name}</span>
                  <span className="ts-dropdown-count">{g.current_students || '0'}</span>
                </button>
              ))}
              {groups.length === 0 && <div className="ts-dropdown-empty">Нет групп</div>}
            </div>
          )}
        </div>
        <button className="ts-btn ts-btn--outline" title="Обновить" onClick={() => selectedGroup && api.get(`/api/groups/${selectedGroup}/students`).then(({ data }) => setStudents(data))}>
          <SRefresh />
        </button>
        <button className="ts-btn ts-btn--outline">
          <SFilter /> Фильтр
        </button>
      </div>

      {/* ═══ Content ═══ */}
      {selectedGroup ? (
        <div className="ts-table-wrap">
          <table className="ts-table">
            <thead>
              <tr>
                <th className="ts-th ts-th--avatar" style={{ width: 52 }}></th>
                <TH sortKey="name" sort={sort} onSort={handleSort}>Имя и Фамилия</TH>
                <TH sortKey="group" sort={sort} onSort={handleSort}>Группа</TH>
                <TH sortKey="level" sort={sort} onSort={handleSort}>Уровень</TH>
                <TH sortKey="phone" sort={sort} onSort={handleSort}>Телефон</TH>
                <TH sortKey="email" sort={sort} onSort={handleSort}>Email</TH>
                <TH sortKey="enrolled_at" sort={sort} onSort={handleSort}>Регистрация</TH>
                <TH sortKey="last_visit" sort={sort} onSort={handleSort}>Последний визит</TH>
                <TH sortKey="status" sort={sort} onSort={handleSort} style={{ width: 110 }}>Статус</TH>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="ts-empty">
                      <div className="ts-empty-illustration">
                        <SGradCap />
                      </div>
                      <h3 className="ts-empty-title">{search ? 'Ничего не найдено' : 'Нет студентов'}</h3>
                      <p className="ts-empty-desc">
                        {search ? 'Попробуйте изменить поисковый запрос' : 'В этой группе пока нет студентов'}
                      </p>
                      {!search && (
                        <button className="ts-add-btn ts-add-btn--sm" onClick={() => {}}>
                          <SPlus /> Добавить студента
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(s => {
                  const lvl = s.level || 1;
                  return (
                    <tr key={s.student_id} className="ts-row">
                      <td>
                        <div className="ts-avatar" style={{ background: avColor(s.student_id) }}>
                          {initials(s.name)}
                          <span className={`ts-avatar-status ${s.status === 'active' ? 'ts-avatar-status--on' : 'ts-avatar-status--off'}`} />
                        </div>
                      </td>
                      <td><span className="ts-cell-name">{s.name}</span></td>
                      <td><span className="ts-cell-muted">{selName}</span></td>
                      <td>
                        <div className="ts-cell-level">
                          <span className="ts-level-label">{levelLabel[lvl] || 'Начальный'}</span>
                          <Stars level={lvl} />
                        </div>
                      </td>
                      <td><span className="ts-cell-iconed"><SPhone />{s.phone || '—'}</span></td>
                      <td><span className="ts-cell-iconed ts-cell-muted"><SMail />{s.email}</span></td>
                      <td><span className="ts-cell-iconed"><SCalendar />{formatRegDate(s.enrolled_at)}</span></td>
                      <td><span className="ts-cell-iconed ts-cell-muted"><SClock />{formatLastVisit(s.last_visit)}</span></td>
                      <td><StatusBadge status={s.status || 'active'} /></td>
                      <td><button className="ts-more-btn" title="Действия"><SMore /></button></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ts-empty" style={{ marginTop: 80 }}>
          <div className="ts-empty-illustration">
            <SBook />
          </div>
          <h3 className="ts-empty-title">Выберите группу</h3>
          <p className="ts-empty-desc">Выберите группу из списка, чтобы увидеть студентов</p>
        </div>
      )}

      {/* ═══ Pagination ═══ */}
      {selectedGroup && filtered.length > 0 && (
        <div className="ts-pagination">
          <span className="ts-pagination-info">
            Показано {paginated.length} из {filtered.length}
          </span>
          <div className="ts-pagination-actions">
            {page > 1 && (
              <button className="ts-btn ts-btn--sm" onClick={() => setPage(p => p - 1)}>
                <SArrowUp />
              </button>
            )}
            {hasMore && (
              <button className="ts-btn ts-btn--primary ts-btn--sm" onClick={() => setPage(p => p + 1)}>
                Показать ещё
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
