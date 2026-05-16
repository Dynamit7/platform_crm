import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/dashboard/${user?.id}`).then(({ data }) => setData(data)).catch(() => {});
  }, [user?.id]);

  const pendingHomeworks = data?.homeworks?.filter(h => !h.is_submitted).length ?? '—';
  const enrolledCourses = data?.enrollments?.length ?? '—';

  return (
    <div className="page-content">
      <h1>📊 Дашборд</h1>
      <div className="kpi-grid">
        {[
          ['📚', 'Мои курсы', enrolledCourses],
          ['📝', 'ДЗ', pendingHomeworks],
          ['🏆', 'XP', data?.stats?.xp ?? '—'],
        ].map(([icon, label, value]) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon blue">{icon}</div>
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
