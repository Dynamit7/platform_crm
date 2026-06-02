import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>,
};

const FULL_DAYS = { 'Пн': 'Понедельник', 'Вт': 'Вторник', 'Ср': 'Среда', 'Чт': 'Четверг', 'Пт': 'Пятница', 'Сб': 'Суббота', 'Вс': 'Воскресенье' };
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export default function Schedule() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/${user.id}`).then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!data?.upcoming_lesson?.date) return;
    const parsed = data.upcoming_lesson.date?.split('.').reverse().join('-');
    if (!parsed) return;
    const lessonDate = new Date(parsed + 'T' + (data.upcoming_lesson.time || '00:00'));
    if (isNaN(lessonDate.getTime())) return;
    const tick = () => {
      const diff = lessonDate - Date.now();
      if (diff <= 0) { setCountdown('Идёт сейчас'); clearInterval(timerRef.current); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(d > 0 ? `${d} дн ${h} ч` : h > 0 ? `${h} ч ${m} мин` : `${m} мин`);
    };
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => clearInterval(timerRef.current);
  }, [data?.upcoming_lesson]);

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Сверяемся с часами…</div>
      </div>
    </div>
  );

  const upcoming = data?.upcoming_lesson;
  const schedule = data?.schedule || [];
  const today = new Date();
  const monthLabel = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const lessonsCount = schedule.filter(s => s.has_lesson).length;

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 04 / SCHEDULE</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{monthLabel.toUpperCase()}</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Time / 04</div>
        <h1 className="ed-page-title"><em>Расписание</em>.</h1>
        <p className="ed-page-lead">{monthLabel} · {lessonsCount} учебн{lessonsCount === 1 ? 'ый день' : lessonsCount > 4 || lessonsCount === 0 ? 'ых дней' : 'ых дня'} на этой неделе. Календарь занятий и предстоящие созвоны.</p>
      </div>

      {/* Featured upcoming */}
      {upcoming && (
        <section className="ed-section">
          <div className="ed-hero" style={{ marginBottom: 0 }}>
            <div className="ed-hero-left" style={{ minHeight: 320 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ed-live-dot" style={{ background: '#5b3df5' }} /> Следующее занятие
                </div>
                <h2 className="ed-greet" style={{ fontSize: 'clamp(40px, 7vw, 84px)' }}>
                  <em>{upcoming.title?.split(' ').slice(0, 2).join(' ')}</em>
                  {upcoming.title?.split(' ').slice(2).length > 0 && <><br />{upcoming.title?.split(' ').slice(2).join(' ')}</>}
                </h2>
              </div>
              <div className="ed-hero-byline">
                {upcoming.teacher && <>Преподаватель <span>{upcoming.teacher}</span> · </>}
                {upcoming.date} в {upcoming.time}
                {countdown && <> · через <span>{countdown}</span></>}
              </div>
            </div>
            <div className="ed-next">
              <div>
                <div className="ed-next-tag">{countdown ? `Через ${countdown}` : 'Сегодня'}</div>
                <div className="ed-next-time">{upcoming.time}</div>
                <div className="ed-next-title">{upcoming.date}</div>
                <div className="ed-next-meta">{upcoming.teacher || 'Преподаватель'}</div>
              </div>
              <div className="ed-next-actions">
                {upcoming.zoom_link ? (
                  <a href={upcoming.zoom_link} target="_blank" rel="noreferrer" className="ed-next-cta">{ico.play} Войти {ico.arrow}</a>
                ) : (
                  <div className="ed-next-ghost">Ссылка появится позже</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Week strip */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">{upcoming ? '02 ——' : '01 ——'}</span>
            <span className="ed-sec-title">Эта <em>неделя</em></span>
          </div>
        </div>
        {schedule.length > 0 ? (
          <div className="ed-week">
            {schedule.map((s, i) => (
              <div key={i} className={`ed-week-cell ${s.active ? 'ed-week-cell--active' : ''} ${s.has_lesson ? 'ed-week-cell--has' : ''}`}>
                <div className="ed-week-day">{s.day}</div>
                <div className="ed-week-num">{s.date}</div>
                <div className="ed-week-status">{s.has_lesson ? (s.active ? 'today' : 'lesson') : 'rest'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ed-empty">
            <div className="ed-empty-eyebrow">— Idle —</div>
            <div className="ed-empty-title">Часы<br />тихие</div>
            <div className="ed-empty-desc">Расписание появится после записи на курс</div>
          </div>
        )}
      </section>

      {/* Day list */}
      {schedule.length > 0 && (
        <section className="ed-section">
          <div className="ed-sec-head">
            <div>
              <span className="ed-sec-num">{upcoming ? '03 ——' : '02 ——'}</span>
              <span className="ed-sec-title">По <em>дням</em></span>
            </div>
          </div>
          <div className="ed-sched-list">
            {schedule.map((s, i) => {
              const dayName = FULL_DAYS[s.day] || s.day;
              return (
                <div key={i} className={`ed-sched-row ${s.active ? 'ed-sched-row--active' : ''}`}>
                  <div className="ed-sched-day">{s.date}</div>
                  <div>
                    <div className="ed-sched-info-title">{dayName}</div>
                    <div className="ed-sched-info-sub">
                      {s.active && s.has_lesson ? 'Урок сегодня' : s.active ? 'Сегодня — выходной' : s.has_lesson ? 'Учебный день' : 'Выходной'}
                    </div>
                  </div>
                  {s.active && s.has_lesson ? (
                    <span className="ed-tag ed-tag--solid">Сегодня</span>
                  ) : s.has_lesson ? (
                    <span className="ed-tag ed-tag--iris">Урок</span>
                  ) : (
                    <span className="ed-tag ed-tag--mute">Выходной</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
