import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/api/teacher/dashboard/${user?.id}`).then(({ data }) => setStats(data)).catch(() => {});
  }, [user?.id]);

  return (
    <div className="page-content">
      <h1>📊 Мой кабинет</h1>
      <div className="kpi-grid">
        {[
          ['👨‍🎓', 'Студентов', stats?.total_students ?? '—'],
          ['👥', 'Групп', stats?.total_groups ?? '—'],
          ['📝', 'ДЗ на проверке', stats?.pending_homeworks ?? '—'],
        ].map(([icon, label, value]) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon green">{icon}</div>
            <div className="kpi-info">
              <h3>{label}</h3>
              <div className="kpi-value">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
