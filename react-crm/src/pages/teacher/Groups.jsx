import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  eye: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

const timeAgo = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export default function TeacherGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      api.get(`/api/teacher/groups/${user.id}`).then(({ data }) => { setGroups(data); setLoading(false); }).catch(() => setLoading(false));
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

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Открываем кабинет…</div>
      </div>
    </div>
  );

  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const totalStudents = groups.reduce((s, g) => s + (g.current_students || 0), 0);
  const totalCapacity = groups.reduce((s, g) => s + (g.max_students || 0), 0);

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 03 / GROUPS</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{groups.length} ACTIVE</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Groups / 03</div>
        <h1 className="ed-page-title">Мои <em>группы</em>.</h1>
        <p className="ed-page-lead">Учебные коллективы под вашим руководством. Каждая группа — своя экосистема знаний.</p>

        <div className="ed-page-bar">
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Групп</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{groups.length}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Студентов</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: 'var(--ed-iris)' }}>{totalStudents}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Заполненность</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0}<em style={{ fontSize: '0.5em', color: 'var(--ed-text-mute)' }}>%</em>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ed-toolbar">
        <div className="ed-search">
          {ico.search}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups" />
        </div>
        {allCourses.length > 0 && (
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            style={{
              padding: '11px 16px', borderRadius: 100, border: '1px solid var(--ed-border)',
              background: 'var(--ed-surface)', color: 'var(--ed-text)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', outline: 'none',
            }}>
            <option value="">All courses</option>
            {allCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="ed-pills">
          {[{ k: 'all', l: 'Все' }, { k: 'active', l: 'Активные' }, { k: 'inactive', l: 'Архив' }].map(s => (
            <button key={s.k} className={`ed-pill ${statusFilter === s.k ? 'ed-pill--active' : ''}`} onClick={() => setStatusFilter(s.k)}>{s.l}</button>
          ))}
        </div>
        <div className="ed-pills">
          <button className={`ed-pill ${view === 'grid' ? 'ed-pill--active' : ''}`} onClick={() => setView('grid')}>Grid</button>
          <button className={`ed-pill ${view === 'list' ? 'ed-pill--active' : ''}`} onClick={() => setView('list')}>List</button>
        </div>
        <button className="ed-btn ed-btn--sm">{ico.plus} Создать</button>
      </div>

      {filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— No matches —</div>
          <div className="ed-empty-title">{search || courseFilter || statusFilter !== 'all' ? 'Ничего\nне найдено' : 'Групп\nещё нет'}</div>
          <div className="ed-empty-desc">{search ? 'Поменяйте фильтры или запрос' : 'Создайте первую группу, чтобы начать обучение'}</div>
        </div>
      ) : view === 'grid' ? (
        <div className="ed-courses">
          {filtered.map((g, i) => {
            const pct = g.max_students ? Math.min(Math.round(((g.current_students || 0) / g.max_students) * 100), 100) : 0;
            return (
              <div key={g.id} className="ed-course">
                <div className={`ed-course-cover ed-cover-g${(i % 5) + 1}`}>
                  <span className="ed-course-tag">Group / {String(i + 1).padStart(2, '0')}</span>
                  <span className="ed-course-emoji">{g.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div className="ed-course-body">
                  <div className="ed-course-title">{g.name}</div>
                  <div className="ed-course-meta">{g.course?.title || 'без курса'}</div>
                  <div className="ed-course-progress">
                    <span className="ed-course-pct">{g.current_students || 0}<span style={{ fontStyle: 'normal', color: 'var(--ed-text-mute)', fontSize: 14 }}>/{g.max_students || '?'}</span></span>
                    <span className="ed-course-xp">{pct}% FULL</span>
                  </div>
                  <div className="ed-course-bar">
                    <div className="ed-course-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ed-border)' }}>
                    <span className={`ed-tag ${g.is_active ? 'ed-tag--lime' : 'ed-tag--mute'}`}>
                      {g.is_active ? '● Активна' : 'Архив'}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ed-text-mute)', textTransform: 'uppercase' }}>
                      {timeAgo(g.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, padding: '8px 24px' }}>
          {filtered.map((g, i) => {
            const pct = g.max_students ? Math.min(Math.round(((g.current_students || 0) / g.max_students) * 100), 100) : 0;
            return (
              <div key={g.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr 200px auto auto auto' }}>
                <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="ed-row-main">
                  <div className="ed-row-title">{g.name}</div>
                  <div className="ed-row-sub">{g.course?.title || 'без курса'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ed-course-bar" style={{ flex: 1 }}>
                    <div className="ed-course-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 15, fontStyle: 'italic', color: 'var(--ed-iris)', minWidth: 56, textAlign: 'right' }}>{pct}%</span>
                </div>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 18 }}>
                  <em>{g.current_students || 0}</em><span style={{ color: 'var(--ed-text-mute)', fontStyle: 'normal', fontSize: 14 }}>/{g.max_students || '?'}</span>
                </span>
                <span className={`ed-tag ${g.is_active ? 'ed-tag--lime' : 'ed-tag--mute'}`}>{g.is_active ? 'Active' : 'Archived'}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>{timeAgo(g.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
