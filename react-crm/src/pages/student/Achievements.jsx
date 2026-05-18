import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ZapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const AwardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);
const CrownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const achievementIcons = ['🔥','⭐','💎','🏆','🎯','📚','🎨','🧠','💪','🌟'];

export default function Achievements() {
  const { user } = useAuth();
  const { add } = useToast();
  const [data, setData] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get(`/api/student/${user?.id}/achievements`).then(({ data }) => setData(data)).catch(() => {});
  }, [user?.id]);

  const checkAchievements = async () => {
    setChecking(true);
    try {
      const { data: result } = await api.post(`/api/student/${user?.id}/achievements/check`);
      if (add) add(result?.message || `Получено ${result?.awarded ?? 0} новых достижений!`, 'success');
      const { data: fresh } = await api.get(`/api/student/${user?.id}/achievements`);
      setData(fresh);
    } catch { if (add) add('Ошибка проверки достижений', 'error'); }
    finally { setChecking(false); }
  };

  const achievements = data?.achievements || [];
  const earned = achievements.filter(a => a.earned);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Достижения</h1>
          <p>{earned.length} из {achievements.length} получено</p>
        </div>
        <div className="page-header-right">
          <button className="tg-btn tg-btn--primary" onClick={checkAchievements} disabled={checking}
            style={{ fontSize: 12, padding: '8px 16px' }}>
            <RefreshIcon /> {checking ? 'Проверка...' : 'Проверить'}
          </button>
        </div>
      </div>

      {data && (
        <div className="kpi-grid" style={{ marginBottom: 28 }}>
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-wrap purple"><ZapIcon /></div>
            </div>
            <div className="kpi-info"><h3>Всего XP</h3><div className="kpi-value">{data.total_xp ?? 0}</div></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-wrap blue"><AwardIcon /></div>
            </div>
            <div className="kpi-info"><h3>Получено</h3><div className="kpi-value">{data.earned_count ?? 0}/{data.total_count ?? 0}</div></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-wrap yellow"><CrownIcon /></div>
            </div>
            <div className="kpi-info"><h3>Ранг</h3><div className="kpi-value">#{data.rank ?? '—'}</div></div>
          </div>
        </div>
      )}

      {achievements.length === 0 ? (
        <div className="tg-empty" style={{ marginTop: 20 }}>
          <div className="tg-empty-title">Нет достижений</div>
          <div className="tg-empty-desc">Достижения появятся по мере обучения</div>
        </div>
      ) : (
        <div className="tg-cards">
          {achievements.map((a, i) => (
            <div key={i} className="tg-card" style={{ opacity: a.earned ? 1 : 0.5 }}>
              <div className="tg-card-header">
                <div className="tg-card-icon" style={{
                  background: a.earned ? 'var(--accent-gradient)' : 'var(--border)',
                  fontSize: 18
                }}>
                  {achievementIcons[i % achievementIcons.length]}
                </div>
                <div>
                  <div className="tg-card-title">{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
                </div>
                {a.earned ? (
                  <span className="tg-badge tg-badge--green"><span className="tg-badge-dot" /> Получено</span>
                ) : (
                  <span className="tg-badge tg-badge--gray"><span className="tg-badge-dot" /> {a.xp_reward} XP</span>
                )}
              </div>
              <div className="tg-card-footer">
                <div className="tg-muted">{a.earned ? new Date(a.earned_at).toLocaleDateString() : 'Ещё не получено'}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>+{a.xp_reward} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
