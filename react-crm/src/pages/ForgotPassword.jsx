import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

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
  title: { textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 1.5, marginTop: 8 },
  inputGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' },
  input: {
    width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#0f172a',
    transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  inputFocus: { borderColor: '#2563eb', boxShadow: '0 0 0 4px rgba(37,99,235,0.08)', background: '#fff' },
  submitBtn: {
    width: '100%', padding: '14px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.25s', fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
  },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' },
  footerLink: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },

  /* ── Success State ── */
  successIconWrap: {
    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
  },
  successTitle: { textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 },
  successText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 6 },
  successEmail: {
    textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#2563eb',
    background: '#eff6ff', borderRadius: 8, padding: '8px 14px', display: 'inline-block',
    margin: '0 auto 16px',
  },
};

export default function ForgotPassword() {
  const { add } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Пользователь с таким email не найден';
      if (add) add(detail, 'error');
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

        {sent ? (
          <>
            <div style={s.successIconWrap}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 style={s.successTitle}>Ссылка отправлена!</h2>
            <p style={s.successText}>
              Мы отправили письмо со ссылкой для сброса пароля на адрес:
            </p>
            <div style={s.successEmail}>{email}</div>
            <p style={s.successText}>
              Письмо должно прийти в течение нескольких минут. Если вы не видите его, проверьте папку «Спам».
            </p>
            <div style={s.footer}>
              <Link to="/login" style={s.footerLink}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                ← Вернуться ко входу
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 style={s.title}>Забыли пароль?</h2>
            <p style={s.subtitle}>
              Введите email, на который зарегистрирован аккаунт. Мы отправим ссылку для сброса пароля.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={s.inputGroup}>
                <label style={s.label}>Email</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com" required
                  style={{ ...s.input, ...(focused === 'email' ? s.inputFocus : {}) }}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)} />
              </div>

              <button type="submit" disabled={busy || !email.trim()}
                style={{ ...s.submitBtn, opacity: busy || !email.trim() ? 0.5 : 1 }}
                onMouseEnter={e => { if (!busy && email.trim()) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}>
                {busy ? 'Отправка...' : 'Отправить ссылку для сброса'}
              </button>
            </form>

            <div style={s.footer}>
              <Link to="/login" style={s.footerLink}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                ← Вернуться ко входу
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}