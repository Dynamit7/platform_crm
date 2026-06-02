import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';

/* ── SVG Icons ── */
const SSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
  </svg>
);
const SExport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const SColumns = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const SList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const SArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const SPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SChat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const SUserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);
const SClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const SGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const STATUS_CONFIG = {
  new:       { label: 'Новые',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', dot: '#3b82f6' },
  contacted: { label: 'В работе',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  enrolled:  { label: 'Зачислен',  color: '#10b981', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  lost:      { label: 'Потерян',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
};

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
    <span style={{ fontSize: 13.5, textAlign: 'right', wordBreak: 'break-word' }}>{children}</span>
  </div>
);

const SOURCE_LABELS = { manual: 'Вручную', web: 'Сайт', telegram: 'Telegram' };

const SOURCE_ICONS = {
  manual:   '📝',
  web:      '🌐',
  telegram: '✈️',
};

export default function Leads() {
  const { add } = useToast();
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, enrolled: 0, lost: 0 });
  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table | kanban
  const [courses, setCourses] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', course_id: '', notes: '', source: 'manual' });
  const [saving, setSaving] = useState(false);
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    api.get('/api/leads/counts').then(({ data }) => setCounts(data)).catch(() => {});
    api.get('/api/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusTab) params.set('status', statusTab);
    if (search) params.set('search', search);
    if (courseId) params.set('course_id', courseId);
    if (sourceFilter) params.set('source', sourceFilter);
    api.get(`/api/leads?${params}`).then(({ data }) => {
      setLeads(data);
    }).catch(() => {});
  }, [statusTab, search, courseId, sourceFilter]);

  const sortedLeads = useMemo(() => {
    const list = [...leads];
    list.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (sortCol === 'created_at' || sortCol === 'updated_at') {
        va = va || ''; vb = vb || '';
      }
      if (typeof va === 'string') {
        const cmp = va.localeCompare(vb || '');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return list;
  }, [leads, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const updateStatus = async (id, st) => {
    try {
      await api.patch(`/api/leads/${id}`, { status: st });
      if (add) add('Статус обновлён', 'success');
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: st } : l));
      if (selectedLead?.id === id) setSelectedLead(p => ({ ...p, status: st }));
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const deleteLead = async (id) => {
    if (!confirm('Удалить заявку?')) return;
    try {
      await api.delete(`/api/leads/${id}`);
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
      if (add) add('Заявка удалена', 'success');
    } catch { if (add) add('Ошибка', 'error'); }
  };

  const convertLead = async (id) => {
    try {
      const { data } = await api.post(`/api/leads/${id}/convert`, {});
      if (add) add(data.message || 'Студент создан', 'success');
      setLeads(prev => prev.filter(l => l.id !== id));
      setSelectedLead(null);
    } catch { if (add) add('Ошибка конвертации', 'error'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/api/leads', createForm);
      if (add) add('Заявка создана', 'success');
      setLeads(prev => [data, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', phone: '', course_id: '', notes: '', source: 'manual' });
    } catch { if (add) add('Ошибка', 'error'); }
    finally { setSaving(false); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="ld-sort-off">↕</span>;
    return <span className="ld-sort-on">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const statusTabs = [
    { key: '', label: 'Все', count: counts.total },
    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: counts[k] })),
  ];

  return (
    <div className="page-content ed-page ed-admin">
      {/* ═══ Header ═══ */}
      <div className="ld-header">
        <div className="ld-header-left">
          <h1 className="ld-header-title">Заявки</h1>
          <p className="ld-header-sub">{counts.total} всего · {counts.new} новых</p>
        </div>
        <div className="ld-header-actions">
          <div className="ld-view-toggle">
            <button className={`ld-view-btn ${viewMode === 'table' ? 'ld-view-btn--active' : ''}`} onClick={() => setViewMode('table')} title="Таблица"><SList /></button>
            <button className={`ld-view-btn ${viewMode === 'kanban' ? 'ld-view-btn--active' : ''}`} onClick={() => setViewMode('kanban')} title="Канбан"><SColumns /></button>
          </div>
          <button className="ld-btn ld-btn--outline"><SExport /> Экспорт</button>
          <button className="ld-btn ld-btn--primary" onClick={() => setShowCreate(true)}><SPlus /> Новая заявка</button>
        </div>
      </div>

      {/* ═══ Status Tabs ═══ */}
      <div className="ld-tabs">
        {statusTabs.map(t => (
          <button key={t.key} className={`ld-tab ${statusTab === t.key ? 'ld-tab--active' : ''}`}
            onClick={() => setStatusTab(t.key)}>
            {t.label}
            <span className="ld-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ Filters ═══ */}
      <div className="ld-filters">
        <div className="ld-search">
          <SSearch />
          <input type="text" placeholder="Поиск по имени, телефону..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="ld-search-clear" onClick={() => setSearch('')}><SClose /></button>}
        </div>
        <div className="ld-filter-select">
          <select value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">Все курсы</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <SChevronDown />
        </div>
        <div className="ld-filter-select">
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="">Все источники</option>
            <option value="manual">Вручную</option>
            <option value="web">Сайт</option>
            <option value="telegram">Telegram</option>
          </select>
          <SChevronDown />
        </div>
        <button className="ld-btn ld-btn--icon" title="Фильтры"><SFilter /></button>
      </div>

      {/* ════════ TABLE VIEW ════════ */}
      {viewMode === 'table' && (
        <div className="ld-table-wrap">
          <table className="ld-table">
            <thead>
              <tr>
                <th className="ld-th ld-th-sort" onClick={() => toggleSort('name')}>Клиент <SortIcon col="name" /></th>
                <th className="ld-th">Контакты</th>
                <th className="ld-th">Курс</th>
                <th className="ld-th ld-th-sort" onClick={() => toggleSort('source')}>Источник <SortIcon col="source" /></th>
                <th className="ld-th">Статус</th>
                <th className="ld-th ld-th-sort" onClick={() => toggleSort('created_at')}>Дата <SortIcon col="created_at" /></th>
                <th className="ld-th" style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 && (
                <tr><td colSpan={7}><div className="ld-empty"><div className="ld-empty-icon"><SFilter /></div><p>Заявки не найдены</p></div></td></tr>
              )}
              {sortedLeads.map(l => (
                <tr key={l.id} className="ld-tr" onClick={() => setSelectedLead(l)}>
                  <td>
                    <div className="ld-cell-name">
                      <div className="ld-avatar" style={{ background: `hsl(${l.id * 37 % 360}, 55%, 50%)` }}>
                        {l.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="ld-name">{l.name}</div>
                        {l.email && <div className="ld-email">{l.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td><div className="ld-phone">{l.phone}</div></td>
                  <td><div className="ld-course">{l.course?.title || '—'}</div></td>
                  <td><div className="ld-source">{SOURCE_ICONS[l.source] || '📝'} {SOURCE_LABELS[l.source] || l.source}</div></td>
                  <td>
                    <select className="ld-status-select" value={l.status}
                      style={{ background: STATUS_CONFIG[l.status]?.bg, color: STATUS_CONFIG[l.status]?.color, borderColor: STATUS_CONFIG[l.status]?.color + '40' }}
                      onChange={e => { e.stopPropagation(); updateStatus(l.id, e.target.value); }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td><div className="ld-date">{new Date(l.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div></td>
                  <td>
                    <div className="ld-row-actions" onClick={e => e.stopPropagation()}>
                      <button className="ld-row-btn" title="Позвонить"><SPhone /></button>
                      <button className="ld-row-btn" title="Написать"><SChat /></button>
                      <button className="ld-row-btn" title="Конвертировать" onClick={() => convertLead(l.id)} disabled={l.status !== 'contacted'}><SUserPlus /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════ KANBAN VIEW ════════ */}
      {viewMode === 'kanban' && (
        <div className="ld-kanban">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const items = leads.filter(l => l.status === status);
            return (
              <div key={status} className="ld-kanban-col">
                <div className="ld-kanban-header" style={{ borderTopColor: cfg.color }}>
                  <div className="ld-kanban-title">
                    <span className="ld-kanban-dot" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </div>
                  <span className="ld-kanban-count">{items.length}</span>
                </div>
                <div className="ld-kanban-body">
                  {items.length === 0 && <div className="ld-kanban-empty">Нет заявок</div>}
                  {items.map(l => (
                    <div key={l.id} className="ld-kanban-card" onClick={() => setSelectedLead(l)}>
                      <div className="ld-kanban-card-top">
                        <div className="ld-avatar ld-avatar--sm" style={{ background: `hsl(${l.id * 37 % 360}, 55%, 50%)` }}>
                          {l.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ld-kanban-card-name">{l.name}</div>
                      </div>
                      <div className="ld-kanban-card-phone">{l.phone}</div>
                      {l.course && <div className="ld-kanban-card-course">{l.course.title}</div>}
                      <div className="ld-kanban-card-footer">
                        <span className="ld-kanban-card-source">{SOURCE_ICONS[l.source] || '📝'}</span>
                        <span className="ld-kanban-card-date">{new Date(l.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ LEAD DETAIL — portal-based centered modal ════════ */}
      <Modal
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Карточка заявки"
        width={460}
      >
        {selectedLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#fff',
                  background: `hsl(${selectedLead.id * 37 % 360}, 55%, 50%)`,
                }}
              >
                {selectedLead.name.charAt(0).toUpperCase()}
              </div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{selectedLead.name}</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Статус</span>
              <select
                className="ld-status-select ld-status-select--lg"
                value={selectedLead.status}
                style={{
                  background: STATUS_CONFIG[selectedLead.status]?.bg,
                  color: STATUS_CONFIG[selectedLead.status]?.color,
                  borderColor: STATUS_CONFIG[selectedLead.status]?.color + '40',
                }}
                onChange={e => updateStatus(selectedLead.id, e.target.value)}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'grid', rowGap: 10 }}>
              <Row label="Телефон">
                <a href={`tel:${selectedLead.phone}`} style={{ color: 'var(--blue-500, #3b82f6)' }}>{selectedLead.phone}</a>
              </Row>
              {selectedLead.email && (
                <Row label="Email">
                  <a href={`mailto:${selectedLead.email}`} style={{ color: 'var(--blue-500, #3b82f6)' }}>{selectedLead.email}</a>
                </Row>
              )}
              <Row label="Курс">{selectedLead.course?.title || '—'}</Row>
              <Row label="Источник">
                {SOURCE_ICONS[selectedLead.source] || '📝'} {SOURCE_LABELS[selectedLead.source] || selectedLead.source}
              </Row>
              <Row label="Создана">{new Date(selectedLead.created_at).toLocaleString('ru-RU')}</Row>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Заметки</div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {selectedLead.notes || 'Нет заметок'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                className="ld-btn ld-btn--primary ld-btn--block"
                onClick={() => { window.location.href = `tel:${selectedLead.phone}`; }}
              >
                <SPhone /> Позвонить
              </button>
              <button
                className="ld-btn ld-btn--outline ld-btn--block"
                onClick={() => convertLead(selectedLead.id)}
                disabled={selectedLead.status !== 'contacted'}
              >
                <SUserPlus /> Конвертировать в студента
              </button>
              <button
                className="ld-btn ld-btn--outline ld-btn--block"
                style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => deleteLead(selectedLead.id)}
              >
                Удалить заявку
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════════ CREATE MODAL ════════ */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Новая заявка"
        width={480}
        footer={
          <>
            <button type="button" className="ld-btn ld-btn--outline" onClick={() => setShowCreate(false)}>Отмена</button>
            <button type="submit" form="lead-create-form" className="ld-btn ld-btn--primary" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
          </>
        }
      >
        <form id="lead-create-form" onSubmit={handleCreate}>
          <label className="ld-field">
            <span>Имя и фамилия</span>
            <input className="ld-input" name="name" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Петров" required />
          </label>
          <label className="ld-field">
            <span>Телефон</span>
            <input className="ld-input" name="phone" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" required />
          </label>
          <label className="ld-field">
            <span>Курс</span>
            <select className="ld-input" value={createForm.course_id} onChange={e => setCreateForm(p => ({ ...p, course_id: e.target.value }))}>
              <option value="">— Не выбран —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className="ld-field">
            <span>Источник</span>
            <select className="ld-input" value={createForm.source} onChange={e => setCreateForm(p => ({ ...p, source: e.target.value }))}>
              <option value="manual">Вручную</option>
              <option value="web">Сайт</option>
              <option value="telegram">Telegram</option>
            </select>
          </label>
          <label className="ld-field">
            <span>Заметки</span>
            <textarea className="ld-input" rows={3} value={createForm.notes} onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))} placeholder="Дополнительная информация..." />
          </label>
        </form>
      </Modal>
    </div>
  );
}
