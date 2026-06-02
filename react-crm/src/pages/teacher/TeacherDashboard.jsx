import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  arrowUp: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  groups: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  students: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5"/></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  hw: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>,
  video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

const greetByHour = (h) => {
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const TimeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/dashboard/${user.id}`).then(({ data }) => {
      setData(data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="ed-page">
        <div className="ed-loading">
          <div className="ed-spinner" />
          <div className="ed-loading-text">Открываем учительский журнал…</div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS_FULL[today.getMonth()]} ${today.getFullYear()}`;
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const greet = greetByHour(today.getHours());
  const firstName = user?.name?.replace('Teacher ', '').split(' ')[0] || 'Teacher';
  const clockStr = time.toTimeString().slice(0, 5);

  const groupsCount = data?.groups_count ?? 0;
  const studentsCount = data?.t_students ?? 0;
  const todayLessons = data?.today_lessons ?? 0;
  const attendance = data?.attendance_rate ?? 0;
  const pendingHw = data?.t_pending ?? 0;
  const unreadMsg = data?.unread_messages ?? 0;
  const todaySchedule = data?.today_schedule || [];
  const groups = data?.groups || [];
  const activity = data?.activity || [];

  const tickerItems = [
    `${studentsCount} active students`,
    `${groupsCount} groups`,
    `${todayLessons} lessons today`,
    pendingHw > 0 ? `${pendingHw} HW to review` : 'Inbox zero',
    `Attendance ${attendance}%`,
    'Teach with patience',
    'Inspire daily',
    'TilUser',
  ];

  return (
    <div className="ed-page">
      {/* ═══════════════ MASTHEAD ═══════════════ */}
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
          <span className="ed-masthead-sep" />
          <span>VOL. {today.getFullYear() - 2024}</span>
        </div>
        <div className="ed-masthead-c">
          <span className="ed-masthead-logo">TilUser</span>
        </div>
        <div className="ed-masthead-r">
          <span><span className="ed-live-dot" style={{ display: 'inline-block', marginRight: 8 }} /> LIVE · {clockStr}</span>
          <span className="ed-masthead-sep" />
          <span>{dayName.slice(0,3).toUpperCase()}</span>
        </div>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="ed-hero">
        <div className="ed-hero-left">
          <div>
            <div className="ed-day">{dayName},</div>
            <h1 className="ed-greet">
              {greet},<br />
              <em>{firstName}</em>.
            </h1>
          </div>
          <div className="ed-hero-byline">
            {todayLessons > 0
              ? <>Сегодня <span>{todayLessons} {todayLessons === 1 ? 'урок' : todayLessons < 5 ? 'урока' : 'уроков'}</span> · {studentsCount} студентов в работе</>
              : pendingHw > 0
              ? <>На проверке <span>{pendingHw} ДЗ</span> · уделите время сегодня</>
              : <>Тихий день · <span>{groupsCount} групп</span> под вашим руководством</>}
          </div>
        </div>

        <div className="ed-next">
          {todaySchedule[0] && !todaySchedule[0].is_completed ? (
            <>
              <div>
                <div className="ed-next-tag">Следующий урок</div>
                <div className="ed-next-time">{todaySchedule[0].time}</div>
                <div className="ed-next-title">{todaySchedule[0].topic || 'Урок'}</div>
                <div className="ed-next-meta">{todaySchedule[0].group_name} · {todaySchedule[0].students} студентов</div>
              </div>
              <div className="ed-next-actions">
                {todaySchedule[0].zoom_link ? (
                  <a href={todaySchedule[0].zoom_link} target="_blank" rel="noreferrer" className="ed-next-cta">
                    {ico.play} Начать урок {ico.arrow}
                  </a>
                ) : (
                  <Link to={`/teacher/lessons?group=${todaySchedule[0].group_id}`} className="ed-next-cta">
                    Открыть {ico.arrow}
                  </Link>
                )}
                <Link to="/teacher/lessons" className="ed-next-ghost">Все уроки</Link>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="ed-next-tag">Расписание</div>
                <div className="ed-next-empty">
                  {todaySchedule.length === 0
                    ? <>Сегодня уроков<br />нет — самое<br />время для подготовки.</>
                    : <>Все уроки<br />на сегодня<br />проведены ✓</>}
                </div>
              </div>
              <div className="ed-next-actions">
                <Link to="/teacher/lessons" className="ed-next-cta">Расписание {ico.arrow}</Link>
                <Link to="/teacher/groups" className="ed-next-ghost">Группы</Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════ TICKER ═══════════════ */}
      <div className="ed-ticker">
        <div className="ed-ticker-track">
          <span>{tickerItems.map((t, i) => (
            <span key={`a-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>{t}<span className="ed-ticker-dot" /></span>
          ))}</span>
          <span aria-hidden="true">{tickerItems.map((t, i) => (
            <span key={`b-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>{t}<span className="ed-ticker-dot" /></span>
          ))}</span>
        </div>
      </div>

      {/* ═══════════════ 01 — KPI BENTO ═══════════════ */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">01 ——</span>
            <span className="ed-sec-title">Сводка <em>на сегодня</em></span>
          </div>
        </div>

        <div className="ed-bento">
          {/* Students - hero ink */}
          <div className="ed-tile ed-tile--lg ed-tile--ink">
            <div>
              <div className="ed-tile-label">Всего студентов</div>
              <div className="ed-tile-num"><em>{studentsCount}</em></div>
              <div className="ed-tile-caption">
                в {groupsCount} {groupsCount === 1 ? 'активной группе' : 'активных группах'}
              </div>
            </div>
            <div className="ed-tile-foot">
              <span>под вашим руководством</span>
              <Link to="/teacher/students" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Все {ico.arrow}
              </Link>
            </div>
          </div>

          {/* Today lessons */}
          <div className={`ed-tile ed-tile--md ${todayLessons > 0 ? 'ed-tile--lime' : ''}`}>
            <div>
              <div className="ed-tile-label">Уроки сегодня</div>
              <div className="ed-tile-num">{todayLessons || <em>0</em>}</div>
              <div className="ed-tile-caption">
                {todayLessons > 0 ? `${todaySchedule.filter(l => l.is_completed).length} проведено` : 'выходной день'}
              </div>
            </div>
            <div className="ed-tile-foot">
              <span>занятия</span>
              <Link to="/teacher/lessons" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Все {ico.arrow}
              </Link>
            </div>
          </div>

          {/* Pending HW */}
          <div className={`ed-tile ed-tile--sm ${pendingHw > 0 ? 'ed-tile--coral' : ''}`}>
            <div>
              <div className="ed-tile-label">На проверке</div>
              <div className="ed-tile-num-sm">{pendingHw}</div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>
                {pendingHw === 1 ? 'задание' : pendingHw > 1 && pendingHw < 5 ? 'задания' : 'заданий'}
              </div>
            </div>
          </div>

          {/* Groups */}
          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Группы</div>
              <div className="ed-tile-num-sm">{groupsCount}</div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>активных</div>
            </div>
          </div>

          {/* Attendance */}
          <div className="ed-tile ed-tile--md">
            <div>
              <div className="ed-tile-label">Посещаемость</div>
              <div className="ed-tile-num">{attendance}<em style={{ fontSize: '0.45em', color: 'var(--ed-text-mute)' }}>%</em></div>
              <div className="ed-tile-caption">средняя по группам</div>
            </div>
            <div className="ed-tile-foot">
              <span>метрика</span>
              {attendance >= 80 && <span className="ed-tile-trend ed-tile-trend--up">{ico.arrowUp} образцово</span>}
            </div>
          </div>

          {/* Unread messages */}
          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Сообщения</div>
              <div className="ed-tile-num-sm">{unreadMsg}<em style={{ color: 'var(--ed-coral)', fontStyle: 'italic' }}>·</em></div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>новых</div>
            </div>
            <div className="ed-tile-foot">
              <Link to="/chat" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                В чат {ico.arrow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 02 — TODAY SCHEDULE + GROUPS ═══════════════ */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          {/* Today schedule */}
          <div className="ed-tile ed-tile--w7" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">02 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Сегодня</em> в работе</span>
              </div>
              <Link to="/teacher/lessons" className="ed-sec-link">все уроки {ico.arrow}</Link>
            </div>
            {todaySchedule.length > 0 ? (
              <div className="ed-list">
                {todaySchedule.slice(0, 5).map((lesson, i) => (
                  <div key={lesson.id || i} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
                    <span className="ed-row-num">{lesson.time}</span>
                    <div className="ed-row-main">
                      <div className="ed-row-title">{lesson.topic || 'Урок'}</div>
                      <div className="ed-row-sub">{lesson.group_name} · {lesson.students} студентов</div>
                    </div>
                    {lesson.is_completed ? (
                      <span className="ed-tag ed-tag--lime">✓ Проведён</span>
                    ) : lesson.zoom_link ? (
                      <a href={lesson.zoom_link} target="_blank" rel="noreferrer" className="ed-tag ed-tag--solid" style={{ textDecoration: 'none' }}>
                        {ico.video} Zoom
                      </a>
                    ) : (
                      <span className="ed-tag ed-tag--iris">Запланирован</span>
                    )}
                    <button
                      onClick={() => nav(`/teacher/lessons?group=${lesson.group_id}`)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '1px solid var(--ed-border)',
                        background: 'var(--ed-surface)', color: 'var(--ed-text)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--ed-ink)'; e.currentTarget.style.color = 'var(--ed-paper)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--ed-surface)'; e.currentTarget.style.color = 'var(--ed-text)'; }}>
                      {ico.arrow}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 20 }}>
                Сегодня свободно — спланируйте новые уроки.
              </div>
            )}
          </div>

          {/* My groups */}
          <div className="ed-tile ed-tile--w5" style={{ padding: '24px 26px', gridColumn: 'span 5' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">03 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}>Мои <em>группы</em></span>
              </div>
              <Link to="/teacher/groups" className="ed-sec-link">все {ico.arrow}</Link>
            </div>
            {groups.length > 0 ? (
              <div className="ed-list">
                {groups.slice(0, 5).map((g, i) => {
                  const pct = Math.min(100, (g.students / (g.max_students || 1)) * 100);
                  return (
                    <div key={g.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto', cursor: 'pointer' }}
                      onClick={() => nav(`/teacher/groups?group=${g.id}`)}>
                      <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="ed-row-main">
                        <div className="ed-row-title" style={{ fontSize: 16 }}>{g.name}</div>
                        <div className="ed-row-sub">{g.course_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="ed-row-value" style={{ fontSize: 20 }}>
                          <em>{g.students}</em><span style={{ color: 'var(--ed-text-mute)', fontStyle: 'normal', fontSize: 14 }}>/{g.max_students}</span>
                        </div>
                        <div style={{ width: 80, height: 3, background: 'var(--ed-border)', borderRadius: 100, overflow: 'hidden', marginTop: 4, marginLeft: 'auto' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ed-ink)', borderRadius: 100 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Групп пока нет.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ 04 — ACTIVITY ═══════════════ */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">04 ——</span>
            <span className="ed-sec-title">Недавняя <em>активность</em></span>
          </div>
          <Link to="/teacher/homeworks" className="ed-sec-link">все ДЗ {ico.arrow}</Link>
        </div>
        {activity.length > 0 ? (
          <div className="ed-list" style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, padding: '8px 24px' }}>
            {activity.slice(0, 8).map((item, i) => (
              <div key={i} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                <span className={`ed-tag ${item.type === 'homework' ? 'ed-tag--iris' : 'ed-tag--mute'}`} style={{ minWidth: 32, justifyContent: 'center' }}>
                  {item.type === 'homework' ? 'HW' : 'NEW'}
                </span>
                <div className="ed-row-main">
                  <div className="ed-row-title" style={{ fontSize: 16 }}>{item.text}</div>
                </div>
                <span className="ed-row-sub">{TimeAgo(item.time)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ed-empty">
            <div className="ed-empty-eyebrow">— Quiet day —</div>
            <div className="ed-empty-title">Активности<br />пока нет</div>
            <div className="ed-empty-desc">Уведомления о сданных ДЗ и сообщениях появятся здесь</div>
          </div>
        )}
      </section>

      {/* Colophon */}
      <div className="ed-masthead" style={{ marginTop: 40, marginBottom: 0, paddingTop: 18, paddingBottom: 0, borderTop: '1px solid var(--ed-border)', borderBottom: 'none' }}>
        <div className="ed-masthead-l">
          <span>{dateStr}</span>
        </div>
        <div className="ed-masthead-c">
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>— teacher edition —</span>
        </div>
        <div className="ed-masthead-r">
          <span>{firstName.toUpperCase()} · {groupsCount} GROUPS</span>
        </div>
      </div>
    </div>
  );
}
