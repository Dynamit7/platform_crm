import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Premium portal-based Modal.
 *
 * Renders into document.body — escapes any ancestor with
 * transform/filter/backdrop-filter/contain/will-change that would otherwise
 * break `position: fixed`. Centered horizontally, slightly above center
 * vertically (Linear / Stripe pattern).
 *
 * Props:
 *   open         boolean      — render gate
 *   onClose      () => void   — called on backdrop click / Esc / close button
 *   title        string       — header text (optional)
 *   width        number|string — modal width in px or any CSS value (default 480)
 *   children     React node   — modal body
 *   footer       React node   — optional sticky footer (buttons row)
 *   hideClose    boolean      — hide the × button in the header
 *   closeOnBackdrop boolean   — default true
 *   closeOnEsc      boolean   — default true
 */
export default function Modal({
  open,
  onClose,
  title,
  width = 480,
  children,
  footer,
  hideClose = false,
  closeOnBackdrop = true,
  closeOnEsc = true,
}) {
  // Body scroll lock + Esc handler.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (closeOnEsc && e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(8, 10, 18, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',          // top-aligned with padding for premium feel
        justifyContent: 'center',
        paddingTop: 'min(12vh, 100px)',
        paddingBottom: '24px',
        paddingLeft: '16px',
        paddingRight: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        animation: 'modal-fade-in 0.18s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '100%',
          background: 'var(--surface, #fff)',
          color: 'var(--text, #1a1a2e)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border, rgba(255,255,255,0.06))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45), 0 4px 14px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 24vh)',
          overflow: 'hidden',
          animation: 'modal-pop-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {(title || !hideClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
              flexShrink: 0,
            }}
          >
            <h3
              id="modal-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {!hideClose && (
              <button
                type="button"
                onClick={() => onClose?.()}
                aria-label="Закрыть"
                style={{
                  width: 32,
                  height: 32,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  color: 'var(--muted, #aaa)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-color, rgba(255,255,255,0.05))';
                  e.currentTarget.style.color = 'var(--text, #fff)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--muted, #aaa)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '14px 22px',
              borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
