import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const s = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '24px 32px' },
  header: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'var(--muted)' },
  refreshBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.2s' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 },
  statCard: { background: 'var(--surface)', borderRadius: 14, padding: '18px 22px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' },
  statValue: { fontSize: 28, fontWeight: 700, marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' },
  statSub: { fontSize: 11, color: 'var(--muted)', marginTop: 2, fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
  filters: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, padding: '14px 18px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' },
  searchInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', minWidth: 200, outline: 'none' },
  resetBtn: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 },
  card: { background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', transition: 'all 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardTop: { padding: '18px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 },
  avatar: (url) => ({
    width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 16, fontWeight: 700,
    ...(url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover' } : {}),
  }),
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  studentMeta: { fontSize: 11, color: 'var(--muted)', marginTop: 1 },
  stars: (n) => ({ color: '#f59e0b', fontSize: 16, letterSpacing: 2, marginTop: 2 }),
  statusBadge: (status) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: status === 'published' ? '#e8f5e9' : status === 'rejected' ? '#fee2e2' : '#fff3e0',
    color: status === 'published' ? '#2e7d32' : status === 'rejected' ? '#dc2626' : '#e65100',
    whiteSpace: 'nowrap',
  }),
  cardBody: { padding: '0 20px 14px' },
  text: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' },
  mediaRow: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  mediaThumb: { width: 60, height: 60, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border)', transition: 'transform 0.2s' },
  tags: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  tag: { padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' },
  cardFooter: { padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg)' },
  actionBtn: (color, bg) => ({
    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', background: bg || 'transparent', color: color || 'var(--text)',
    transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
  }),
  empty: { textAlign: 'center', padding: 60, color: 'var(--muted)' },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: 16, padding: 28, width: 520, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 },
  replyTextarea: { width: '100%', minHeight: 100, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 },
  modalBtn: (primary) => ({
    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    background: primary ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
    color: primary ? '#fff' : 'var(--text)',
    border: primary ? 'none' : '1px solid var(--border)',
  }),
};

const STATUS_OPTS = [
  { key: '', label: 'Все статусы' },
  { key: 'moderation', label: 'На модерации' },
  { key: 'published', label: 'Опубликовано' },
  { key: 'rejected', label: 'Отклонён' },
];

const STATUS_LABELS = { moderation: 'На модерации', published: 'Опубликован', rejected: 'Отклонён' };

export default function AdminReviews() {
  const { add } = useToast();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, avg_rating: 0, positive: 0, negative: 0, published: 0, moderation: 0 });
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [search, setSearch] = useState('');

  // Reply modal
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Media preview
  const [mediaPreview, setMediaPreview] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (courseFilter) params.set('course_id', courseFilter);
      if (teacherFilter) params.set('teacher_id', teacherFilter);
      if (search) params.set('search', search);
      const [reviewsRes, statsRes] = await Promise.all([
        api.get(`/api/reviews?${params}`),
        api.get('/api/admin/reviews/stats'),
      ]);
      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch { if (add) add('Ошибка загрузки', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, courseFilter, teacherFilter, search, add]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch courses + teachers for filters
  useEffect(() => {
    Promise.all([
      api.get('/api/courses').catch(() => ({ data: [] })),
      api.get('/api/admin/teachers').catch(() => ({ data: [] })),
    ]).then(([c, t]) => {
      setCourses(c.data || []);
      setTeachers(t.data || []);
    }).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/reviews/${id}`, { status });
      if (add) add(`Статус: ${STATUS_LABELS[status] || status}`, 'success');
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      const newStats = { ...stats };
      if (status === 'published') { newStats.published += 1; newStats.moderation = Math.max(0, newStats.moderation - 1); }
      else if (status === 'rejected' && reviews.find(r => r.id === id)?.status === 'moderation') { newStats.moderation = Math.max(0, newStats.moderation - 1); }
      setStats(newStats);
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const sendReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    try {
      await api.patch(`/api/admin/reviews/${replyModal}`, { admin_reply: replyText });
      if (add) add('✅ Ответ опубликован', 'success');
      setReviews(prev => prev.map(r => r.id === replyModal ? { ...r, admin_reply: replyText } : r));
      setReplyModal(null);
      setReplyText('');
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const deleteReview = async (id) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      if (add) add('🗑 Отзыв удалён', 'success');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const hasActiveFilters = statusFilter || courseFilter || teacherFilter || search;

  return (
    <div className="ed-page ed-admin" style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={s.title}>Отзывы студентов</h1>
            <p style={s.subtitle}>Модерация и управление отзывами</p>
          </div>
          <button onClick={fetchData} style={s.refreshBtn} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#667eea', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {stats.avg_rating}
            <span style={{ fontSize: 14, color: '#f59e0b' }}>
              {'★'.repeat(Math.round(stats.avg_rating))}{'☆'.repeat(5 - Math.round(stats.avg_rating))}
            </span>
          </div>
          <div style={s.statLabel}>Средний рейтинг</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: 'var(--text)' }}>{stats.total}</div>
          <div style={s.statLabel}>Всего отзывов</div>
          <div style={s.statSub}>Опубликовано: {stats.published} · На модерации: {stats.moderation}</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#22c55e' }}>{stats.positive}</div>
          <div style={s.statLabel}>Положительных</div>
          <div style={s.statSub}>(оценка 4–5)</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#ef4444' }}>{stats.negative}</div>
          <div style={s.statLabel}>Отрицательных</div>
          <div style={s.statSub}>(оценка 1–2)</div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select style={s.select} value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="">Все курсы</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select style={s.select} value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
          <option value="">Все преподаватели</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input style={s.searchInput} placeholder="🔍 Поиск по имени или тексту..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {hasActiveFilters && (
          <button onClick={() => { setStatusFilter(''); setCourseFilter(''); setTeacherFilter(''); setSearch(''); }}
            style={s.resetBtn}>✕ Сбросить</button>
        )}
      </div>

      {/* Cards */}
      {loading && reviews.length === 0 ? (
        <div style={s.empty}>Загрузка...</div>
      ) : reviews.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>💬</div>
          <div>Нет отзывов</div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>
            {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Отзывы появятся после того, как студенты оставят их'}
          </div>
        </div>
      ) : (
        <div style={s.cards}>
          {reviews.map(r => (
            <div key={r.id} style={s.card}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>
              {/* Top: avatar + name + rating + status */}
              <div style={s.cardTop}>
                <div style={s.avatar(r.student_avatar)}>
                  {!r.student_avatar && r.student_name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={s.studentInfo}>
                  <div style={s.studentName}>{r.student_name}</div>
                  <div style={s.studentMeta}>
                    {r.group_name || '—'}
                    {r.course_name && ` · ${r.course_name}`}
                  </div>
                  <div style={s.stars(r.rating)}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <span style={s.statusBadge(r.status)}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
              </div>

              {/* Body: text */}
              <div style={s.cardBody}>
                <p style={s.text}>{r.text}</p>

                {/* Media */}
                {(Array.isArray(r.media_urls) ? r.media_urls : (() => { try { return JSON.parse(r.media_urls || '[]'); } catch { return []; } })()).filter(Boolean).length > 0 && (
                  <div style={s.mediaRow}>
                    {(Array.isArray(r.media_urls) ? r.media_urls : (() => { try { return JSON.parse(r.media_urls || '[]'); } catch { return []; } })()).filter(Boolean).map((url, i) => (
                      url.match(/\.(mp4|webm|ogg)/i) ? (
                        <video key={i} src={url} style={s.mediaThumb} muted
                          onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                      ) : (
                        <img key={i} src={url} alt="" style={s.mediaThumb}
                          onClick={() => setMediaPreview(url)} />
                      )
                    ))}
                  </div>
                )}

                {/* Tags */}
                <div style={s.tags}>
                  {r.teacher_name && <span style={s.tag}>👩‍🏫 {r.teacher_name}</span>}
                  {r.course_name && <span style={s.tag}>📚 {r.course_name}</span>}
                  {r.group_name && <span style={s.tag}>👥 {r.group_name}</span>}
                </div>

                {/* Admin reply */}
                {r.admin_reply && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, borderLeft: '3px solid #667eea' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#667eea', marginBottom: 4 }}>Ответ администратора:</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r.admin_reply}</div>
                  </div>
                )}
              </div>

              {/* Footer: actions */}
              <div style={s.cardFooter}>
                {r.status !== 'published' && (
                  <button onClick={() => updateStatus(r.id, 'published')} style={s.actionBtn('#fff', '#22c55e')}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    ✅ Опубликовать
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => updateStatus(r.id, 'rejected')} style={s.actionBtn('#dc2626', '#fee2e2')}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    🚫 Скрыть
                  </button>
                )}
                <button onClick={() => { setReplyModal(r.id); setReplyText(r.admin_reply || ''); }}
                  style={s.actionBtn('#6366f1', '#eef2ff')}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  💬 Ответить
                </button>
                <button onClick={() => deleteReview(r.id)}
                  style={s.actionBtn('#6b7280', 'transparent')}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
        Показано: {reviews.length} из {stats.total}
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div style={s.modalOverlay} onClick={() => setReplyModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>💬 Ответ на отзыв</div>
            <textarea style={s.replyTextarea} value={replyText} autoFocus
              onChange={e => setReplyText(e.target.value)}
              placeholder="Напишите ответ студенту..." />
            <div style={s.modalActions}>
              <button onClick={() => setReplyModal(null)} style={s.modalBtn(false)}>Отмена</button>
              <button onClick={sendReply} disabled={!replyText.trim()}
                style={{ ...s.modalBtn(true), opacity: replyText.trim() ? 1 : 0.5 }}>Отправить</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview */}
      {mediaPreview && (
        <div style={s.modalOverlay} onClick={() => setMediaPreview(null)}>
          <div style={{ maxWidth: '80vw', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            {mediaPreview.match(/\.(mp4|webm|ogg)/i) ? (
              <video src={mediaPreview} controls style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12 }} />
            ) : (
              <img src={mediaPreview} alt="" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}