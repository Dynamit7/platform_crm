import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

function AttCell({ checked, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 10,
      border: checked ? 'none' : '1px solid var(--ed-border)',
      background: checked ? 'var(--ed-ink)' : 'var(--ed-paper-soft)',
      color: checked ? 'var(--ed-paper)' : 'var(--ed-text-mute)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--ed-iris)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { if (!checked) { e.currentTarget.style.background = 'var(--ed-paper-soft)'; e.currentTarget.style.color = 'var(--ed-text-mute)'; } }}>
      {checked ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <span style={{ fontSize: 14, opacity: 0.4 }}>·</span>
      )}
    </button>
  );
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/groups/${user?.id}`).then(({ data }) => { setGroups(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

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

  const toggle = (studentId, lessonId) => {
    const key = `${studentId}_${lessonId}`;
    setAttendance({ ...attendance, [key]: !attendance[key] });
  };

  const reloadAttendance = () => {
    if (!selectedGroup) return;
    api.get(`/api/groups/${selectedGroup}/attendance`).then(({ data }) => {
      setData(data);
      const a = {};
      data.students?.forEach(s => {
        if (s.attendance) Object.entries(s.attendance).forEach(([lid, val]) => { a[`${s.student_id}_${lid}`] = val; });
      });
      setAttendance(a);
    }).catch(() => {});
  };

  const save = async () => {
    setBusy(true);
    try {
      const records = Object.entries(attendance).map(([key, val]) => {
        const [studentId, lessonId] = key.split('_').map(Number);
        return { lesson_id: lessonId, student_id: studentId, attended: val };
      });
      await api.post(`/api/groups/${selectedGroup}/attendance`, { records });
      add && add('Посещаемость сохранена', 'success');
      // Подтягиваем свежие attended_count / % после сохранения
      await new Promise(r => setTimeout(r, 100));
      reloadAttendance();
    } catch { add && add('Ошибка сохранения', 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Сверяем посещения…</div>
      </div>
    </div>
  );

  const groupName = groups.find(g => g.id === selectedGroup)?.name || '';
  const totalLessons = data?.lessons?.length || 0;
  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;

  // Aggregate stats
  const avgAttendance = data?.students?.length
    ? Math.round(
        data.students.reduce((sum, s) => sum + (s.lessons_total ? s.attended_count / s.lessons_total * 100 : 0), 0)
        / data.students.length
      )
    : 0;

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 06 / ATTENDANCE</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{data?.students?.length || 0} STUDENTS</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Attendance / 06</div>
        <h1 className="ed-page-title"><em>Посещаемость</em>.</h1>
        <p className="ed-page-lead">
          {selectedGroup
            ? <>Группа <em style={{ fontStyle: 'italic', color: 'var(--ed-iris)' }}>«{groupName}»</em> — {totalLessons} {totalLessons === 1 ? 'занятие' : 'занятий'}</>
            : 'Выберите группу из списка ниже'}
        </p>

        {selectedGroup && data && (
          <div className="ed-page-bar">
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Студентов</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{data.students?.length || 0}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Уроков</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{totalLessons}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Средняя</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: avgAttendance >= 70 ? 'var(--ed-iris)' : 'var(--ed-coral)' }}>
                  {avgAttendance}<em style={{ fontSize: '0.5em', color: 'var(--ed-text-mute)' }}>%</em>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="ed-toolbar">
        <select value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value || null)}
          style={{
            padding: '11px 18px', borderRadius: 100, border: '1px solid var(--ed-border)',
            background: 'var(--ed-surface)', color: 'var(--ed-text)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', outline: 'none',
            minWidth: 240,
          }}>
          <option value="">Выберите группу</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {selectedGroup && data && (
          <button className="ed-btn ed-btn--sm" onClick={save} disabled={busy} style={{ marginLeft: 'auto' }}>
            {busy ? 'Сохранение…' : <>{ico.save} Сохранить</>}
          </button>
        )}
      </div>

      {!selectedGroup ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— No selection —</div>
          <div className="ed-empty-title">Выберите\nгруппу</div>
          <div className="ed-empty-desc">Чтобы отметить посещаемость, выберите группу выше</div>
        </div>
      ) : !data ? (
        <div className="ed-loading"><div className="ed-spinner" /></div>
      ) : data.students?.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— Empty roster —</div>
          <div className="ed-empty-title">В группе\nпока никого</div>
          <div className="ed-empty-desc">Добавьте студентов в группу через раздел «Студенты»</div>
        </div>
      ) : (
        <div style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{
                  padding: '16px 18px', textAlign: 'left',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--ed-text-mute)', borderBottom: '1px solid var(--ed-border)',
                  background: 'var(--ed-paper-soft)', position: 'sticky', left: 0, zIndex: 2,
                }}>Студент</th>
                <th style={{
                  padding: '16px 12px', textAlign: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--ed-text-mute)', borderBottom: '1px solid var(--ed-border)',
                  background: 'var(--ed-paper-soft)',
                }}>%</th>
                {data.lessons?.map(l => (
                  <th key={l.id} style={{
                    padding: '12px 8px', textAlign: 'center',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
                    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--ed-text-mute)', borderBottom: '1px solid var(--ed-border)',
                    background: 'var(--ed-paper-soft)', minWidth: 56, whiteSpace: 'nowrap',
                  }}>
                    {new Date(l.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students?.map(s => {
                const pct = s.lessons_total ? Math.round(s.attended_count / s.lessons_total * 100) : 0;
                return (
                  <tr key={s.student_id} style={{ borderBottom: '1px solid var(--ed-border)' }}>
                    <td style={{ padding: '14px 18px', position: 'sticky', left: 0, background: 'var(--ed-surface)', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 12,
                          background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 12.5,
                        }}>{initials(s.name)}</div>
                        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 15, letterSpacing: '-0.015em' }}>{s.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <span className={`ed-tag ${pct >= 80 ? 'ed-tag--lime' : pct >= 50 ? 'ed-tag--amber' : 'ed-tag--coral'}`}>
                        {pct}%
                      </span>
                    </td>
                    {data.lessons?.map(l => (
                      <td key={l.id} style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <AttCell checked={!!attendance[`${s.student_id}_${l.id}`]} onClick={() => toggle(s.student_id, l.id)} />
                      </td>
                    ))}
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
