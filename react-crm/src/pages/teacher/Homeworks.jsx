import { useState, useEffect } from 'react';
import api from '../../api/axios';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const GradeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function TeacherHomeworks() {
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const [gradeVal, setGradeVal] = useState({});
  const [feedbackVal, setFeedbackVal] = useState({});
  const [busy, setBusy] = useState({});

  useEffect(() => {
    api.get('/api/homework/pending').then(({ data }) => setPending(data)).catch(() => {});
  }, []);

  const handleGrade = async (submissionId) => {
    const grade = gradeVal[submissionId];
    if (!grade || parseInt(grade) < 1 || parseInt(grade) > 100) return;
    setBusy({ ...busy, [submissionId]: true });
    try {
      await api.post('/api/homework/grade', {
        submission_id: submissionId,
        grade: String(grade),
        feedback: feedbackVal[submissionId] || ''
      });
      setPending(prev => prev.filter(s => s.id !== submissionId));
    } catch {}
    setBusy({ ...busy, [submissionId]: false });
  };

  const filtered = search.trim()
    ? pending.filter(s =>
        (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.hw_title || '').toLowerCase().includes(search.toLowerCase())
      )
    : pending;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>ДЗ на проверке</h1>
          <p>{pending.length} работ{pending.length !== 1 ? '' : 'а'} ожидают оценки</p>
        </div>
      </div>

      <div className="tg-topbar">
        <div className="tg-search">
          <SearchIcon />
          <input type="text" placeholder="Поиск по студенту или заданию..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tg-table-wrap">
        <table className="tg-table">
          <thead>
            <tr>
              <th>Студент</th>
              <th>Задание</th>
              <th>Дата сдачи</th>
              <th style={{ width: 100 }}>Оценка</th>
              <th>Комментарий</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="tg-empty" style={{ padding: '60px 20px' }}>
                    <div className="tg-empty-icon">
                      <PendingIcon />
                    </div>
                    <div className="tg-empty-title">{search ? 'Ничего не найдено' : 'Нет ДЗ на проверке'}</div>
                    <div className="tg-empty-desc">
                      {search ? 'Попробуйте изменить поисковый запрос' : 'Все домашние задания оценены'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(s => (
              <tr key={s.id}>
                <td><div className="tg-name">{s.student_name}</div></td>
                <td><span style={{ fontSize: 13 }}>{s.hw_title}</span></td>
                <td><div className="tg-muted">{new Date(s.submitted_at).toLocaleDateString()}</div></td>
                <td>
                  <input type="number" min="1" max="100" className="form-input"
                    style={{ width: 80, padding: '8px 10px' }}
                    value={gradeVal[s.id] || ''}
                    onChange={e => setGradeVal({ ...gradeVal, [s.id]: e.target.value })} />
                </td>
                <td>
                  <input type="text" className="form-input"
                    style={{ width: '100%', padding: '8px 10px' }}
                    placeholder="Комментарий..."
                    value={feedbackVal[s.id] || ''}
                    onChange={e => setFeedbackVal({ ...feedbackVal, [s.id]: e.target.value })} />
                </td>
                <td>
                  <button className="tg-btn tg-btn--primary" style={{ padding: '8px 16px', fontSize: 12 }}
                    onClick={() => handleGrade(s.id)} disabled={busy[s.id]}>
                    <GradeIcon /> {busy[s.id] ? '...' : 'Оценить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
