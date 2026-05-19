import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const s = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%)',
    padding: 20, position: 'relative', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: '-15%', left: '-8%', width: 400, height: 400,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,202,240,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDots: {
    position: 'absolute', inset: 0, opacity: 0.03,
    backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    pointerEvents: 'none',
  },
  backBtn: {
    position: 'absolute', top: 28, left: 32, display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)',
    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
    color: '#475569', fontSize: 13, fontWeight: 500, textDecoration: 'none',
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 44px', width: 420,
    maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    position: 'relative', zIndex: 1,
  },
  logo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32,
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff',
    fontSize: 20, fontWeight: 800, fontFamily: 'Outfit, sans-serif',
  },
  logoText: { fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px', color: '#0f172a' },
  logoAccent: { background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 1.5, marginTop: -12 },
  inputGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' },
  input: {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#0f172a',
    transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  inputFocus: { borderColor: '#2563eb', boxShadow: '0 0 0 4px rgba(37,99,235,0.08)', background: '#fff' },
  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginTop: -12, marginBottom: 22 },
  forgotLink: { fontSize: 12, color: '#64748b', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' },
  submitBtn: {
    width: '100%', padding: '14px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.25s', fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0',
    color: '#94a3b8', fontSize: 12, fontWeight: 500,
  },
  dividerLine: { flex: 1, height: 1, background: '#e2e8f0' },
  socialRow: { display: 'flex', gap: 10 },
  socialBtn: (color, bg) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px', borderRadius: 12, border: '1.5px solid #e2e8f0',
    background: bg || '#fff', color: color || '#334155', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  }),
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' },
  footerLink: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
};

export default function Login() {
  const { user, login } = useAuth();
  const { add } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);

  if (user) {
    const target = user.role === 'admin' || user.role === 'super_admin' ? '/admin/dashboard' : user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      add('Успешный вход!', 'success');
      const target = u.role === 'admin' || u.role === 'super_admin' ? '/admin/dashboard' : u.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
      navigate(target);
    } catch {
      add('Ошибка входа. Проверьте email и пароль.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.bgCircle1} />
      <div style={s.bgCircle2} />
      <div style={s.bgDots} />

      <a href="https://tiluser.uz" style={s.backBtn}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Вернуться на сайт
      </a>

      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>T</div>
          <div style={s.logoText}>TIL <span style={s.logoAccent}>USER</span></div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Вход в кабинет</h2>
        <p style={s.subtitle}>Войдите в систему управления обучением</p>

        <form onSubmit={handleSubmit}>
          <div style={s.inputGroup}>
            <label style={s.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" required
              style={{ ...s.input, ...(focused === 'email' ? s.inputFocus : {}) }}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ ...s.input, ...(focused === 'password' ? s.inputFocus : {}) }}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
          </div>

          <div style={s.forgotRow}>
            <a href="#" style={s.forgotLink}
              onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              onClick={e => { e.preventDefault(); add('Функция восстановления пароля в разработке', 'info'); }}>
              Забыли пароль?
            </a>
          </div>

          <button type="submit" disabled={busy}
            style={s.submitBtn}
            onMouseEnter={e => { if (!busy) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}>
            {busy ? 'Входим...' : 'Войти в кабинет'}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span>или</span>
          <span style={s.dividerLine} />
        </div>

        <div style={s.socialRow}>
          <button style={s.socialBtn('#ea4335', '#fff')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ea4335'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
            onClick={() => add('Вход через Google скоро будет доступен', 'info')}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#4285f4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#34a853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button style={s.socialBtn('#1e88e5', '#fff')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e88e5'; e.currentTarget.style.background = '#e3f2fd'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
            onClick={() => add('Вход через Telegram скоро будет доступен', 'info')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e88e5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </button>
        </div>

        <div style={s.footer}>
          Нет аккаунта?{' '}
          <Link to="/register" style={s.footerLink}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}