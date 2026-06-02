import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const courseEmoji = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('япон') || t.includes('japan')) return '🌸';
  if (t.includes('англ') || t.includes('ielts') || t.includes('english')) return '🇬🇧';
  if (t.includes('кит') || t.includes('chinese')) return '🐉';
  if (t.includes('коре')) return '🇰🇷';
  if (t.includes('нем')) return '🇩🇪';
  if (t.includes('фран')) return '🇫🇷';
  if (t.includes('испан')) return '🇪🇸';
  if (t.includes('тур')) return '🇹🇷';
  if (t.includes('араб')) return '🕌';
  return '✦';
};

export default function Courses() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/${user.id}`).then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

  const enrollments = data?.enrollments || [];
  const filtered = useMemo(() => {
    if (!search.trim()) return enrollments;
    const q = search.toLowerCase();
    return enrollments.filter(e => (e.course?.title || '').toLowerCase().includes(q));
  }, [enrollments, search]);

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
    : 0;
  const totalXp = enrollments.reduce((s, e) => s + (e.xp || 0), 0);
  const completed = enrollments.filter(e => (e.progress || 0) >= 100).length;

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Открываем библиотеку…</div>
      </div>
    </div>
  );

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 02 / LIBRARY</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r">
          <span>{enrollments.length} ACTIVE</span>
        </div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Library / 02</div>
        <h1 className="ed-page-title">Мои <em>курсы</em>.</h1>
        <p className="ed-page-lead">Личная коллекция языковых программ. Каждый курс — отдельный том в вашей библиотеке знаний.</p>

        {enrollments.length > 0 && (
          <div className="ed-page-bar">
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Курсов</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{enrollments.length}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Средний прогресс</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: 'var(--ed-iris)' }}>{avgProgress}<em style={{ fontSize: '0.5em', color: 'var(--ed-text-mute)' }}>%</em></div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>XP</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{totalXp.toLocaleString('ru-RU')}</div>
              </div>
              {completed > 0 && (
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Завершено</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{completed}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="ed-toolbar">
        <div className="ed-search">
          {ico.search}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses" />
        </div>
        <div className="ed-pills">
          <button className={`ed-pill ${view === 'grid' ? 'ed-pill--active' : ''}`} onClick={() => setView('grid')}>Grid</button>
          <button className={`ed-pill ${view === 'list' ? 'ed-pill--active' : ''}`} onClick={() => setView('list')}>List</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— A blank page —</div>
          <div className="ed-empty-title">{search ? 'Ничего\nне найдено' : 'Полок\nещё нет'}</div>
          <div className="ed-empty-desc">{search ? 'Попробуйте другой запрос' : 'Курсы появятся после записи в группу.'}</div>
        </div>
      ) : view === 'grid' ? (
        <div className="ed-courses">
          {filtered.map((e, i) => (
            <div key={e.id} className="ed-course">
              <div className={`ed-course-cover ed-cover-g${(i % 5) + 1}`}>
                <span className="ed-course-tag">Course / {String(i + 1).padStart(2, '0')}</span>
                <span className="ed-course-emoji">{courseEmoji(e.course?.title)}</span>
              </div>
              <div className="ed-course-body">
                <div className="ed-course-title">{e.course?.title || 'Курс'}</div>
                <div className="ed-course-meta">
                  {e.group_id ? `Группа №${e.group_id}` : 'Индивидуально'} · {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('ru-RU') : '—'}
                </div>
                <div className="ed-course-progress">
                  <span className="ed-course-pct">{e.progress || 0}%</span>
                  <span className="ed-course-xp">+{e.xp || 0} XP</span>
                </div>
                <div className="ed-course-bar">
                  <div className="ed-course-bar-fill" style={{ width: `${e.progress || 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-list" style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 24, padding: '8px 24px' }}>
          {filtered.map((e, i) => (
            <div key={e.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr 200px auto auto' }}>
              <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="ed-row-main">
                <div className="ed-row-title">
                  <span style={{ fontSize: 24, marginRight: 8, verticalAlign: 'middle' }}>{courseEmoji(e.course?.title)}</span>
                  {e.course?.title || '—'}
                </div>
                <div className="ed-row-sub">{e.group_id ? `Группа №${e.group_id}` : 'Индивидуально'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ed-course-bar" style={{ flex: 1 }}>
                  <div className="ed-course-bar-fill" style={{ width: `${e.progress || 0}%` }} />
                </div>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 18, fontStyle: 'italic', color: 'var(--ed-iris)', minWidth: 50, textAlign: 'right' }}>{e.progress || 0}%</span>
              </div>
              <span className="ed-tag ed-tag--iris">+{e.xp || 0} XP</span>
              <span className="ed-row-sub">{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('ru-RU') : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
