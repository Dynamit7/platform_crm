import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const CalIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CheckIcon = ({ checked }) => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill={checked ? '#10b981' : 'none'} stroke={checked ? 'none' : '#94a3b8'}/>
    {checked && <polyline points="9 12 11 14 15 10" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const avatarColor = (id) => ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c'][(id || 0) % 5];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

export default function TeacherAttendance() {
  const { user } = useAuth();
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/teacher/groups/${user?.id}`).then(({ data }) => setGroups(data)).catch(() => {});
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

  const save = async () => {
    setBusy(true);
    try {
      const records = Object.entries(attendance).map(([key, val]) => {
        const [studentId, lessonId] = key.split('_').map(Number);
        return { lesson_id: lessonId, student_id: studentId, attended: val };
      });
      await api.post(`/api/groups/${selectedGroup}/attendance`, { records });
      if (add) add('Посещаемость сохранена', 'success');
    } catch { if (add) add('Ошибка сохранения', 'error'); }
    finally { setBusy(false); }
  };

  const groupName = groups.find(g => g.id === selectedGroup)?.name || '';
  const totalLessons = data?.lessons?.length || 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Посещаемость</h1>
          <p>{selectedGroup ? `Группа «${groupName}» — ${totalLessons} занятий` : 'Выберите группу'}</p>
        </div>
        {selectedGroup && data && (
          <button className="tg-btn tg-btn--primary" onClick={save} disabled={busy}>
            <SaveIcon /> {busy ? 'Сохранение...' : 'Сохранить'}
          </button>
        )}
      </div>

      <div className="tg-topbar">
        <div className="tg-filter-select">
          <select value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value || null)}>
            <option value="">Выберите группу</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown />
        </div>
      </div>

      {!selectedGroup && (
        <div className="tg-empty" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--muted)' }}><CalIcon /></div>
          <div className="tg-empty-title">Выберите группу</div>
          <div className="tg-empty-desc">Выберите группу, чтобы отметить посещаемость</div>
        </div>
      )}

      {data && (
        <div className="tg-table-wrap">
          <table className="tg-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Студент</th>
                <th style={{ textAlign: 'center' }}>%</th>
                {data.lessons?.map(l => (
                  <th key={l.id} style={{ textAlign: 'center', minWidth: 36, fontSize: 10 }}>
                    {new Date(l.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students?.map(s => {
                const pct = s.lessons_total ? (s.attended_count / s.lessons_total * 100).toFixed(0) : 0;
                return (
                  <tr key={s.student_id}>
                    <td>
                      <div className="teacher-student-avatar" style={{ width: 30, height: 30, fontSize: 10, background: avatarColor(s.student_id) }}>
                        {initials(s.name)}
                      </div>
                    </td>
                    <td><div className="tg-name">{s.name}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="tg-badge" style={{
                        background: pct >= 70 ? '#10b9811a' : '#f59e0b1a',
                        color: pct >= 70 ? 'var(--success)' : 'var(--warning)'
                      }}>{pct}%</span>
                    </td>
                    {data.lessons?.map(l => (
                      <td key={l.id} style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => toggle(s.student_id, l.id)}>
                        <CheckIcon checked={attendance[`${s.student_id}_${l.id}`]} />
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
