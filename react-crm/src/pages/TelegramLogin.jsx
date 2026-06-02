import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function TelegramLogin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = params.get('t');
    if (!token) {
      setStatus('error');
      setErrorMsg('В ссылке нет токена.');
      return;
    }
    (async () => {
      try {
        const { data } = await api.post('/api/auth/redeem-link', { token });
        sessionStorage.setItem('access_token', data.access_token);
        sessionStorage.setItem('refresh_token', data.refresh_token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        const role = data.user?.role;
        const target =
          role === 'admin' || role === 'super_admin' ? '/admin/dashboard'
            : role === 'teacher' ? '/teacher/dashboard'
            : '/dashboard';
        navigate(target, { replace: true });
      } catch (e) {
        setStatus('error');
        setErrorMsg(e?.response?.data?.detail || 'Ссылка недействительна или просрочена.');
      }
    })();
  }, [params, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0a0e1a)',
      color: 'var(--text, #f5f7fa)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: 24,
    }}>
      {status === 'loading' ? (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite', marginBottom: 18,
          }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Входим в кабинет…</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--muted, #9ca3af)', fontSize: 13 }}>
            Один момент, проверяем ссылку из Telegram.
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 38, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Не удалось войти</h2>
          <p style={{ margin: '8px 0 18px', color: 'var(--muted, #9ca3af)', fontSize: 13, textAlign: 'center', maxWidth: 360 }}>
            {errorMsg}
          </p>
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff',
            fontSize: 13, fontWeight: 600,
          }}>На страницу входа</button>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
