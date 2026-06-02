import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  chev: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  phone: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><polyline points="22,4 12,13 2,4"/></svg>,
  cal: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const levelLabel = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' };

const formatLastVisit = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds);
  const diff = Math.floor((Date.now() - d) / (86400000));
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  if (diff < 7) return `${diff} дн назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const statusOf = (s) => {
  const m = { active: { tag: 'ed-tag--lime', label: 'Активен' }, vacation: { tag: 'ed-tag--amber', label: 'Отпуск' }, inactive: { tag: 'ed-tag--coral', label: 'Неактивен' } };
  return m[s] || { tag: 'ed-tag--mute', label: s || '—' };
};

export default function TeacherStudents() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/groups/${user.id}`).then(({ data }) => {
      setGroups(data);
      if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/api/groups/${selectedGroup}/students`).then(({ data }) => setStudents(data)).catch(() => setStudents([]));
    }
  }, [selectedGroup]);

  const selName = groups.find(g => g.id === selectedGroup)?.name || '';

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  }, [students, search]);

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Открываем список группы…</div>
      </div>
    </div>
  );

  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const totalStudents = groups.reduce((sum, g) => sum + (g.current_students || 0), 0);

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 02 / STUDENTS</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{totalStudents} TOTAL</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Students / 02</div>
        <h1 className="ed-page-title">Мои <em>студенты</em>.</h1>
        <p className="ed-page-lead">
          {selectedGroup ? <>Группа <em style={{ fontStyle: 'italic', color: 'var(--ed-iris)' }}>«{selName}»</em> — {filtered.length} {filtered.length === 1 ? 'студент' : filtered.length > 1 && filtered.length < 5 ? 'студента' : 'студентов'}</> : 'Выберите группу из списка ниже'}
        </p>

        <div className="ed-page-bar">
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Всего</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{totalStudents}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Групп</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{groups.length}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>В выборке</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: 'var(--ed-iris)' }}>{filtered.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ed-toolbar">
        <div className="ed-search">
          {ico.search}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name / email / phone" />
        </div>
        {/* Group selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 18px', borderRadius: 100,
              background: 'var(--ed-surface)', border: '1px solid var(--ed-border)',
              color: 'var(--ed-text)', fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 200,
            }}>
            <span>{selName || 'Выберите группу'}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--ed-text-mute)' }}>{ico.chev}</span>
          </button>
          {showDropdown && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, minWidth: 280,
              maxHeight: 320, overflowY: 'auto',
              background: '#1a1f2e',
              border: '1.5px solid rgba(255,255,255,0.18)',
              borderRadius: 16, boxShadow: '0 -24px 60px rgba(0,0,0,0.55), 0 -4px 14px rgba(0,0,0,0.35)',
              padding: 6, zIndex: 9999, color: '#fff',
              animation: 'ed-dropdown-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {groups.length === 0 ? (
                <div style={{
                  padding: '24px 18px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: '#fff',
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Нет групп</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Попросите администратора создать группу и назначить вам как преподавателю
                  </div>
                </div>
              ) : (
                groups.map(g => (
                  <button key={g.id}
                    onClick={() => { setSelectedGroup(g.id); setShowDropdown(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '12px 14px', border: 'none', borderRadius: 10,
                      background: g.id === selectedGroup ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: 'var(--text, #fff)', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (g.id !== selectedGroup) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (g.id !== selectedGroup) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{g.name}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: 'rgba(255,255,255,0.08)', color: 'var(--muted, #9ca3af)',
                    }}>{g.current_students || 0}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button className="ed-btn ed-btn--sm">{ico.plus} Добавить</button>
      </div>

      {!selectedGroup ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— No selection —</div>
          <div className="ed-empty-title">Выберите\nгруппу</div>
          <div className="ed-empty-desc">Чтобы увидеть студентов, выберите группу из списка выше</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— Empty roster —</div>
          <div className="ed-empty-title">{search ? 'Ничего\nне найдено' : 'В группе\nпока никого'}</div>
          <div className="ed-empty-desc">{search ? 'Поменяйте поисковый запрос' : 'Добавьте студента, чтобы начать работу с группой'}</div>
        </div>
      ) : (
        <div style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, overflow: 'hidden' }}>
          <table className="ed-teacher-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['', 'Имя', 'Уровень', 'Email', 'Телефон', 'Регистрация', 'Последний визит', 'Статус'].map((h, i) => (
                  <th key={i} style={{
                    padding: '16px 18px', textAlign: i === 0 ? 'center' : 'left',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                    fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'var(--ed-text-mute)', borderBottom: '1px solid var(--ed-border)',
                    background: 'var(--ed-paper-soft)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const stat = statusOf(s.status || 'active');
                const lvl = s.level || 1;
                return (
                  <tr key={s.student_id || i} style={{ borderBottom: '1px solid var(--ed-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ed-paper-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 18px', width: 56 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 14, letterSpacing: '-0.02em',
                        margin: '0 auto',
                      }}>{initials(s.name)}</div>
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 16, letterSpacing: '-0.015em', color: 'var(--ed-text)' }}>{s.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ed-text-mute)', textTransform: 'uppercase', marginTop: 2 }}>#{s.student_id}</div>
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <span className="ed-tag ed-tag--iris">{levelLabel[lvl] || `L${lvl}`}</span>
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: 13, color: 'var(--ed-text-soft)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{ico.mail} {s.email || '—'}</span>
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: 13, color: 'var(--ed-text-soft)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{ico.phone} {s.phone || '—'}</span>
                    </td>
                    <td style={{ padding: '16px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>
                      {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '16px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>
                      {formatLastVisit(s.last_visit)}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <span className={`ed-tag ${stat.tag}`}>{stat.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
