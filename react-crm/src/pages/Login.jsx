import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const ico = {
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  arrowL: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><polyline points="22,4 12,13 2,4"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  google: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#4285f4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#34a853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  telegram: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1e88e5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export default function Login() {
  const { user, login } = useAuth();
  const { add } = useToast();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (user) {
    const target = user.role === 'admin' || user.role === 'super_admin' ? '/admin/dashboard' : user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      add && add('Успешный вход!', 'success');
      const target = u.role === 'admin' || u.role === 'super_admin' ? '/admin/dashboard' : u.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
      navigate(target);
    } catch {
      add && add('Ошибка входа. Проверьте email и пароль.', 'error');
    } finally { setBusy(false); }
  };

  const today = new Date();
  const issueNum = `№${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(-2)}`;
  const clockStr = time.toTimeString().slice(0, 5);

  const tickerItems = ['Языковая школа', 'TilUser', 'Управление обучением', 'Est. 2024', 'Tashkent · UZ', 'Единая платформа', 'Учёба · работа · аналитика'];

  return (
    <div className="ed-login">
      {/* ═══════════════ LEFT: Hero ═══════════════ */}
      <div className="ed-login-left">
        <div className="ed-login-masthead">
          <div>
            <span>TILUSER · JOURNAL</span>
            <span className="ed-login-sep" />
            <span>{issueNum}</span>
          </div>
          <div>
            <span className="ed-login-live" /> LIVE · {clockStr}
          </div>
        </div>

        <button onClick={() => window.location.href = 'https://tiluser.org'} className="ed-login-back">
          {ico.arrowL} <span>На сайт</span>
        </button>

        <div className="ed-login-hero">
          <div className="ed-login-eyebrow">— Welcome / sign in</div>
          <h1 className="ed-login-headline">
            Личный<br />
            <em>кабинет</em><span className="ed-login-dot" />
          </h1>
          <p className="ed-login-lead">
            Войдите чтобы продолжить работу. Курсы, расписание, задания — всё в одном пространстве.
          </p>
        </div>

        <div className="ed-login-marquee">
          <div className="ed-login-marquee-track">
            <span>{tickerItems.map((t, i) => (
              <span key={`a-${i}`}>{t}<span className="ed-login-marquee-dot" /></span>
            ))}</span>
            <span aria-hidden="true">{tickerItems.map((t, i) => (
              <span key={`b-${i}`}>{t}<span className="ed-login-marquee-dot" /></span>
            ))}</span>
          </div>
        </div>

        <div className="ed-login-colophon">
          <span>{today.getDate()} {MONTHS[today.getMonth()]} {today.getFullYear()}</span>
          <span>TilUser — vol. {today.getFullYear() - 2024}</span>
        </div>
      </div>

      {/* ═══════════════ RIGHT: Form ═══════════════ */}
      <div className="ed-login-right">
        <button
          type="button"
          onClick={toggleTheme}
          className="ed-login-theme"
          aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          <span className="ed-login-theme-icon">
            {theme === 'dark' ? ico.sun : ico.moon}
          </span>
          <span className="ed-login-theme-label">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <div className="ed-login-form-wrap">
          <div className="ed-login-form-head">
            <div className="ed-login-eyebrow ed-login-eyebrow--dark">— Sign in / 01</div>
            <h2 className="ed-login-form-title">
              Войти в <em>кабинет</em>
            </h2>
            <p className="ed-login-form-lead">
              Войдите в систему управления обучением
            </p>
          </div>

          <form onSubmit={handleSubmit} className="ed-login-form">
            <div className="ed-login-field">
              <label className="ed-login-label">
                <span>{ico.mail}</span> Email
              </label>
              <input
                className="ed-login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email" />
            </div>

            <div className="ed-login-field">
              <label className="ed-login-label">
                <span>{ico.lock}</span> Пароль
              </label>
              <div className="ed-login-input-wrap">
                <input
                  className="ed-login-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password" />
                <button type="button" className="ed-login-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? ico.eyeOff : ico.eye}
                </button>
              </div>
            </div>

            <div className="ed-login-forgot">
              <Link to="/forgot-password">Забыли пароль? →</Link>
            </div>

            <button type="submit" disabled={busy} className="ed-login-submit">
              {busy ? (
                <span className="ed-login-spinner" />
              ) : (
                <>Войти {ico.arrow}</>
              )}
            </button>
          </form>

          <div className="ed-login-divider">
            <span>или продолжить через</span>
          </div>

          <div className="ed-login-social">
            <button className="ed-login-social-btn" onClick={() => add && add('Скоро будет доступно', 'info')}>
              {ico.google} Google
            </button>
            <button className="ed-login-social-btn" onClick={() => add && add('Скоро будет доступно', 'info')}>
              {ico.telegram} Telegram
            </button>
          </div>

          <div className="ed-login-footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
