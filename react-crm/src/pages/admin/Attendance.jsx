import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const SChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const SChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const SChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const SSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_ROD = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

const s = {
  page: { padding: '28px 32px', maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  hLeft: {},
  hTitle: { fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' },
  hSub: { fontSize: 13, color: 'var(--muted)', marginTop: 2 },
  hRight: { display: 'flex', alignItems: 'center', gap: 10 },
  select: {
    padding: '9px 36px 9px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none',
    appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
    minWidth: 220,
  },
  selectWrap: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
  selectIcon: { position: 'absolute', right: 12, pointerEvents: 'none', display: 'flex', color: 'var(--muted)' },
  monthNav: { display: 'flex', alignItems: 'center', gap: 6 },
  monthBtn: {
    width: 34, height: 34, border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', color: 'var(--text-secondary)',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  monthLabel: { fontSize: 15, fontWeight: 600, color: 'var(--text)', minWidth: 160, textAlign: 'center' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24,
  },
  statCard: {
    background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
    padding: '16px 20px',
  },
  statValue: { fontSize: 24, fontWeight: 700, color: 'var(--text)' },
  statLabel: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  card: {
    background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  calHeader: {
    display: 'grid', gridTemplateColumns: '60px 1fr', borderBottom: '1px solid var(--border)',
    background: 'rgba(0,0,0,0.02)',
  },
  calStudentCol: {
    padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.3px',
  },
  calDaysRow: {
    display: 'grid', gridTemplateColumns: `repeat(${31}, minmax(32px, 1fr))`,
    borderLeft: '1px solid var(--border)',
  },
  calDayHeader: {
    padding: '10px 2px', textAlign: 'center', fontSize: 11,
    color: 'var(--muted)', borderRight: '1px solid var(--border)',
    fontWeight: 600,
  },
  scrollWrap: { overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' },
  studentRow: {
    display: 'grid', gridTemplateColumns: '60px 1fr', borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s',
  },
  stInfo: {
    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
    borderRight: '1px solid var(--border)', position: 'sticky', left: 0,
    background: 'var(--surface)', zIndex: 1,
  },
  stAvatar: (color) => ({
    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 10, flexShrink: 0, background: color,
  }),
  stName: { fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  stPct: { fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' },
  daysGrid: {
    display: 'grid', gridTemplateColumns: `repeat(${31}, minmax(32px, 1fr))`,
  },
  dayCell: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRight: '1px solid var(--border)', cursor: 'pointer',
    transition: 'background 0.1s', minHeight: 40,
  },
  check: (checked) => ({
    width: 18, height: 18, borderRadius: 5,
    background: checked ? '#10b981' : 'transparent',
    border: `2px solid ${checked ? '#10b981' : '#d1d5db'}`,
    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  checkInner: { color: '#fff', fontSize: 11, fontWeight: 700 },
  emptyDay: { color: 'var(--border)', fontSize: 11 },
  footer: {
    padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10,
    borderTop: '1px solid var(--border)',
  },
  saveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px',
    borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: 'var(--accent-gradient)', color: '#fff',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 },
};

const COLORS = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#4f46e5','#be185d'];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

export default function AdminAttendance() {
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => setGroups(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/api/groups/${selectedGroup}/attendance`).then(({ data }) => {
        setData(data);
        const a = {};
        data.students?.forEach(s => {
          if (s.attendance) Object.entries(s.attendance).forEach(([lid, val]) => { a[`${s.student_id}_${lid}`] = val; });
        });
        setAttendance(a);
      }).catch(() => setData(null));
    }
  }, [selectedGroup]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else { setMonth(m => m - 1); } };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else { setMonth(m => m + 1); } };

  // Filter lessons to this month/year
  const filteredLessons = useMemo(() => {
    return (data?.lessons || []).map(l => {
      const d = new Date(l.date);
      return { ...l, d };
    }).filter(l => l.d.getFullYear() === year && l.d.getMonth() === month);
  }, [data?.lessons, year, month]);

  // Build lesson lookup: { studentId_lessonId: boolean }
  const toggle = (studentId, lessonId) => {
    const key = `${studentId}_${lessonId}`;
    setAttendance(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const records = Object.entries(attendance).filter(([key]) => {
        const lid = Number(key.split('_')[1]);
        return filteredLessons.some(l => l.id === lid);
      }).map(([key, val]) => {
        const [studentId, lessonId] = key.split('_').map(Number);
        return { lesson_id: lessonId, student_id: studentId, attended: val };
      });
      await api.post(`/api/groups/${selectedGroup}/attendance`, { records });
      if (add) add('Посещаемость сохранена', 'success');
    } catch { if (add) add('Ошибка сохранения', 'error'); }
    finally { setBusy(false); }
  };

  const groupName = groups.find(g => g.id === selectedGroup)?.name || '';
  const stats = useMemo(() => {
    if (!data?.students) return { students: 0, lessons: 0, total: 0, rate: 0 };
    const totalPossible = data.students.length * filteredLessons.length;
    const totalAttended = data.students.reduce((sum, s) => sum + (s.attended_count || 0), 0);
    return {
      students: data.students.length,
      lessons: filteredLessons.length,
      total: totalAttended,
      rate: totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0,
    };
  }, [data, filteredLessons]);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.hLeft}>
          <h1 style={s.hTitle}>Посещаемость</h1>
          <p style={s.hSub}>{selectedGroup ? `Группа «${groupName}»` : 'Выберите группу для просмотра'}</p>
        </div>
        <div style={s.hRight}>
          <div style={s.selectWrap}>
            <select style={s.select} value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value || null)}>
              <option value="">Выберите группу</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <span style={s.selectIcon}><SChevronDown /></span>
          </div>
          <div style={s.monthNav}>
            <button style={s.monthBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onClick={prevMonth}><SChevronLeft /></button>
            <span style={s.monthLabel}>{MONTHS[month]} {year}</span>
            <button style={s.monthBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onClick={nextMonth}><SChevronRight /></button>
          </div>
        </div>
      </div>

      {data ? (
        <>
          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statValue}>{stats.students}</div>
              <div style={s.statLabel}>Студентов</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statValue}>{stats.lessons}</div>
              <div style={s.statLabel}>Занятий в {MONTHS_ROD[month]}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statValue}>{stats.total}</div>
              <div style={s.statLabel}>Посещений</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: stats.rate >= 70 ? '#10b981' : stats.rate >= 40 ? '#f59e0b' : '#ef4444' }}>{stats.rate}%</div>
              <div style={s.statLabel}>Общая посещаемость</div>
            </div>
          </div>

          {/* Calendar Table */}
          <div style={s.card}>
            <div style={s.calHeader}>
              <div style={s.calStudentCol}>Студент</div>
              <div style={{ ...s.calDaysRow, gridTemplateColumns: `repeat(${daysInMonth}, minmax(32px, 1fr))` }}>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayOfWeek = (i + firstDay + 6) % 7;
                  const isLesson = filteredLessons.some(l => l.d.getDate() === i + 1);
                  return (
                    <div key={i} style={{
                      ...s.calDayHeader,
                      color: isLesson ? 'var(--text)' : 'var(--muted)',
                      opacity: isLesson ? 1 : 0.5,
                    }}>
                      <div>{i + 1}</div>
                      <div style={{ fontSize: 9 }}>{DAYS_SHORT[dayOfWeek]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={s.scrollWrap}>
              {data.students.map(st => {
                const totalHere = filteredLessons.filter(l => attendance[`${st.student_id}_${l.id}`]).length;
                const pct = filteredLessons.length > 0 ? Math.round((totalHere / filteredLessons.length) * 100) : 0;
                return (
                  <div key={st.student_id} style={s.studentRow}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={s.stInfo}>
                      <div style={s.stAvatar(COLORS[st.student_id % COLORS.length])}>{initials(st.name)}</div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={s.stName}>{st.name}</div>
                        <div style={{ ...s.stPct, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{ ...s.daysGrid, gridTemplateColumns: `repeat(${daysInMonth}, minmax(32px, 1fr))` }}>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayDate = new Date(year, month, i + 1);
                        const lesson = filteredLessons.find(l => l.d.getDate() === i + 1);
                        const isToday = new Date().toDateString() === dayDate.toDateString();
                        const key = lesson ? `${st.student_id}_${lesson.id}` : null;
                        const checked = key ? attendance[key] : false;
                        return (
                          <div key={i} style={{
                            ...s.dayCell,
                            background: isToday ? 'rgba(37,99,235,0.04)' : 'transparent',
                          }}
                            onMouseEnter={e => { if (lesson) e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(37,99,235,0.04)' : 'transparent'; }}
                            onClick={() => lesson && toggle(st.student_id, lesson.id)}>
                            {lesson ? (
                              <div style={s.check(checked)}>
                                {checked && <span style={s.checkInner}>✓</span>}
                              </div>
                            ) : (
                              <span style={s.emptyDay}>·</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={s.footer}>
              <button style={s.saveBtn} onClick={save} disabled={busy}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <SSave /> {busy ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </>
      ) : selectedGroup ? (
        <div style={s.empty}>Загрузка данных...</div>
      ) : (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📅</div>
          <div>Выберите группу для просмотра и отметки посещаемости</div>
        </div>
      )}
    </div>
  );
}
