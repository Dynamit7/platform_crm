import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const s = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%)',
    padding: 20, position: 'relative', overflow: 'hidden',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 44px', width: 420,
    maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    position: 'relative', zIndex: 1,
  },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff',
    fontSize: 20, fontWeight: 800, fontFamily: 'Outfit, sans-serif',
  },
  logoText: { fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px', color: '#0f172a' },
  logoAccent: { background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  title: { textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 1.5, marginTop: 8 },
  inputGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' },
  input: {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#0f172a',
    transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%', padding: '14px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.25s', fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
  },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' },
  footerLink: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
};

export default function ResetPassword() {
  const { add } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    const e = searchParams.get('email');
    if (t) setToken(t);
    if (e) setEmail(e);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      if (add) add('Пароли не совпадают', 'error');
      return;
    }
    if (password.length < 6) {
      if (add) add('Пароль должен быть минимум 6 символов', 'error');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
      if (add) add('Пароль успешно изменён!', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Ошибка сброса пароля';
      if (add) add(detail, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.logo}>
            <div style={s.logoIcon}>T</div>
            <div style={s.logoText}>TIL <span style={s.logoAccent}>USER</span></div>
          </div>
          <h2 style={s.title}>Неверная ссылка</h2>
          <p style={s.subtitle}>Ссылка для сброса пароля отсутствует или повреждена.</p>
          <div style={s.footer}>
            <Link to="/login" style={s.footerLink}>← Вернуться ко входу</Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.logo}>
            <div style={s.logoIcon}>T</div>
            <div style={s.logoText}>TIL <span style={s.logoAccent}>USER</span></div>
          </div>
          <h2 style={s.title}>Пароль изменён</h2>
          <p style={s.subtitle}>Теперь вы можете войти с новым паролем.</p>
          <div style={s.footer}>
            <Link to="/login" style={s.footerLink}>← Перейти ко входу</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>T</div>
          <div style={s.logoText}>TIL <span style={s.logoAccent}>USER</span></div>
        </div>
        <h2 style={s.title}>Сброс пароля</h2>
        <p style={s.subtitle}>Введите новый пароль для аккаунта {email && <strong>{email}</strong>}</p>
        <form onSubmit={handleSubmit}>
          <div style={s.inputGroup}>
            <label style={s.label}>Новый пароль</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов" required minLength={6}
              style={s.input} />
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>Подтвердите пароль</label>
            <input type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Повторите пароль" required
              style={s.input} />
          </div>
          <button type="submit" disabled={busy || !password || !confirm}
            style={{ ...s.submitBtn, opacity: busy || !password || !confirm ? 0.5 : 1 }}>
            {busy ? 'Сохранение...' : 'Сохранить новый пароль'}
          </button>
        </form>
        <div style={s.footer}>
          <Link to="/login" style={s.footerLink}>← Вернуться ко входу</Link>
        </div>
      </div>
    </div>
  );
}
