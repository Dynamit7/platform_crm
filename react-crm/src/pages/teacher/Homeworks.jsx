import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

export default function TeacherHomeworks() {
  const { add } = useToast();
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeVal, setGradeVal] = useState({});
  const [feedbackVal, setFeedbackVal] = useState({});
  const [busy, setBusy] = useState({});

  // Create homework modal state
  const [groups, setGroups] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ group_id: '', title: '', description: '', due_date: '' });

  useEffect(() => {
    api.get('/api/homework/pending').then(({ data }) => { setPending(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/groups/${user.id}`).then(({ data }) => setGroups(data || [])).catch(() => {});
  }, [user?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.group_id || !createForm.title || !createForm.description || !createForm.due_date) {
      add && add('Заполните все поля', 'error');
      return;
    }
    const group = groups.find(g => g.id === parseInt(createForm.group_id));
    if (!group) { add && add('Выберите группу', 'error'); return; }
    setCreating(true);
    try {
      await api.post('/api/homeworks', {
        course_id: group.course_id,
        group_id: group.id,
        title: createForm.title,
        description: createForm.description,
        due_date: new Date(`${createForm.due_date}T23:59:00`).toISOString(),
      });
      add && add('Домашнее задание создано — студенты получили уведомление', 'success');
      setCreateOpen(false);
      setCreateForm({ group_id: '', title: '', description: '', due_date: '' });
    } catch (err) {
      add && add(err?.response?.data?.detail || 'Ошибка создания', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleGrade = async (submissionId) => {
    const grade = gradeVal[submissionId];
    if (!grade || parseInt(grade) < 1 || parseInt(grade) > 100) {
      add && add('Введите оценку от 1 до 100', 'error');
      return;
    }
    setBusy({ ...busy, [submissionId]: true });
    try {
      await api.post('/api/homework/grade', {
        submission_id: submissionId,
        grade: String(grade),
        feedback: feedbackVal[submissionId] || ''
      });
      setPending(prev => prev.filter(s => s.id !== submissionId));
      add && add('Оценка выставлена', 'success');
    } catch { add && add('Ошибка при оценке', 'error'); }
    setBusy({ ...busy, [submissionId]: false });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return pending;
    const q = search.toLowerCase();
    return pending.filter(s =>
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.hw_title || '').toLowerCase().includes(q)
    );
  }, [pending, search]);

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Собираем работы на проверку…</div>
      </div>
    </div>
  );

  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 05 / HOMEWORK</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{pending.length} PENDING</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Review queue / 05</div>
        <h1 className="ed-page-title">
          <em>{pending.length}</em> {pending.length === 1 ? 'работа' : pending.length > 1 && pending.length < 5 ? 'работы' : 'работ'}
          <br />
          ждут проверки.
        </h1>
        <p className="ed-page-lead">Студенты сдали задания и ждут вашей оценки и обратной связи. Не оставляйте их надолго в подвешенном состоянии.</p>
      </div>

      <div className="ed-toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="ed-search" style={{ flex: 1 }}>
          {ico.search}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student / task" />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
          }}
        >
          {ico.plus} Новое ДЗ
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— Inbox zero —</div>
          <div className="ed-empty-title">{search ? 'Ничего\nне найдено' : 'Всё оценено!'}</div>
          <div className="ed-empty-desc">{search ? 'Поменяйте запрос' : 'Все домашние задания проверены. Отличная работа!'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="ed-hw ed-hw--iris" style={{ flexDirection: 'row', alignItems: 'stretch', padding: 0 }}>
              <div style={{ padding: '24px 22px', borderRight: '1px solid var(--ed-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 240, maxWidth: 280, flexShrink: 0 }}>
                <div>
                  <div className="ed-hw-num">/{String(i + 1).padStart(3, '0')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'var(--ed-ink)', color: 'var(--ed-paper)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 15,
                    }}>{initials(s.student_name)}</div>
                    <div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 17, letterSpacing: '-0.015em' }}>{s.student_name}</div>
                      <div className="ed-hw-due" style={{ marginTop: 2 }}>
                        ⌛ {new Date(s.submitted_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ed-hw-title" style={{ fontSize: 17, marginTop: 16 }}>{s.hw_title}</div>
                {(s.text || s.content) && (
                  <div className="ed-hw-desc" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {(s.text || s.content || '').replace(/\[Файл:\s*\S+?\]/g, '').trim() || <em style={{ opacity: 0.5 }}>без текста</em>}
                  </div>
                )}
                {(s.file_id || /\[Файл:/.test(s.content || '')) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { data } = await api.get(`/api/homework/submission/${s.id}/file`);
                        window.open(data.url, '_blank', 'noopener');
                      } catch (err) {
                        add && add(err?.response?.data?.detail || 'Файл не открывается', 'error');
                      }
                    }}
                    style={{
                      marginTop: 12,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: 'var(--ed-iris, #818cf8)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap', width: 'fit-content',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    {(s.file_type || 'Файл').toUpperCase()} — открыть
                  </button>
                )}
              </div>

              <div style={{ flex: 1, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14 }}>
                  <div className="ed-field" style={{ marginBottom: 0 }}>
                    <label className="ed-field-label">Оценка</label>
                    <input
                      className="ed-input"
                      type="number" min="1" max="100"
                      placeholder="0–100"
                      value={gradeVal[s.id] || ''}
                      onChange={e => setGradeVal({ ...gradeVal, [s.id]: e.target.value })}
                      style={{ textAlign: 'center', fontFamily: 'Fraunces, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 500 }} />
                  </div>
                  <div className="ed-field" style={{ marginBottom: 0 }}>
                    <label className="ed-field-label">Комментарий студенту</label>
                    <textarea
                      className="ed-input"
                      rows={2}
                      placeholder="Конструктивная обратная связь…"
                      value={feedbackVal[s.id] || ''}
                      onChange={e => setFeedbackVal({ ...feedbackVal, [s.id]: e.target.value })}
                      style={{ minHeight: 56, resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="ed-btn ed-btn--sm" onClick={() => handleGrade(s.id)} disabled={busy[s.id]}>
                    {busy[s.id] ? 'Сохранение…' : <>{ico.check} Выставить оценку</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новое домашнее задание"
        width={520}
        footer={
          <>
            <button type="button" className="ld-btn ld-btn--outline" onClick={() => setCreateOpen(false)}>Отмена</button>
            <button type="submit" form="hw-create-form" className="ld-btn ld-btn--primary" disabled={creating}>
              {creating ? 'Создание…' : 'Создать и отправить'}
            </button>
          </>
        }
      >
        <form id="hw-create-form" onSubmit={handleCreate} style={{ display: 'grid', rowGap: 14 }}>
          <label className="ld-field">
            <span>Группа *</span>
            <select className="ld-input" required value={createForm.group_id}
              onChange={e => setCreateForm(p => ({ ...p, group_id: e.target.value }))}>
              <option value="">— выберите группу —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}{g.course?.title ? ` · ${g.course.title}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="ld-field">
            <span>Тема задания *</span>
            <input className="ld-input" required placeholder="Например, Past Simple — 10 предложений"
              value={createForm.title}
              onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
          </label>
          <label className="ld-field">
            <span>Описание *</span>
            <textarea className="ld-input" required rows={5} placeholder="Что именно нужно сделать, какие материалы использовать…"
              value={createForm.description}
              style={{ resize: 'vertical', minHeight: 100 }}
              onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
          </label>
          <label className="ld-field">
            <span>Срок сдачи *</span>
            <input className="ld-input" type="date" required
              value={createForm.due_date}
              onChange={e => setCreateForm(p => ({ ...p, due_date: e.target.value }))} />
          </label>
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '10px 12px', background: 'var(--bg)', borderRadius: 8 }}>
            💡 После создания всем студентам группы прилетит уведомление в Telegram, и задание появится в их кабинете.
          </div>
        </form>
      </Modal>
    </div>
  );
}
