import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ── Icons (minimal stroke set) ── */
const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  arrowUp: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  arrowDown: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>,
};

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const LEVEL_XP = [0, 100, 300, 600, 1000, 1600];
const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS_ROMANCE = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

const greetByHour = (h) => {
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
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

/* ── Attendance ring ── */
function AttendanceRing({ rate }) {
  const R = 78;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(rate || 0, 100));
  const offset = C - (pct / 100) * C;
  return (
    <div className="ed-ring">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--ed-border)" strokeWidth="6" />
        <circle cx="100" cy="100" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b3df5" />
            <stop offset="100%" stopColor="#b8f04b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ed-ring-center">
        <div className="ed-ring-num">{rate != null ? rate : '—'}<em style={{ fontSize: '0.4em', fontStyle: 'italic', color: 'var(--ed-text-mute)', marginLeft: 2 }}>%</em></div>
        <div className="ed-ring-label">Посещ.</div>
      </div>
    </div>
  );
}

/* ── Attendance bar chart ── */
function AttendanceBars({ trend }) {
  const data = (trend || []).slice(-10);
  const labels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  if (data.length === 0) {
    return (
      <div className="ed-att-bars">
        {labels.map((l, i) => (
          <div key={i} className="ed-att-bar">
            <div className="ed-att-col ed-att-col--off" style={{ height: '18%', opacity: 0.18 }} />
            <div className="ed-att-bar-label">{l}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="ed-att-bars">
      {data.map((t, i) => (
        <div key={i} className="ed-att-bar">
          <div className={`ed-att-col ${t.attended ? 'ed-att-col--on' : 'ed-att-col--off'}`}
            style={{ height: `${t.attended ? 100 : 35}%` }} />
          <div className="ed-att-bar-label">{t.date?.split('.')[0] || labels[i % 7]}</div>
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [time, setTime] = useState(new Date());
  const timerRef = useRef(null);
  const clockRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/${user.id}`).then(({ data }) => {
      setData(data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  // Live clock for masthead
  useEffect(() => {
    clockRef.current = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(clockRef.current);
  }, []);

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
      setCountdown(d > 0 ? `${d}д ${h}ч` : h > 0 ? `${h}ч ${m}м` : `${m} мин`);
    };
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => clearInterval(timerRef.current);
  }, [data?.upcoming_lesson]);

  if (loading) {
    return (
      <div className="ed-page">
        <div className="ed-loading">
          <div className="ed-spinner" />
          <div className="ed-loading-text">Загружаем номер…</div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dayName = DAYS_ROMANCE[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS_FULL[today.getMonth()]} ${today.getFullYear()}`;
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const greet = greetByHour(today.getHours());
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const clockStr = time.toTimeString().slice(0, 5);

  const stats = data?.stats || {};
  const enrollments = data?.enrollments || [];
  const upcoming = data?.upcoming_lesson;
  const homeworks = data?.homeworks || [];
  const schedule = data?.schedule || [];
  const attTrend = data?.attendance_trend || [];
  const attRate = data?.attendance_rate;
  const payments = data?.recent_payments || [];
  const streakDays = data?.streak_days || 0;
  const levelNum = data?.level || stats.level || 1;
  const xpTotal = data?.xp || stats.xp || 0;
  const pendingHW = homeworks.filter(h => h.status === 'pending' && !h.is_overdue).length;
  const overdueHW = homeworks.filter(h => h.is_overdue && !h.is_submitted).length;
  const levelIdx = Math.min(Math.max(levelNum - 1, 0), 5);
  const levelLabel = LEVELS[levelIdx];
  const nextXp = LEVEL_XP[Math.min(levelIdx + 1, 5)];
  const xpToNext = Math.max(nextXp - xpTotal, 0);

  // Marquee ticker items
  const tickerItems = [
    `${xpTotal.toLocaleString('ru-RU')} XP earned`,
    `Level ${levelLabel}`,
    streakDays > 0 ? `${streakDays}-day streak` : 'Begin your streak',
    enrollments.length > 0 ? `${enrollments.length} active courses` : 'Awaiting enrollment',
    attRate != null ? `${attRate}% attendance` : 'New term',
    `Studying since ${user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}`,
    'Stay curious',
    'Practice daily',
  ];

  const upcomingDay = upcoming?.date?.split('.')[0];
  const upcomingMonth = MONTHS_SHORT[(parseInt(upcoming?.date?.split('.')[1]) || 1) - 1];

  return (
    <div className="ed-page">
      {/* ═══════════════ MASTHEAD ═══════════════ */}
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
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
            {overdueHW > 0
              ? <>На сегодня <span>{overdueHW} просрочено</span> · давайте наверстаем</>
              : pendingHW > 0
              ? <>На сегодня <span>{pendingHW} ДЗ</span> · вы в плане</>
              : streakDays > 0
              ? <>Серия <span>{streakDays} дней</span> · продолжайте в том же духе</>
              : <>Уровень <span>{levelLabel}</span> · {xpTotal.toLocaleString('ru-RU')} XP в копилке</>}
          </div>
        </div>

        <div className="ed-next">
          {upcoming ? (
            <>
              <div>
                <div className="ed-next-tag">
                  {countdown ? `Старт через ${countdown}` : 'Следующий урок'}
                </div>
                <div className="ed-next-time">{upcoming.time}</div>
                <div className="ed-next-title">{upcoming.title}</div>
                <div className="ed-next-meta">
                  {upcomingDay} {upcomingMonth} · {upcoming.teacher || 'Преподаватель'}
                </div>
              </div>
              <div className="ed-next-actions">
                {upcoming.zoom_link ? (
                  <a href={upcoming.zoom_link} target="_blank" rel="noreferrer" className="ed-next-cta">
                    {ico.play} Войти в урок {ico.arrow}
                  </a>
                ) : (
                  <Link to="/schedule" className="ed-next-cta">
                    Открыть {ico.arrow}
                  </Link>
                )}
                <Link to="/schedule" className="ed-next-ghost">Расписание</Link>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="ed-next-tag">Расписание</div>
                <div className="ed-next-empty">
                  Сегодня уроков<br />нет — отличная<br />пауза для повторения.
                </div>
              </div>
              <div className="ed-next-actions">
                <Link to="/homeworks" className="ed-next-cta">К заданиям {ico.arrow}</Link>
                <Link to="/courses" className="ed-next-ghost">Курсы</Link>
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

      {/* ═══════════════ 01 — BENTO STATS ═══════════════ */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">01 ——</span>
            <span className="ed-sec-title"><em>Состояние</em> на сегодня</span>
          </div>
        </div>

        <div className="ed-bento">
          {/* Level — big lime tile */}
          <div className="ed-tile ed-tile--lg ed-tile--lime">
            <div>
              <div className="ed-tile-label">Уровень / level</div>
              <div className="ed-tile-num" style={{ fontStyle: 'italic' }}>{levelLabel}</div>
              <div className="ed-tile-caption">
                {xpToNext > 0
                  ? <>Ещё <strong style={{ fontStyle: 'normal', fontWeight: 600 }}>{xpToNext}</strong> XP до уровня {LEVELS[Math.min(levelIdx + 1, 5)]}</>
                  : <>Высший уровень достигнут</>}
              </div>
            </div>
            <div className="ed-tile-foot">
              <span>{xpTotal.toLocaleString('ru-RU')} XP / {nextXp.toLocaleString('ru-RU')} XP</span>
              <div style={{ width: 120, height: 4, background: 'rgba(12,14,21,0.18)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((xpTotal - LEVEL_XP[levelIdx]) / (nextXp - LEVEL_XP[levelIdx]) * 100, 100)}%`, height: '100%', background: 'var(--ed-ink)', borderRadius: 100, transition: 'width 1s' }} />
              </div>
            </div>
          </div>

          {/* Pending HW */}
          <div className={`ed-tile ed-tile--md ${overdueHW > 0 ? 'ed-tile--coral' : ''}`}>
            <div>
              <div className="ed-tile-label">{overdueHW > 0 ? 'Просрочено' : 'Активные ДЗ'}</div>
              <div className="ed-tile-num">{overdueHW > 0 ? overdueHW : pendingHW || <em>0</em>}</div>
              <div className="ed-tile-caption">
                {overdueHW > 0
                  ? 'Срочно сдать'
                  : pendingHW > 0
                  ? `Ещё ${pendingHW} в очереди`
                  : 'Очередь пуста'}
              </div>
            </div>
            <div className="ed-tile-foot">
              <span>домашние задания</span>
              <Link to="/homeworks" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Все {ico.arrow}
              </Link>
            </div>
          </div>

          {/* Streak */}
          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Streak</div>
              <div className="ed-tile-num-sm">{streakDays}<em style={{ fontStyle: 'italic', color: 'var(--ed-coral)' }}>·</em></div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>
                {streakDays === 1 ? 'день' : streakDays >= 2 && streakDays <= 4 ? 'дня' : 'дней'} подряд 🔥
              </div>
            </div>
          </div>

          {/* Active courses */}
          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Курсы</div>
              <div className="ed-tile-num-sm">{enrollments.length}</div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>активных</div>
            </div>
            <div className="ed-tile-foot">
              <Link to="/courses" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Подробно {ico.arrow}
              </Link>
            </div>
          </div>

          {/* Total XP — ink tile */}
          <div className="ed-tile ed-tile--md ed-tile--ink">
            <div>
              <div className="ed-tile-label">XP всего</div>
              <div className="ed-tile-num">{xpTotal > 999 ? `${(xpTotal / 1000).toFixed(1)}k` : xpTotal}</div>
              <div className="ed-tile-caption">очков опыта</div>
            </div>
            <div className="ed-tile-foot">
              <span>с момента старта</span>
              {xpTotal > 0 && <span className="ed-tile-trend ed-tile-trend--up">{ico.arrowUp} +12%</span>}
            </div>
          </div>

          {/* Attendance % small */}
          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Посещ.</div>
              <div className="ed-tile-num-sm">
                {attRate != null ? <>{attRate}<em style={{ fontSize: '0.45em', color: 'var(--ed-text-mute)', fontStyle: 'italic' }}>%</em></> : '—'}
              </div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>средняя</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 02 — COURSES ═══════════════ */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">02 ——</span>
            <span className="ed-sec-title">Ваши <em>курсы</em></span>
          </div>
          <Link to="/courses" className="ed-sec-link">все курсы {ico.arrow}</Link>
        </div>

        {enrollments.length > 0 ? (
          <div className="ed-courses">
            {enrollments.slice(0, 4).map((e, i) => (
              <div key={e.id} className="ed-course">
                <div className={`ed-course-cover ed-cover-g${(i % 5) + 1}`}>
                  <span className="ed-course-tag">Course / {String(i + 1).padStart(2, '0')}</span>
                  <span className="ed-course-emoji">{courseEmoji(e.course?.title)}</span>
                </div>
                <div className="ed-course-body">
                  <div className="ed-course-title">{e.course?.title || 'Курс'}</div>
                  <div className="ed-course-meta">
                    {e.group_id ? `Группа №${e.group_id}` : 'Индивидуально'}
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
          <div className="ed-empty">
            <div className="ed-empty-eyebrow">— A blank page —</div>
            <div className="ed-empty-title">Курсов пока<br />не назначено</div>
            <div className="ed-empty-desc">Свяжитесь с администратором, чтобы записаться на курс и начать обучение</div>
          </div>
        )}
      </section>

      {/* ═══════════════ 03 — SCHEDULE + ATTENDANCE ═══════════════ */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          {/* Week schedule */}
          <div className="ed-tile ed-tile--w8" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 18 }}>
              <div>
                <span className="ed-sec-num">03 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Неделя</em></span>
              </div>
              <Link to="/schedule" className="ed-sec-link">расписание {ico.arrow}</Link>
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
              <div style={{ padding: '20px 0', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Расписание пустует.
              </div>
            )}
          </div>

          {/* Attendance */}
          <div className="ed-tile ed-tile--w4" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 18 }}>
              <div>
                <span className="ed-sec-num">04 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Был там</em></span>
              </div>
            </div>
            <AttendanceRing rate={attRate} />
            <div style={{ marginTop: 14, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)' }}>
              {attRate != null && attRate >= 80 ? 'Образцовая статистика' : attRate != null && attRate >= 50 ? 'Можем лучше' : 'Старт сезона'}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 05 — HOMEWORK + 06 — PAYMENTS ═══════════════ */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          {/* Homework */}
          <div className="ed-tile ed-tile--w7" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">05 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Задания</em></span>
              </div>
              <Link to="/homeworks" className="ed-sec-link">все {ico.arrow}</Link>
            </div>
            {homeworks.length > 0 ? (
              <div className="ed-list">
                {homeworks.slice(0, 4).map((hw, i) => {
                  let tagCls = 'ed-tag--mute', tagLabel = 'Ожидается';
                  if (hw.grade) { tagCls = 'ed-tag--lime'; tagLabel = `${hw.grade}/10`; }
                  else if (hw.is_submitted) { tagCls = 'ed-tag--amber'; tagLabel = 'Проверка'; }
                  else if (hw.is_overdue) { tagCls = 'ed-tag--coral'; tagLabel = 'Просрочено'; }
                  return (
                    <div key={hw.id} className="ed-row">
                      <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="ed-row-main">
                        <div className="ed-row-title">{hw.title}</div>
                        <div className="ed-row-sub">до {hw.due_date}</div>
                      </div>
                      <span className={`ed-tag ${tagCls}`}>{tagLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Очередь свободна — отдыхайте.
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="ed-tile ed-tile--w5" style={{ padding: '24px 26px', gridColumn: 'span 5' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">06 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Платежи</em></span>
              </div>
              <Link to="/settings" className="ed-sec-link">история {ico.arrow}</Link>
            </div>
            {payments.length > 0 ? (
              <div className="ed-list">
                {payments.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                    <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="ed-row-main">
                      <div className="ed-row-title" style={{ fontSize: 16 }}>{p.description || 'Оплата'}</div>
                      <div className="ed-row-sub">{p.date} · {p.method === 'card' ? 'Card' : p.method === 'cash' ? 'Cash' : p.method || 'Online'}</div>
                    </div>
                    <span className="ed-row-value" style={{ fontSize: 18 }}>
                      <em>{Number(p.amount).toLocaleString('ru-RU')}</em>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Платежей не было.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ COLOPHON ═══════════════ */}
      <div className="ed-masthead" style={{ marginTop: 40, marginBottom: 0, paddingTop: 18, paddingBottom: 0, borderTop: '1px solid var(--ed-border)', borderBottom: 'none' }}>
        <div className="ed-masthead-l">
          <span>{dateStr}</span>
        </div>
        <div className="ed-masthead-c">
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>— end of issue —</span>
        </div>
        <div className="ed-masthead-r">
          <span>{firstName.toUpperCase()} · LV. {levelLabel}</span>
        </div>
      </div>
    </div>
  );
}
