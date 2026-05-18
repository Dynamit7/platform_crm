import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, avg: 0, count_5: 0, count_4: 0, count_3: 0 });

  useEffect(() => {
    api.get('/api/reviews').then(({ data }) => {
      setReviews(data);
      const nums = data.map(r => r.rating);
      setStats({
        total: data.length,
        avg: nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0,
        count_5: nums.filter(n => n === 5).length,
        count_4: nums.filter(n => n === 4).length,
        count_3: nums.filter(n => n <= 3).length,
      });
    }).catch(() => {});
  }, []);

  const stars = (n) => {
    const full = '★'.repeat(n) + '☆'.repeat(5 - n);
    return full;
  };

  const maxCount = Math.max(stats.count_5, stats.count_4, stats.count_3, 1);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Отзывы</h1>
          <p>Всего отзывов: {stats.total}</p>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="panel" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stats.avg}
            </div>
            <div style={{ fontSize: 20, color: '#f59e0b', marginTop: 4 }}>{'★'.repeat(Math.round(stats.avg))}{'☆'.repeat(5 - Math.round(stats.avg))}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>средний рейтинг</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[5, 4, 3].map(n => {
              const count = n === 5 ? stats.count_5 : n === 4 ? stats.count_4 : stats.count_3;
              const pct = (count / maxCount) * 100;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 30 }}>{n} ★</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: n >= 4 ? 'var(--success)' : '#f59e0b', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', width: 30, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Студент</th><th>Отзыв</th><th>Рейтинг</th><th>Дата</th></tr></thead>
            <tbody>
              {reviews.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Нет отзывов</td></tr>}
              {reviews.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.student_name}</strong></td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 300 }}>{r.text}</td>
                  <td style={{ color: '#f59e0b', fontSize: 16 }}>{stars(r.rating)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
