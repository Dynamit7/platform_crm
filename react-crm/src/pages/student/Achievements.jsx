import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ico = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

const EMOJIS = ['🏆','⭐','💎','🔥','🎯','📚','🎨','🧠','💪','🌟','🚀','✨','👑','🏅','🌈'];

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'earned', label: 'Получено' },
  { key: 'locked', label: 'Заблокировано' },
];

export default function Achievements() {
  const { user } = useAuth();
  const { add } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/student/${user?.id}/achievements`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const checkAchievements = async () => {
    setChecking(true);
    try {
      const { data: result } = await api.post(`/api/student/${user?.id}/achievements/check`);
      add && add(result?.message || `Получено ${result?.awarded ?? 0} новых достижений!`, 'success');
      const { data: fresh } = await api.get(`/api/student/${user?.id}/achievements`);
      setData(fresh);
    } catch { add && add('Ошибка проверки достижений', 'error'); }
    finally { setChecking(false); }
  };

  const achievements = data?.achievements || [];
  const earned = achievements.filter(a => a.earned);
  const progress = achievements.length ? Math.round((earned.length / achievements.length) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'earned') return achievements.filter(a => a.earned);
    if (filter === 'locked') return achievements.filter(a => !a.earned);
    return achievements;
  }, [achievements, filter]);

  if (loading) return (
    <div className="ed-page">
      <div className="ed-loading">
        <div className="ed-spinner" />
        <div className="ed-loading-text">Распаковываем трофеи…</div>
      </div>
    </div>
  );

  return (
    <div className="ed-page">
      <div className="ed-masthead">
        <div className="ed-masthead-l">
          <span>STUDENT JOURNAL</span>
          <span className="ed-masthead-sep" />
          <span>SECTION 05 / ACHIEVEMENTS</span>
        </div>
        <div className="ed-masthead-c"><span className="ed-masthead-logo">TilUser</span></div>
        <div className="ed-masthead-r"><span>{earned.length} / {achievements.length}</span></div>
      </div>

      <div className="ed-page-head">
        <div className="ed-page-eyebrow">— Trophies / 05</div>
        <h1 className="ed-page-title"><em>Достижения</em>.</h1>
        <p className="ed-page-lead">Виртуальная стена наград. Каждая медаль — заметка о вашем пути. Соберите коллекцию.</p>
      </div>

      {/* Hero progress */}
      <section className="ed-section">
        <div className="ed-bento" style={{ gridAutoRows: 'auto' }}>
          <div className="ed-tile ed-tile--w8 ed-tile--ink" style={{ padding: '34px 38px' }}>
            <div>
              <div className="ed-tile-label">Коллекция · прогресс</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8, marginBottom: 22 }}>
                <div className="ed-tile-num" style={{ color: '#b8f04b' }}><em>{earned.length}</em></div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 36, color: 'rgba(246,240,226,0.55)', letterSpacing: '-0.03em' }}>/ {achievements.length}</div>
              </div>
              <div style={{ height: 8, background: 'rgba(246,240,226,0.1)', borderRadius: 100, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  width: `${progress}%`, height: '100%',
                  background: 'linear-gradient(90deg, #b8f04b, #5b3df5)',
                  borderRadius: 100,
                  transition: 'width 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.55)' }}>
                <span>0%</span><span>{progress}% completed</span><span>100%</span>
              </div>
            </div>
          </div>

          <div className="ed-tile ed-tile--w4 ed-tile--lime" style={{ padding: '34px 32px' }}>
            <div>
              <div className="ed-tile-label">Всего XP</div>
              <div className="ed-tile-num"><em>{(data?.total_xp ?? 0) > 999 ? `${((data?.total_xp ?? 0) / 1000).toFixed(1)}k` : (data?.total_xp ?? 0)}</em></div>
              <div className="ed-tile-caption">очков опыта</div>
            </div>
            <div className="ed-tile-foot">
              <span>ранг #{data?.rank ?? '—'}</span>
              <span>🔥 {data?.streak_days ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="ed-toolbar">
        <div className="ed-pills">
          {FILTERS.map(f => (
            <button key={f.key} className={`ed-pill ${filter === f.key ? 'ed-pill--active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="ed-btn ed-btn--sm" onClick={checkAchievements} disabled={checking}>
            {ico.refresh} {checking ? 'Проверка…' : 'Обновить'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ed-empty">
          <div className="ed-empty-eyebrow">— No medals —</div>
          <div className="ed-empty-title">{filter === 'earned' ? 'Стена\nпустует' : filter === 'locked' ? 'Все награды\nполучены!' : 'Награды\nещё впереди'}</div>
          <div className="ed-empty-desc">{filter === 'earned' ? 'Посещайте уроки и выполняйте задания, чтобы получать награды' : filter === 'locked' ? 'Невероятно! Вы собрали полную коллекцию.' : 'Достижения появятся по мере обучения'}</div>
        </div>
      ) : (
        <section className="ed-section">
          <div className="ed-sec-head">
            <div>
              <span className="ed-sec-num">02 ——</span>
              <span className="ed-sec-title"><em>Коллекция</em></span>
            </div>
          </div>
          <div className="ed-ach-grid">
            {filtered.map((a, i) => (
              <div key={a.id || i} className={`ed-ach ${a.earned ? '' : 'ed-ach--locked'}`}>
                <div className="ed-ach-emoji">{EMOJIS[(a.title?.length || i) % EMOJIS.length]}</div>
                <div className="ed-ach-title">{a.title}</div>
                <div className="ed-ach-desc">{a.description || ' '}</div>
                {a.earned ? (
                  <span className="ed-tag ed-tag--lime">✓ {a.earned_at ? new Date(a.earned_at).toLocaleDateString('ru-RU') : 'Получено'}</span>
                ) : (
                  <span className="ed-ach-reward">+{a.xp_reward || 0} XP</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
