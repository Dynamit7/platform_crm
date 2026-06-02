import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  upload: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const statusOf = (hw) => {
  if (hw.grade) return { key: 'done', label: `Оценка ${hw.grade}`, ring: 'lime' };
  if (hw.is_submitted) return { key: 'review', label: 'На проверке', ring: 'amber' };
  if (hw.is_overdue) return { key: 'overdue', label: 'Просрочено', ring: 'coral' };
  return { key: 'pending', label: 'Ожидается', ring: 'iris' };
};

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Активные' },
  { key: 'overdue', label: 'Просроченные' },
  { key: 'review', label: 'Проверка' },
  { key: 'done', label: 'Завершено' },
];

export default function Homeworks() {
  const { user } = useAuth();
  const { add } = useToast();
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [subContent, setSubContent] = useState('');
  const [subFile, setSubFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    api.get(`/api/student/${user?.id}/homeworks`)
      .then(({ data }) => setHomeworks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subContent.trim() && !subFile) { add && add('Добавьте текст или файл', 'error'); return; }
    if (subFile && subFile.size === 0) {
      add && add('Выбранный файл пустой (0 байт). Загрузите файл с содержимым.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (subFile) {
        // Читаем файл в base64 синхронно через Promise — иначе async-ошибки в onload теряются
        const b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
          reader.readAsDataURL(subFile);
        });
        await api.post('/api/homework/submit-file', {
          homework_id: modal.id,
          content: subContent,
          file_name: subFile.name,
          file_data: b64,
        });
      } else {
        await api.post('/api/homework/submit', { homework_id: modal.id, content: subContent });
      }
      setModal(null); setSubContent(''); setSubFile(null);
      add && add('Задание отправлено!', 'success');
      load();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Ошибка отправки';
      add && add(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: homeworks.length, pending: 0, overdue: 0, review: 0, done: 0 };
    homeworks.forEach(h => { const k = statusOf(h).key; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [homeworks]);

  const filtered = useMemo(() => {
    let arr = homeworks;
    if (filter !== 'all') arr = arr.filter(h => statusOf(h).key === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(h => (h.title || '').toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q));
    }
    return arr;
  }, [homeworks, search, filter]);

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Перелистываем тетрадь…</div>
      </div>
    </div>
  );

  const graded = homeworks.filter(h => h.grade);
  const avgGrade = graded.length ? (graded.reduce((s, h) => s + Number(h.grade || 0), 0) / graded.length).toFixed(1) : '—';

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 03 / HOMEWORK</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r">
          <span>{homeworks.length} TOTAL</span>
        </div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Tasks / 03</div>
        <h1 className="ed-page-title">Домашние <em>задания</em>.</h1>
        <p className="ed-page-lead">Личная тетрадь упражнений. Сдавайте вовремя, чтобы преподаватель успел оставить обратную связь.</p>

        {homeworks.length > 0 && (
          <div className="ed-page-bar">
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Активных</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{counts.pending}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>На проверке</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{counts.review}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Завершено</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1 }}>{counts.done}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 4 }}>Средний балл</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 42, letterSpacing: '-0.03em', lineHeight: 1, fontStyle: 'italic', color: 'var(--ed-iris)' }}>{avgGrade}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="ed-toolbar">
        <div className="ed-search">
          {ico.search}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" />
        </div>
        <div className="ed-pills">
          {FILTERS.map(f => (
            <button key={f.key} className={`ed-pill ${filter === f.key ? 'ed-pill--active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label} {counts[f.key] > 0 && <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[f.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— Pristine page —</div>
          <div className="ed-empty-title">{search || filter !== 'all' ? 'Ничего\nне найдено' : 'Тетрадь\nчиста'}</div>
          <div className="ed-empty-desc">{search || filter !== 'all' ? 'Поменяйте фильтр или запрос' : 'Задания появятся после начала курса'}</div>
        </div>
      ) : (
        <div className="ed-hw-grid">
          {filtered.map((hw, i) => {
            const s = statusOf(hw);
            const isUrgent = !hw.is_submitted && !hw.grade && hw.due_date && (new Date(hw.due_date) - Date.now()) < 86400000 && (new Date(hw.due_date) - Date.now()) > 0;
            return (
              <div key={hw.id} className={`ed-hw ed-hw--${s.ring}`}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <span className="ed-hw-num">/{String(i + 1).padStart(3, '0')}</span>
                  <span className={`ed-tag ed-tag--${s.ring}`}>{s.label}</span>
                </div>
                <div>
                  <div className="ed-hw-title">{hw.title}</div>
                  {hw.description && <div className="ed-hw-desc" style={{ marginTop: 8 }}>{hw.description}</div>}
                </div>
                <div className="ed-hw-due">
                  ⌛ до {hw.due_date ? new Date(hw.due_date).toLocaleDateString('ru-RU') : '—'}
                  {isUrgent && <span className="ed-tag ed-tag--amber" style={{ marginLeft: 8, padding: '3px 9px', fontSize: 9 }}>Срочно</span>}
                </div>
                <div className="ed-hw-foot">
                  {hw.grade ? (
                    <div className="ed-hw-grade">
                      <em>{hw.grade}</em>
                      <span style={{ fontSize: 14, color: 'var(--ed-text-mute)', fontWeight: 400, fontStyle: 'normal' }}>/10</span>
                    </div>
                  ) : hw.is_submitted ? (
                    <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ed-text-soft)' }}>Ожидайте оценку</span>
                  ) : hw.is_overdue ? (
                    <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ed-coral)' }}>Срок прошёл</span>
                  ) : (
                    <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ed-text-soft)' }}>Готово к сдаче</span>
                  )}
                  {!hw.is_submitted && !hw.grade && (
                    <button className="ed-hw-cta" onClick={() => setModal(hw)}>
                      Сдать {ico.arrow}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="ed-modal-overlay" onClick={() => !submitting && setModal(null)}>
          <div className="ed-modal" onClick={e => e.stopPropagation()}>
            <div className="ed-modal-head">
              <h3>Сдать <em>задание</em></h3>
              <button className="ed-modal-close" onClick={() => !submitting && setModal(null)}>{ico.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ed-modal-body">
                <div style={{ padding: 18, background: 'var(--ed-paper-soft)', borderRadius: 16, border: '1px solid var(--ed-border)', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginBottom: 6 }}>Задание</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 19, color: 'var(--ed-text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{modal.title}</div>
                  {modal.description && <div style={{ fontSize: 13, color: 'var(--ed-text-soft)', lineHeight: 1.55 }}>{modal.description}</div>}
                  {modal.due_date && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginTop: 10 }}>
                      ⌛ Срок: {new Date(modal.due_date).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                <div className="ed-field">
                  <label className="ed-field-label">Ваш ответ</label>
                  <textarea className="ed-input" rows={5} placeholder="Напишите решение или прикрепите файл ниже…" value={subContent} onChange={e => setSubContent(e.target.value)} />
                </div>

                <div className="ed-field">
                  <label className="ed-field-label">Файл (опционально)</label>
                  <label className="ed-drop">
                    <input type="file" onChange={e => setSubFile(e.target.files[0])} />
                    {ico.upload}
                    <div style={{ flex: 1 }}>
                      {subFile ? (
                        <>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: 'var(--ed-text)' }}>{subFile.name}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginTop: 2 }}>{(subFile.size / 1024).toFixed(1)} KB</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15 }}>Нажмите, чтобы выбрать файл</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ed-text-mute)', marginTop: 2 }}>PDF · DOCX · IMG</div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              <div className="ed-modal-foot">
                <button type="button" className="ed-btn ed-btn--ghost ed-btn--sm" onClick={() => setModal(null)} disabled={submitting}>Отмена</button>
                <button type="submit" className="ed-btn ed-btn--sm" disabled={submitting}>
                  {submitting ? 'Отправка…' : <>Отправить {ico.arrow}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
