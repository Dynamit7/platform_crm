import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="page-content">
      <h1>📊 Панель управления</h1>
      <div className="kpi-grid">
        {[
          ['👨‍🎓', 'Студентов', stats?.total_students ?? '—'],
          ['💰', 'Доход в месяц', stats?.monthly_revenue ?? '—'],
          ['🎯', 'Новых заявок', stats?.today_leads ?? '—'],
          ['👥', 'Групп', stats?.active_groups ?? '—'],
        ].map(([icon, label, value]) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon blue">{icon}</div>
            <div className="kpi-info">
              <h3>{label}</h3>
              <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
