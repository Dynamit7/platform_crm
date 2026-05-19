import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const s = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 25%, #f0f5ff 50%, #ede9fe 75%, #f5f3ff 100%)',
    padding: 20, position: 'relative', overflow: 'hidden',
  },

  /* Decorative orbs */
  orb1: {
    position: 'absolute', top: '-15%', right: '-5%', width: 600, height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0) 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: '-18%', left: '-8%', width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0) 70%)',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute', top: '40%', left: '60%', width: 300, height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0) 70%)',
    pointerEvents: 'none',
  },
  gridPattern: {
    position: 'absolute', inset: 0, opacity: 0.02,
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },

  /* Back button */
  backBtn: {
    position: 'fixed', top: 28, left: 32, zIndex: 10,
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.12)',
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    color: '#475569', fontSize: 13, fontWeight: 500, textDecoration: 'none',
    cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },

  /* Card */
  card: {
    background: '#fff', borderRadius: 28, padding: '52px 48px 48px', width: 440,
    maxWidth: '100%',
    boxShadow: '0 25px 80px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.04)',
    position: 'relative', zIndex: 1,
    border: '1px solid rgba(255,255,255,0.6)',
  },
  cardGlow: {
    position: 'absolute', top: -1, left: '20%', right: '20%', height: 2,
    background: 'linear-gradient(90deg, transparent, #6366f1, #0ea5e9, transparent)',
    borderRadius: '28px 28px 0 0', opacity: 0.4,
    pointerEvents: 'none',
  },

  /* Logo */
  logo: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 28,
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
    color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif',
    marginBottom: 8,
    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
  },
  logoText: {
    fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif',
    letterSpacing: '-0.5px', color: '#0f172a',
  },
  logoAccent: {
    background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },

  /* Title */
  title: {
    textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#0f172a',
    margin: 0, marginBottom: 6,
  },
  subtitle: {
    fontSize: 14, color: '#64748b', textAlign: 'center',
    marginBottom: 32, lineHeight: 1.6,
  },

  /* Inputs */
  inputGroup: { marginBottom: 18 },
  label: {
    display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600, color: '#334155',
  },
  inputWrap: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  input: {
    width: '100%', padding: '14px 16px 14px 44px', border: '1.5px solid #e2e8f0', borderRadius: 14,
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#0f172a',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: '#6366f1', background: '#fff',
    boxShadow: '0 0 0 4px rgba(99,102,241,0.1), 0 1px 3px rgba(0,0,0,0.04)',
  },
  inputIcon: (focused) => ({
    position: 'absolute', left: 14, top: '50%', marginTop: -9,
    color: focused ? '#6366f1' : '#94a3b8',
    transition: 'color 0.25s',
    display: 'flex',
  }),

  /* Forgot */
  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginTop: -10, marginBottom: 22 },
  forgotLink: {
    fontSize: 12.5, color: '#64748b', textDecoration: 'none', cursor: 'pointer',
    transition: 'color 0.2s', fontWeight: 500,
    padding: '4px 0',
  },

  /* Submit button */
  submitBtn: {
    width: '100%', padding: '15px', border: 'none', borderRadius: 14,
    background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
  },
  submitBg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
    opacity: 0, transition: 'opacity 0.3s',
  },

  /* Divider */
  divider: {
    display: 'flex', alignItems: 'center', gap: 16, margin: '26px 0',
    color: '#94a3b8', fontSize: 12, fontWeight: 500,
  },
  dividerLine: { flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)' },

  /* Social */
  socialRow: { display: 'flex', gap: 10 },
  socialBtn: (brand, bg, borderColor) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 8px', borderRadius: 14, border: `1.5px solid ${borderColor || '#e2e8f0'}`,
    background: bg || '#fff', color: '#334155', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'inherit',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  }),

  /* Footer */
  footer: { marginTop: 26, textAlign: 'center', fontSize: 13.5, color: '#94a3b8' },
  footerLink: {
    color: '#6366f1', textDecoration: 'none', fontWeight: 600,
    transition: 'color 0.2s',
  },

  /* Spinner */
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.6s linear infinite', margin: '0 auto',
  },
};

function MailIcon({ focused }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? '#6366f1' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><polyline points="22,4 12,13 2,4"/>
    </svg>
  );
}

function LockIcon({ focused }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? '#6366f1' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#4285f4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#34a853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e88e5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const { add } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [socialHover, setSocialHover] = useState(null);

  if (user) {
    const target = user.role === 'admin' || user.role === 'super_admin' ? '/admin/dashboard' : user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      if (add) add('Успешный вход!', 'success');
      const target = u.role === 'admin' || u.role === 'super_admin' ? '/admin/dashboard' : u.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
      navigate(target);
    } catch {
      if (add) add('Ошибка входа. Проверьте email и пароль.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.wrapper}>
      {/* Decorative */}
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />
      <div style={s.gridPattern} />

      {/* Back */}
      <button onClick={() => window.location.href = 'https://tiluser.uz'}
        style={{ ...s.backBtn, background: backHover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)', boxShadow: backHover ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)' }}
        onMouseEnter={() => setBackHover(true)}
        onMouseLeave={() => setBackHover(false)}>
        <span style={{ transform: backHover ? 'translateX(-2px)' : 'none', transition: 'transform 0.25s', display: 'flex' }}><ArrowLeft /></span>
        Вернуться на сайт
      </button>

      {/* Card */}
      <div style={s.card}>
        <div style={s.cardGlow} />

        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoBadge}>T</div>
          <div style={s.logoText}>TIL <span style={s.logoAccent}>USER</span></div>
        </div>

        <h2 style={s.title}>Вход в кабинет</h2>
        <p style={s.subtitle}>Войдите в систему управления обучением</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={s.inputGroup}>
            <label style={s.label}>Email</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon(focused === 'email')}><MailIcon focused={focused === 'email'} /></span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com" required autoComplete="email"
                style={{ ...s.input, ...(focused === 'email' ? s.inputFocus : {}) }}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
            </div>
          </div>

          {/* Password */}
          <div style={s.inputGroup}>
            <label style={s.label}>Пароль</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon(focused === 'password')}><LockIcon focused={focused === 'password'} /></span>
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль" required autoComplete="current-password"
                style={{ ...s.input, paddingRight: 44, ...(focused === 'password' ? s.inputFocus : {}) }}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', marginTop: -12,
                  width: 24, height: 24, border: 'none', borderRadius: 6,
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: focused === 'password' ? '#6366f1' : '#94a3b8', fontSize: 13,
                  transition: 'color 0.25s',
                }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div style={s.forgotRow}>
            <Link to="/forgot-password" style={s.forgotLink}>
              Забыли пароль?
            </Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={busy}
            style={{
              ...s.submitBtn,
              transform: submitHover && !busy ? 'translateY(-2px)' : 'none',
              boxShadow: submitHover && !busy ? '0 8px 28px rgba(99,102,241,0.35)' : '0 4px 16px rgba(99,102,241,0.3)',
              opacity: busy ? 0.7 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={() => setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}>
            <div style={{ ...s.submitBg, opacity: submitHover ? 1 : 0 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              {busy ? <div style={s.spinner} /> : 'Войти в кабинет'}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span>или войти через</span>
          <span style={s.dividerLine} />
        </div>

        {/* Social */}
        <div style={s.socialRow}>
          <button style={s.socialBtn('google', socialHover === 'google' ? '#fef2f2' : '#fff', socialHover === 'google' ? '#ea4335' : '#e2e8f0')}
            onMouseEnter={() => setSocialHover('google')}
            onMouseLeave={() => setSocialHover(null)}
            onClick={() => add('Вход через Google скоро будет доступен', 'info')}>
            <GoogleIcon /> Google
          </button>
          <button style={s.socialBtn('telegram', socialHover === 'telegram' ? '#e3f2fd' : '#fff', socialHover === 'telegram' ? '#1e88e5' : '#e2e8f0')}
            onMouseEnter={() => setSocialHover('telegram')}
            onMouseLeave={() => setSocialHover(null)}
            onClick={() => add('Вход через Telegram скоро будет доступен', 'info')}>
            <TelegramIcon /> Telegram
          </button>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          Нет аккаунта?{' '}
          <Link to="/register" style={s.footerLink}>
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}