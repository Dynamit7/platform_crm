import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>,
};

const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

const greetByHour = (h) => h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';

const TimeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const leadStatusTag = (status) => {
  const m = { new: { cls: 'ed-tag--iris', label: 'Новый' }, contacted: { cls: 'ed-tag--amber', label: 'Связан' }, enrolled: { cls: 'ed-tag--lime', label: 'Зачислен' }, lost: { cls: 'ed-tag--coral', label: 'Потерян' } };
  return m[status] || { cls: 'ed-tag--mute', label: status };
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="ed-page">
        <div className="ed-loading">
          <div className="ed-spinner" />
          <div className="ed-loading-text">Собираем дайджест дня…</div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = `${today.getDate()} ${MONTHS_FULL[today.getMonth()]} ${today.getFullYear()}`;
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const greet = greetByHour(today.getHours());
  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const clockStr = time.toTimeString().slice(0, 5);

  const totalStudents = stats?.total_students ?? 0;
  const totalTeachers = stats?.total_teachers ?? 0;
  const totalGroups = stats?.total_groups ?? 0;
  const monthlyRev = stats?.monthly_revenue ?? 0;
  const conversion = stats?.lead_conversion_rate ?? 0;
  const attendance = stats?.attendance_rate ?? 0;
  const retention = stats?.retention_rate ?? 0;
  const pendingHw = stats?.pending_homeworks ?? 0;
  const onlineNow = stats?.online_now ?? 0;
  const dailyRev = stats?.daily_revenue || [];
  const maxRev = Math.max(...dailyRev.map(d => d.total || 0), 1);
  const total30 = dailyRev.reduce((s, d) => s + (d.total || 0), 0);
  const recentLeads = stats?.recent_leads || [];
  const todaySchedule = stats?.today_schedule || [];
  const activeGroups = stats?.active_groups || [];
  const activity = stats?.activity || [];

  const tickerItems = [
    `${totalStudents} students`,
    `${totalTeachers} teachers`,
    `${totalGroups} active groups`,
    `${Number(monthlyRev).toLocaleString('ru-RU')} сум / month`,
    `${conversion}% conversion`,
    `${onlineNow} online now`,
    'TilUser',
    'Run the show',
  ];

  return (
    <div className="ed-page">
      {/* MASTHEAD */}
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>ADMIN JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
          <span className="ed-masthead-sep" />
          <span>VOL. {today.getFullYear() - 2024}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r">
          <span><span className="ed-live-dot" style={{ display: 'inline-block', marginRight: 8 }} /> LIVE · {clockStr}</span>
          <span className="ed-masthead-sep" />
          <span>{dayName.slice(0,3).toUpperCase()}</span>
        </div>
      </div>

      {/* HERO */}
      <div className="ed-hero">
        <div className="ed-hero-left">
          <div>
            <div className="ed-day">{dayName},</div>
            <h1 className="ed-greet">{greet},<br /><em>{firstName}</em>.</h1>
          </div>
          <div className="ed-hero-byline">
            Сегодня <span>{totalStudents} студентов</span> · {totalTeachers} преподавателей · {totalGroups} активных групп
          </div>
        </div>
        <div className="ed-next">
          <div>
            <div className="ed-next-tag">Доход в месяц</div>
            <div className="ed-next-time" style={{ fontSize: 56 }}>{Number(monthlyRev).toLocaleString('ru-RU')}</div>
            <div className="ed-next-title">сум · {dailyRev.length} дней</div>
            <div className="ed-next-meta">{onlineNow} online · {pendingHw} HW pending</div>
          </div>
          <div className="ed-next-actions">
            <Link to="/admin/profit-loss" className="ed-next-cta">Финансы {ico.arrow}</Link>
            <Link to="/admin/reports" className="ed-next-ghost">Отчёты</Link>
          </div>
        </div>
      </div>

      {/* TICKER */}
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

      {/* 01 — KPI BENTO */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">01 ——</span>
            <span className="ed-sec-title">Метрики <em>школы</em></span>
          </div>
        </div>

        <div className="ed-bento">
          <div className="ed-tile ed-tile--lg ed-tile--ink">
            <div>
              <div className="ed-tile-label">Студентов всего</div>
              <div className="ed-tile-num"><em>{totalStudents}</em></div>
              <div className="ed-tile-caption">в {totalGroups} активных группах</div>
            </div>
            <div className="ed-tile-foot">
              <span>под управлением школы</span>
              <Link to="/admin/students" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Все {ico.arrow}</Link>
            </div>
          </div>

          <div className="ed-tile ed-tile--md ed-tile--lime">
            <div>
              <div className="ed-tile-label">Преподавателей</div>
              <div className="ed-tile-num">{totalTeachers}</div>
              <div className="ed-tile-caption">в штате</div>
            </div>
            <div className="ed-tile-foot">
              <span>команда</span>
              <Link to="/admin/teachers" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Все {ico.arrow}</Link>
            </div>
          </div>

          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Конверсия</div>
              <div className="ed-tile-num-sm">{conversion}<em style={{ fontSize: '0.45em', color: 'var(--ed-text-mute)', fontStyle: 'italic' }}>%</em></div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>заявок</div>
            </div>
          </div>

          <div className="ed-tile ed-tile--sm">
            <div>
              <div className="ed-tile-label">Посещаемость</div>
              <div className="ed-tile-num-sm">{attendance}<em style={{ fontSize: '0.45em', color: 'var(--ed-text-mute)', fontStyle: 'italic' }}>%</em></div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>средняя</div>
            </div>
          </div>

          <div className="ed-tile ed-tile--md">
            <div>
              <div className="ed-tile-label">Retention</div>
              <div className="ed-tile-num">{retention}<em style={{ fontSize: '0.45em', color: 'var(--ed-text-mute)' }}>%</em></div>
              <div className="ed-tile-caption">удержание студентов</div>
            </div>
          </div>

          <div className={`ed-tile ed-tile--sm ${pendingHw > 0 ? 'ed-tile--coral' : ''}`}>
            <div>
              <div className="ed-tile-label">ДЗ на проверке</div>
              <div className="ed-tile-num-sm">{pendingHw}</div>
              <div className="ed-tile-caption" style={{ fontSize: 14 }}>работ</div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — QUICK ACTIONS */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">02 ——</span>
            <span className="ed-sec-title">Быстрые <em>действия</em></span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="ed-live-dot" /> {onlineNow} online
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { to: '/admin/leads', label: 'Новая заявка', sub: 'Заведение лида' },
            { to: '/admin/groups', label: 'Создать группу', sub: 'Новый учебный коллектив' },
            { to: '/admin/teachers', label: 'Преподаватель', sub: 'Добавить нового' },
            { to: '/admin/courses', label: 'Создать курс', sub: 'Программа обучения' },
          ].map((a, i) => (
            <Link key={i} to={a.to} style={{
              background: 'var(--ed-surface)', border: '1px solid var(--ed-border)',
              borderRadius: 18, padding: '20px 22px',
              textDecoration: 'none', color: 'var(--ed-text)',
              transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--ed-ink)'; e.currentTarget.style.color = 'var(--ed-paper)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--ed-surface)'; e.currentTarget.style.color = 'var(--ed-text)'; }}>
              <div style={{ width: 36, height: 36, borderRadius: 100, border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ico.plus}
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{a.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 03 — REVENUE CHART */}
      <section className="ed-section">
        <div className="ed-sec-head">
          <div>
            <span className="ed-sec-num">03 ——</span>
            <span className="ed-sec-title">Доход за <em>30 дней</em></span>
          </div>
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500, fontSize: 22, color: 'var(--ed-iris)' }}>
            {total30.toLocaleString('ru-RU')} сум
          </span>
        </div>
        {dailyRev.length === 0 ? (
          <div className="ed-empty">
            <div className="ed-empty-eyebrow">— No transactions —</div>
            <div className="ed-empty-title">Тишина<br />в кассе</div>
            <div className="ed-empty-desc">За последние 30 дней оплат не было</div>
          </div>
        ) : (
          <div style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, padding: '24px 26px' }}>
            <div className="ed-heatmap" style={{ height: 200, gap: 4 }}>
              {dailyRev.map((d, i) => {
                const pct = maxRev > 0 ? (d.total / maxRev) * 100 : 0;
                const date = new Date(d.date);
                const isToday = i === dailyRev.length - 1;
                return (
                  <div key={i} className="ed-heatmap-bar" style={{ minWidth: 12 }}>
                    <div className="ed-heatmap-col" style={{
                      height: `${Math.max(pct * 1.6, 6)}px`,
                      background: isToday ? 'var(--ed-iris)' : 'var(--ed-ink)',
                    }} title={`${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}: ${d.total.toLocaleString('ru-RU')} сум`} />
                    {(i % 5 === 0 || isToday) && (
                      <span className="ed-heatmap-label" style={{ fontSize: 9 }}>{date.getDate()}/{date.getMonth() + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 04 — SCHEDULE + GROUPS */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          <div className="ed-tile ed-tile--w7" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">04 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Сегодня</em> в работе</span>
              </div>
              <Link to="/admin/groups" className="ed-sec-link">все группы {ico.arrow}</Link>
            </div>
            {todaySchedule.length > 0 ? (
              <div className="ed-list">
                {todaySchedule.slice(0, 5).map((l, i) => (
                  <div key={l.id || i} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
                    <span className="ed-row-num">{l.time}</span>
                    <div className="ed-row-main">
                      <div className="ed-row-title">{l.topic || l.group_name}</div>
                      <div className="ed-row-sub">{l.group_name} · {l.teacher_name || '—'} · {l.students || 0} студ.</div>
                    </div>
                    {l.is_completed ? (
                      <span className="ed-tag ed-tag--lime">✓ Проведён</span>
                    ) : (
                      <span className="ed-tag ed-tag--iris">Запланирован</span>
                    )}
                    <button onClick={() => nav(`/admin/groups?group=${l.group_id}`)}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--ed-border)', background: 'var(--ed-surface)', color: 'var(--ed-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ico.arrow}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 20 }}>
                Сегодня тихо — школа отдыхает.
              </div>
            )}
          </div>

          <div className="ed-tile ed-tile--w5" style={{ padding: '24px 26px', gridColumn: 'span 5' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">05 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}>Активные <em>группы</em></span>
              </div>
              <Link to="/admin/groups" className="ed-sec-link">все {ico.arrow}</Link>
            </div>
            {activeGroups.length > 0 ? (
              <div className="ed-list">
                {activeGroups.slice(0, 5).map((g, i) => {
                  const pct = Math.min(100, (g.students / (g.max_students || 1)) * 100);
                  return (
                    <div key={g.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto', cursor: 'pointer' }} onClick={() => nav(`/admin/groups?group=${g.id}`)}>
                      <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="ed-row-main">
                        <div className="ed-row-title" style={{ fontSize: 16 }}>{g.name}</div>
                        <div className="ed-row-sub">{g.course_name} · {g.teacher_name}</div>
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

      {/* 06 — LEADS + ACTIVITY */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          <div className="ed-tile ed-tile--w6" style={{ padding: '24px 26px' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">06 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}>Новые <em>заявки</em></span>
              </div>
              <Link to="/admin/leads" className="ed-sec-link">все {ico.arrow}</Link>
            </div>
            {recentLeads.length > 0 ? (
              <div className="ed-list">
                {recentLeads.slice(0, 5).map((lead, i) => {
                  const stat = leadStatusTag(lead.status);
                  return (
                    <div key={lead.id} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}>
                      <span className="ed-row-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="ed-row-main">
                        <div className="ed-row-title" style={{ fontSize: 16 }}>{lead.name}</div>
                        <div className="ed-row-sub">{lead.phone} · {lead.course_name || '—'}</div>
                      </div>
                      <span className={`ed-tag ${stat.cls}`}>{stat.label}</span>
                      <button onClick={() => nav(`/admin/leads?convert=${lead.id}`)} title="Принять"
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--ed-border)', background: 'var(--ed-surface)', color: 'var(--ed-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ico.check}
                      </button>
                      <button onClick={() => nav(`/admin/leads?reject=${lead.id}`)} title="Отклонить"
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--ed-border)', background: 'var(--ed-surface)', color: 'var(--ed-coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ico.x}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Заявок пока нет.
              </div>
            )}
          </div>

          <div className="ed-tile ed-tile--w6" style={{ padding: '24px 26px', gridColumn: 'span 6' }}>
            <div className="ed-sec-head" style={{ paddingBottom: 14, marginBottom: 4 }}>
              <div>
                <span className="ed-sec-num">07 ——</span>
                <span className="ed-sec-title" style={{ fontSize: 22 }}><em>Активность</em></span>
              </div>
            </div>
            {activity.length > 0 ? (
              <div className="ed-list">
                {activity.slice(0, 8).map((a, i) => (
                  <div key={i} className="ed-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                    <span className={`ed-tag ${a.type === 'lead' ? 'ed-tag--iris' : a.type === 'homework' ? 'ed-tag--lime' : 'ed-tag--mute'}`} style={{ minWidth: 40, justifyContent: 'center' }}>
                      {a.type === 'lead' ? 'LEAD' : a.type === 'homework' ? 'HW' : 'NEW'}
                    </span>
                    <div className="ed-row-main">
                      <div className="ed-row-title" style={{ fontSize: 15 }}>{a.text}</div>
                    </div>
                    <span className="ed-row-sub">{TimeAgo(a.time)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ed-text-mute)', fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontSize: 18 }}>
                Тишина в эфире.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER STATS */}
      <section className="ed-section" style={{ marginBottom: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Всего заявок', value: stats?.total_leads ?? '—' },
            { label: 'Активных записей', value: stats?.active_enrollments ?? '—' },
            { label: 'Общий доход', value: stats?.total_revenue != null ? `${Number(stats.total_revenue).toLocaleString('ru-RU')} сум` : '—' },
            { label: 'Курсов', value: stats?.total_courses ?? '—' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 22, borderRadius: 18, background: 'var(--ed-surface)', border: '1px solid var(--ed-border)' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 26, letterSpacing: '-0.025em', color: 'var(--ed-text)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Colophon */}
      <div className="ed-masthead" style={{ marginTop: 40, marginBottom: 0, paddingTop: 18, paddingBottom: 0, borderTop: '1px solid var(--ed-border)', borderBottom: 'none' }}>
        <div className="ed-masthead-l"><span>{dateStr}</span></div>
        <div className="ed-masthead-c"><span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>— admin edition —</span></div>
        <div className="ed-masthead-r"><span>{firstName.toUpperCase()} · {totalStudents} STUDENTS</span></div>
      </div>
    </div>
  );
}
