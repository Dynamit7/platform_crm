import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const MONTHS_SHORT = ['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];

export default function TeacherLessons() {
  const { user } = useAuth();
  const { add } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ topic: '', lesson_date: '', lesson_time: '', homework: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/teacher/groups/${user?.id}`).then(({ data }) => {
      setGroups(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/api/groups/${selectedGroup}/lessons`).then(({ data }) => setLessons(data)).catch(() => setLessons([]));
    }
  }, [selectedGroup]);

  const createLesson = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const scheduled_at = form.lesson_date ? `${form.lesson_date}T${form.lesson_time || '10:00'}:00` : new Date().toISOString();
      await api.post('/api/lessons', { group_id: parseInt(selectedGroup), topic: form.topic, scheduled_at, homework: form.homework });
      add && add('Урок создан', 'success');
      setShowForm(false);
      setForm({ topic: '', lesson_date: '', lesson_time: '', homework: '' });
      const { data } = await api.get(`/api/groups/${selectedGroup}/lessons`);
      setLessons(data);
    } catch { add && add('Ошибка', 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Открываем планер уроков…</div>
      </div>
    </div>
  );

  const groupName = groups.find(g => g.id === selectedGroup)?.name || '';
  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const completed = lessons.filter(l => l.is_completed).length;
  const upcoming = lessons.filter(l => !l.is_completed).length;

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>TEACHER JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 04 / LESSONS</span>
          <span className="ed-masthead-sep" />
          <span>{issueNum}</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{lessons.length} TOTAL</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Lessons / 04</div>
        <h1 className="ed-page-title"><em>Уроки</em>.</h1>
        <p className="ed-page-lead">
          {selectedGroup
            ? <>Группа <em style={{ fontStyle: 'italic', color: 'var(--ed-iris)' }}>«{groupName}»</em> — {lessons.length} {lessons.length === 1 ? 'урок' : 'уроков'}</>
            : 'Выберите группу из списка ниже'}
        </p>

        {selectedGroup && (
          <div className="ed-page-bar">
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Всего</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{lessons.length}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Проведено</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{completed}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Запланировано</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: 'var(--ed-iris)' }}>{upcoming}</div>
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
        {selectedGroup && (
          <button className="ed-btn ed-btn--sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <>{ico.close} Отмена</> : <>{ico.plus} Создать урок</>}
          </button>
        )}
      </div>

      {showForm && selectedGroup && (
        <div style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', borderRadius: 22, padding: 28, marginBottom: 28 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 6 }}>— New lesson</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 28, letterSpacing: '-0.025em', marginBottom: 22, color: 'var(--ed-text)' }}>Новый <em>урок</em></div>
          <form onSubmit={createLesson}>
            <div className="ed-field">
              <label className="ed-field-label">Тема урока</label>
              <input className="ed-input" type="text" placeholder="например, Глаголы です/だ"
                value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="ed-field">
                <label className="ed-field-label">Дата</label>
                <input className="ed-input" type="date"
                  value={form.lesson_date} onChange={e => setForm({ ...form, lesson_date: e.target.value })} required />
              </div>
              <div className="ed-field">
                <label className="ed-field-label">Время</label>
                <input className="ed-input" type="time"
                  value={form.lesson_time} onChange={e => setForm({ ...form, lesson_time: e.target.value })} />
              </div>
            </div>
            <div className="ed-field">
              <label className="ed-field-label">Домашнее задание</label>
              <textarea className="ed-input" rows={3} placeholder="Описание задания…"
                value={form.homework} onChange={e => setForm({ ...form, homework: e.target.value })} />
            </div>
            <button type="submit" className="ed-btn" disabled={busy} style={{ marginTop: 10 }}>
              {busy ? 'Создание…' : <>{ico.check} Создать урок</>}
            </button>
          </form>
        </div>
      )}

      {!selectedGroup ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— No selection —</div>
          <div className="ed-empty-title">Выберите\nгруппу</div>
          <div className="ed-empty-desc">Чтобы увидеть уроки и создавать новые, выберите группу выше</div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— Blank planner —</div>
          <div className="ed-empty-title">Уроков\nпока нет</div>
          <div className="ed-empty-desc">Создайте первый урок для этой группы — он появится в расписании студентов</div>
        </div>
      ) : (
        <div className="ed-sched-list">
          {lessons.map((l, i) => {
            const dt = l.scheduled_at ? new Date(l.scheduled_at) : null;
            const day = dt ? dt.getDate() : '—';
            const mon = dt ? MONTHS_SHORT[dt.getMonth()] : '';
            const timeStr = dt ? dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
            return (
              <div key={l.id} className={`ed-sched-row ${l.is_completed ? '' : ''}`} style={{ gridTemplateColumns: '88px 1fr auto auto' }}>
                <div className="ed-sched-day" style={{ width: 88, height: 80 }}>
                  <div className="ed-sched-day-num" style={{ fontSize: 32 }}>{day}</div>
                  <div className="ed-sched-day-label">{mon}</div>
                </div>
                <div>
                  <div className="ed-sched-info-title" style={{ fontSize: 18 }}>{l.topic}</div>
                  <div className="ed-sched-info-sub">{timeStr} · #{String(i + 1).padStart(3, '0')}</div>
                </div>
                {l.homework && (
                  <span className="ed-tag ed-tag--iris">📝 ДЗ</span>
                )}
                <span className={`ed-tag ${l.is_completed ? 'ed-tag--lime' : 'ed-tag--mute'}`}>
                  {l.is_completed ? '✓ Проведён' : '○ Запланирован'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
