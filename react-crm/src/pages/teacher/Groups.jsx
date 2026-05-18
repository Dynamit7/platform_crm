import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ── Icons ── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const GroupIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CourseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const StudentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);

/* ── Helpers ── */
const groupColors = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2'];
const groupColor = (id) => groupColors[(id || 0) % groupColors.length];

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  if (diff < 7) return `${diff} дн. назад`;
  return d.toLocaleDateString();
};

/* ── StatusBadge ── */
const StatusBadge = ({ active }) => (
  <span className={`tg-badge ${active ? 'tg-badge--green' : 'tg-badge--gray'}`}>
    <span className="tg-badge-dot" />
    {active ? 'Активна' : 'Неактивна'}
  </span>
);

/* ── Main ── */
export default function TeacherGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/teacher/groups/${user.id}`).then(({ data }) => setGroups(data)).catch(() => {});
    }
  }, [user?.id]);

  const allCourses = useMemo(() => {
    const map = {};
    groups.forEach(g => { if (g.course?.title) map[g.course.title] = true; });
    return Object.keys(map);
  }, [groups]);

  const filtered = useMemo(() => {
    let result = groups;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q) || (g.course?.title || '').toLowerCase().includes(q));
    }
    if (courseFilter) result = result.filter(g => g.course?.title === courseFilter);
    if (statusFilter === 'active') result = result.filter(g => g.is_active);
    if (statusFilter === 'inactive') result = result.filter(g => !g.is_active);
    return result;
  }, [groups, search, courseFilter, statusFilter]);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Мои группы</h1>
          <p>{filtered.length} групп{filtered.length !== 1 ? 'ы' : 'а'}{search ? ' · найдено' : ''}</p>
        </div>
        <div className="page-header-right">
          <div className="tg-view-toggle">
            <button className={`tg-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Таблица"><ListIcon /></button>
            <button className={`tg-view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Карточки"><GridIcon /></button>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="tg-topbar">
        <div className="tg-search">
          <SearchIcon />
          <input type="text" placeholder="Поиск групп..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="tg-filter-select">
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="">Все курсы</option>
            {allCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown />
        </div>

        <div className="tg-filter-select">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
          <ChevronDown />
        </div>

        <button className="tg-btn tg-btn--primary">
          <PlusIcon /> Создать группу
        </button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="tg-empty">
          <div className="tg-empty-icon">📚</div>
          <div className="tg-empty-title">{search ? 'Ничего не найдено' : 'У вас пока нет групп'}</div>
          <div className="tg-empty-desc">{search ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую группу, чтобы начать обучение'}</div>
          {!search && <button className="tg-btn tg-btn--primary" style={{ marginTop: 16 }}><PlusIcon /> Создать группу</button>}
        </div>
      ) : viewMode === 'table' ? (
        <div className="tg-table-wrap">
          <table className="tg-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Название</th>
                <th>Курс</th>
                <th>Студентов</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => {
                const pct = g.max_students ? Math.min(Math.round(((g.current_students || 0) / g.max_students) * 100), 100) : 0;
                return (
                  <tr key={g.id}>
                    <td>
                      <div className="tg-group-icon" style={{ background: groupColor(g.id) }}>
                        <GroupIcon />
                      </div>
                    </td>
                    <td><div className="tg-name">{g.name}</div></td>
                    <td>
                      <div className="tg-course-cell">
                        <CourseIcon />
                        <span>{g.course?.title || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="tg-students-cell">
                        <div className="tg-students-bar">
                          <div className="tg-students-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="tg-students-count">{g.current_students ?? 0}/{g.max_students ?? '?'}</span>
                      </div>
                    </td>
                    <td><StatusBadge active={g.is_active} /></td>
                    <td><div className="tg-muted">{timeAgo(g.created_at)}</div></td>
                    <td>
                      <div className="tg-actions">
                        <button className="tg-action-btn" title="Просмотреть"><EyeIcon /></button>
                        <button className="tg-action-btn" title="Редактировать"><EditIcon /></button>
                        <button className="tg-action-btn tg-action-btn--danger" title="Удалить"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Card View ── */
        <div className="tg-cards">
          {filtered.map(g => {
            const pct = g.max_students ? Math.min(Math.round(((g.current_students || 0) / g.max_students) * 100), 100) : 0;
            return (
              <div key={g.id} className="tg-card">
                <div className="tg-card-header">
                  <div className="tg-card-icon" style={{ background: groupColor(g.id) }}>
                    <GroupIcon />
                  </div>
                  <div>
                    <div className="tg-card-title">{g.name}</div>
                    <div className="tg-card-course">
                      <CourseIcon />
                      <span>{g.course?.title || '—'}</span>
                    </div>
                  </div>
                  <StatusBadge active={g.is_active} />
                </div>
                <div className="tg-card-body">
                  <div className="tg-card-stat">
                    <StudentIcon />
                    <span>{g.current_students ?? 0} / {g.max_students ?? '?'}</span>
                  </div>
                  <div className="tg-students-bar" style={{ marginTop: 8 }}>
                    <div className="tg-students-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="tg-card-footer">
                  <div className="tg-muted">Обновлено: {timeAgo(g.created_at)}</div>
                  <div className="tg-actions">
                    <button className="tg-action-btn" title="Просмотреть"><EyeIcon /></button>
                    <button className="tg-action-btn" title="Редактировать"><EditIcon /></button>
                    <button className="tg-action-btn tg-action-btn--danger" title="Удалить"><TrashIcon /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
