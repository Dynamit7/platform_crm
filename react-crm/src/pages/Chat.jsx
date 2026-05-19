import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ─── Inline Style Helpers ─── */
const s = {
  page: {
    display: 'flex', height: '100%', overflow: 'hidden',
    background: 'var(--bg)',
  },

  /* ══════ SIDEBAR ══════ */
  sidebar: {
    width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderRight: '1px solid var(--border)', background: 'var(--surface)',
  },
  sbHeader: {
    padding: '22px 20px 14px', borderBottom: '1px solid var(--border)',
  },
  sbTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sbTitle: {
    fontSize: 21, fontWeight: 700, margin: 0, letterSpacing: '-0.4px',
    color: 'var(--text)',
  },
  connStatus: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
    fontSize: 11, fontWeight: 500,
  },
  connDot: (online) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: online ? '#22c55e' : '#ef4444',
    flexShrink: 0,
  }),
  sbNewBtn: {
    width: 38, height: 38, border: 'none', borderRadius: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-gradient)', color: '#fff',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 10px rgba(37,99,235,0.2)',
  },
  searchWrap: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute', left: 12, top: '50%', marginTop: -8,
    color: 'var(--muted)', pointerEvents: 'none', display: 'flex', zIndex: 1,
  },
  searchInput: {
    width: '100%', padding: '9px 14px 9px 38px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  /* ── Tabs ── */
  tabsWrap: {
    padding: '0 16px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', position: 'relative',
  },
  tabsInner: {
    display: 'flex', gap: 0, position: 'relative',
  },
  tab: (active) => ({
    flex: 1, padding: '12px 8px 10px', border: 'none',
    fontSize: 13, fontWeight: active ? 600 : 500,
    cursor: 'pointer', fontFamily: 'inherit',
    color: active ? 'var(--text)' : 'var(--muted)',
    background: 'transparent', transition: 'color 0.2s',
    position: 'relative', whiteSpace: 'nowrap',
  }),
  tabActiveLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5,
    background: 'var(--accent-gradient)', borderRadius: '2px 2px 0 0',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabUnread: {
    marginLeft: 5, minWidth: 17, height: 17, borderRadius: 9,
    padding: '0 4px', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 9, fontWeight: 700,
    color: '#fff', background: 'var(--blue-500)',
    verticalAlign: 'middle',
  },

  /* ── Contact List ── */
  sbList: { flex: 1, overflowY: 'auto', padding: '4px 0' },
  sbSection: {
    padding: '14px 20px 6px', fontSize: 11, fontWeight: 600,
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  contact: (active) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 20px', cursor: 'pointer',
    transition: 'background 0.15s',
    background: active ? 'var(--accent-gradient-soft)' : 'transparent',
    borderLeft: '3px solid',
    borderColor: active ? 'var(--blue-500)' : 'transparent',
  }),
  contactAv: (color) => ({
    width: 48, height: 48, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 700, fontSize: 15, flexShrink: 0, background: color,
    position: 'relative',
  }),
  contactOnline: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
    borderRadius: '50%', background: '#22c55e',
    border: '2px solid var(--surface)',
  },
  contactInfo: { flex: 1, minWidth: 0 },
  contactTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  contactRole: {
    fontSize: 10, color: 'var(--muted)', fontWeight: 500,
    background: 'var(--bg)', padding: '1px 6px', borderRadius: 4,
    marginLeft: 6, whiteSpace: 'nowrap',
  },
  contactTime: {
    fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap',
    marginLeft: 8, flexShrink: 0,
  },
  contactBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
  },
  contactPreview: {
    fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.4,
  },
  contactPreviewBold: {
    fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.4,
    fontWeight: 600,
  },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, padding: '0 6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
    background: 'var(--blue-500)',
    boxShadow: '0 2px 6px rgba(59,130,246,0.3)',
  },
  pinSmall: {
    width: 12, height: 12, color: 'var(--muted)', flexShrink: 0,
    marginRight: 3, verticalAlign: 'middle',
  },

  /* ══════ EMPTY STATE ══════ */
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    padding: 40, color: 'var(--muted)',
  },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: '50%',
    background: 'var(--accent-gradient-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--blue-400)', marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 22, fontWeight: 700, color: 'var(--text)',
    margin: 0, letterSpacing: '-0.3px',
  },
  emptySub: {
    fontSize: 13.5, color: 'var(--muted)', margin: 0,
    textAlign: 'center', maxWidth: 280, lineHeight: 1.6,
  },
  emptyBtn: {
    marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 26px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    background: 'var(--accent-gradient)', color: '#fff',
    boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
    transition: 'all 0.2s',
  },

  /* ══════ MAIN CHAT ══════ */
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', minWidth: 0 },
  mainHdr: {
    padding: '12px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', flexShrink: 0, height: 64,
  },
  mainHdrLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1, minWidth: 0 },
  mainHdrAv: (color) => ({
    width: 42, height: 42, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 700, fontSize: 15, flexShrink: 0, background: color,
  }),
  mainHdrInfo: { minWidth: 0 },
  mainHdrName: {
    fontSize: 15, fontWeight: 600, color: 'var(--text)',
    lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  mainHdrStatus: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.3 },
  mainHdrActions: { display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 },
  hdrBtn: {
    width: 36, height: 36, border: 'none', borderRadius: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', color: 'var(--text-secondary)',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },

  /* ── Messages ── */
  msgsArea: {
    flex: 1, overflowY: 'auto', padding: '20px 28px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  dateSep: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '18px 0 14px', position: 'relative',
  },
  dateSepBg: {
    display: 'inline-flex', padding: '4px 14px', borderRadius: 20,
    background: 'var(--surface)', fontSize: 11, fontWeight: 600,
    color: 'var(--muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  msgRow: (isMine) => ({
    display: 'flex', alignItems: 'flex-end', gap: 8,
    justifyContent: isMine ? 'flex-end' : 'flex-start',
    marginBottom: 3,
  }),
  msgAv: (color) => ({
    width: 28, height: 28, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 600, fontSize: 10, flexShrink: 0, background: color,
    marginBottom: 2,
  }),
  msgBubble: (isMine, hasFile, isImage) => ({
    maxWidth: '68%',
    padding: hasFile && isImage ? 0 : '9px 14px',
    paddingTop: hasFile && !isImage ? '6px' : '9px',
    borderRadius: isMine ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
    background: isMine ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--surface)',
    color: isMine ? '#fff' : 'var(--text)',
    boxShadow: isMine
      ? '0 2px 8px rgba(37,99,235,0.18)'
      : '0 1px 3px rgba(0,0,0,0.05)',
    position: 'relative',
    lineHeight: 1.45,
  }),
  msgText: {
    fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  msgMeta: {
    display: 'flex', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', marginTop: 5,
  },
  msgTime: (isMine) => ({
    fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
  }),
  msgReadIcon: { width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  /* ── Voice Message ── */
  voiceMsg: {
    display: 'flex', alignItems: 'center', gap: 10,
    minWidth: 180, maxWidth: 240, padding: '4px 0',
    cursor: 'pointer',
  },
  voicePlayBtn: {
    width: 32, height: 32, borderRadius: '50%', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  voiceWave: {
    flex: 1, height: 28, display: 'flex', alignItems: 'center', gap: 1.5,
  },
  voiceBar: (active, isMine) => ({
    width: 3, borderRadius: 2,
    background: active
      ? (isMine ? 'rgba(255,255,255,0.9)' : 'var(--blue-500)')
      : (isMine ? 'rgba(255,255,255,0.35)' : 'var(--border)'),
    transition: 'height 0.15s, background 0.15s',
  }),
  voiceDuration: (isMine) => ({
    fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
    whiteSpace: 'nowrap',
  }),

  /* ── Image Message ── */
  msgImg: {
    borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
    maxWidth: 260, display: 'block',
  },
  msgImgCaption: {
    padding: '8px 14px 4px', fontSize: 13, lineHeight: 1.5,
  },

  /* ── File Message ── */
  msgFile: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 10,
    background: 'rgba(0,0,0,0.03)', marginBottom: 4,
  },
  msgFileIcon: {
    width: 36, height: 36, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(59,130,246,0.1)',
    color: 'var(--blue-500)', flexShrink: 0,
  },
  msgFileInfo: { flex: 1, minWidth: 0 },
  msgFileName: {
    fontSize: 12, fontWeight: 600, color: 'var(--text)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  msgFileSize: { fontSize: 10, color: 'var(--muted)' },

  /* ── Typing ── */
  typingBubble: {
    padding: '12px 18px', borderRadius: '16px 16px 16px 3px',
    background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    alignSelf: 'flex-start',
    display: 'flex', alignItems: 'center', gap: 3, marginTop: 4,
  },
  typingDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)',
  },

  /* ══════ INPUT AREA ══════ */
  inputArea: {
    borderTop: '1px solid var(--border)', background: 'var(--surface)',
    padding: '10px 20px 14px', flexShrink: 0,
  },
  attachPreview: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', marginBottom: 8,
    borderRadius: 10, background: 'var(--bg)', position: 'relative',
  },
  attachPreviewImg: { width: 44, height: 44, borderRadius: 8, objectFit: 'cover' },
  attachPreviewName: { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' },
  attachRemove: {
    position: 'absolute', top: -7, right: -7, width: 20, height: 20,
    borderRadius: '50%', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--blue-500)', color: '#fff', fontSize: 9,
    boxShadow: '0 2px 6px rgba(59,130,246,0.3)',
  },
  inputRow: {
    display: 'flex', alignItems: 'flex-end', gap: 6,
    background: 'var(--bg)', borderRadius: 12,
    padding: '5px 4px 5px 2px',
    border: '1.5px solid var(--border)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputActions: { display: 'flex', alignItems: 'center', gap: 0 },
  inputBtn: {
    width: 34, height: 34, border: 'none', borderRadius: 9, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', color: 'var(--text-secondary)',
    transition: 'all 0.15s', flexShrink: 0, fontFamily: 'inherit',
  },
  inputBtnActive: {
    width: 34, height: 34, border: 'none', borderRadius: 9, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', flexShrink: 0,
    background: 'var(--surface)', color: 'var(--blue-500)',
    transition: 'all 0.15s',
  },
  textarea: {
    flex: 1, border: 'none', padding: '7px 4px', fontSize: 13.5,
    fontFamily: 'inherit', background: 'transparent', color: 'var(--text)',
    outline: 'none', resize: 'none', maxHeight: 100, lineHeight: 1.5,
  },
  sendBtn: (hasContent) => ({
    width: 38, height: 38, border: 'none', borderRadius: 10,
    cursor: hasContent ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontFamily: 'inherit',
    background: hasContent ? 'var(--accent-gradient)' : 'var(--border)',
    color: hasContent ? '#fff' : 'var(--muted)',
    transition: 'all 0.2s',
    boxShadow: hasContent ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
  }),

  /* ── Mic Button ── */
  micBtn: (recording) => ({
    width: 38, height: 38, border: 'none', borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: recording ? '#ef4444' : 'transparent',
    color: recording ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
    boxShadow: recording ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none',
    fontFamily: 'inherit',
  }),

  /* ── Emoji Picker ── */
  emojiPicker: {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
    width: 304, height: 270, borderRadius: 14,
    background: 'var(--surface)', border: '1px solid var(--border)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100,
  },
  emojiSearch: { padding: 8, borderBottom: '1px solid var(--border)' },
  emojiSearchInput: {
    width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 12, background: 'var(--bg)',
    color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  emojiGrid: {
    flex: 1, overflowY: 'auto', padding: 8,
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3,
  },
  emojiItem: {
    width: '100%', aspectRatio: 1, border: 'none', borderRadius: 8,
    cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'transparent',
    transition: 'background 0.1s', fontFamily: 'inherit', padding: 0,
  },

  /* ══════ INFO PANEL ══════ */
  info: {
    width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
    borderLeft: '1px solid var(--border)', background: 'var(--surface)',
    overflow: 'hidden',
  },
  infoHdr: {
    padding: '16px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
    height: 64, boxSizing: 'border-box',
  },
  infoHdrTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 },
  infoBody: { flex: 1, overflowY: 'auto', padding: '24px 20px' },

  infoAvatar: { textAlign: 'center', marginBottom: 20 },
  infoAv: (color) => ({
    width: 76, height: 76, borderRadius: '50%', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 700, fontSize: 28, background: color, marginBottom: 10,
  }),
  infoName: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  infoRole: {
    fontSize: 13, color: 'var(--muted)', display: 'inline-flex',
    alignItems: 'center', gap: 6,
  },
  infoRoleDot: { width: 7, height: 7, borderRadius: '50%', background: '#22c55e' },

  infoActions: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
    marginBottom: 20, paddingBottom: 20,
    borderBottom: '1px solid var(--border)',
  },
  infoAction: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '10px 4px 8px', border: 'none', borderRadius: 12, cursor: 'pointer',
    background: 'var(--bg)', color: 'var(--text-secondary)',
    transition: 'all 0.15s', fontFamily: 'inherit',
    fontSize: 10, fontWeight: 500,
  },
  infoActionIcon: { color: 'var(--blue-500)' },

  infoSection: { marginBottom: 20 },
  infoSectionTitle: {
    fontSize: 11, fontWeight: 600, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13,
  },
  infoRowLast: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', fontSize: 13,
  },
  infoLabel: { color: 'var(--muted)' },
  infoValue: { color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' },
  infoEmpty: { padding: '14px 0', textAlign: 'center', fontSize: 13, color: 'var(--muted)' },

  /* ── Media Grid ── */
  mediaGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
    borderRadius: 10, overflow: 'hidden',
  },
  mediaItem: { aspectRatio: 1, overflow: 'hidden', cursor: 'pointer' },
  mediaImg: { width: '100%', height: '100%', objectFit: 'cover' },

  /* ── Participants ── */
  participant: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0', borderBottom: '1px solid var(--border)',
  },
  participantAv: (color) => ({
    width: 34, height: 34, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 600, fontSize: 12, flexShrink: 0, background: color,
  }),
  participantInfo: { flex: 1, minWidth: 0 },
  participantName: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  participantRole: { fontSize: 11, color: 'var(--muted)' },

  /* ══════ NEW CHAT MODAL ══════ */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    width: 420, maxHeight: '65vh', borderRadius: 16,
    background: 'var(--surface)', border: '1px solid var(--glass-border)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  modalHdr: {
    padding: '18px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 },
  modalClose: {
    width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', color: 'var(--muted)',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  modalBody: { flex: 1, overflowY: 'auto', padding: 16 },
  modalSearch: {
    marginBottom: 12, position: 'relative', display: 'flex', alignItems: 'center',
  },
  modalSearchIcon: {
    position: 'absolute', left: 12, top: '50%', marginTop: -8,
    color: 'var(--muted)', pointerEvents: 'none', display: 'flex', zIndex: 1,
  },
  modalSearchInput: {
    width: '100%', padding: '10px 14px 10px 38px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, background: 'var(--bg)',
    color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  modalUser: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
    transition: 'background 0.12s',
  },
  modalUserAv: (color) => ({
    width: 40, height: 40, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontWeight: 700, fontSize: 13, flexShrink: 0, background: color,
  }),
  modalUserInfo: {},
  modalUserName: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 },
  modalUserRole: {
    fontSize: 10, fontWeight: 500,
    color: 'var(--muted)', background: 'var(--bg)',
    padding: '2px 7px', borderRadius: 4, marginLeft: 8,
  },
  modalEmpty: { textAlign: 'center', padding: '28px 0', fontSize: 13, color: 'var(--muted)' },

  /* ── Spinner ── */
  spinner: {
    width: 20, height: 20, border: '2px solid var(--border)',
    borderTopColor: 'var(--blue-500)', borderRadius: '50%',
    animation: 'spin 0.6s linear infinite', margin: '0 auto',
  },
};

/* ═══════════════════════ ICONS ═══════════════════════ */
const SSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const SAttach = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const SEmoji = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const SMic = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const SInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const SPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const SClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SCheck = ({ read, isMine }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={read ? (isMine ? '#93c5fd' : '#60a5fa') : (isMine ? 'rgba(255,255,255,0.4)' : 'var(--muted)')}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SCheckDouble = ({ read, isMine }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={read ? (isMine ? '#93c5fd' : '#60a5fa') : (isMine ? 'rgba(255,255,255,0.4)' : 'var(--muted)')}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 7 9 16 4 11"/><polyline points="23 7 14 16 9 11"/>
  </svg>
);
const SPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);
const SBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const SSearchChat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SMore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);
const SChatEmpty = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const SFile = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SPinSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);
const SGroup = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const SPlay = ({ isMine }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={isMine ? '#fff' : 'var(--blue-500)'} stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const SPause = ({ isMine }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={isMine ? '#fff' : 'var(--blue-500)'} stroke="none">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);
const SReadReceipt = ({ read }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={read ? '#60a5fa' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 13 6 17 13 7"/><polyline points="10 13 14 17 21 7"/>
  </svg>
);

/* ═══════════════════════ CONSTANTS ═══════════════════════ */
const ROLE_LABELS = { admin: 'Админ', teacher: 'Преподаватель', student: 'Студент' };
const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#4f46e5','#be185d'];
const avColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

const formatTime = (dt) => dt ? dt.slice(11, 16) : '';
const formatDate = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return formatTime(dt);
  if (diff === 1) return 'Вчера';
  if (diff < 7) return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatMsgDate = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🌟','⭐','🔥','💯','🎉','🎊','🎈','🎁','🏆','✅','❌','❓','❗','💡','📚','📝','🎯','🚀','💎','👑','🌈','⚡','🎵','🎶','💬','🗨️','👋','🤚','🖐️','✋'];

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function VoiceMessage({ isMine, duration, isPlaying, onToggle }) {
  const bars = [8, 14, 10, 20, 12, 16, 8, 18, 10, 14, 12, 8, 16, 10, 18, 12, 8, 14, 10, 16];
  return (
    <div style={s.voiceMsg} onClick={onToggle}>
      <button style={{
        ...s.voicePlayBtn,
        background: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.1)',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = isMine ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = isMine ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.1)'; }}>
        {isPlaying ? <SPause isMine={isMine} /> : <SPlay isMine={isMine} />}
      </button>
      <div style={s.voiceWave}>
        {bars.map((h, i) => (
          <div key={i} style={{
            ...s.voiceBar(isPlaying && i % 3 < 2, isMine),
            height: h,
            animation: isPlaying && i % 3 < 2 ? `voiceWave ${0.45 + (i % 3) * 0.12}s ease-in-out infinite` : 'none',
            animationDelay: isPlaying && i % 3 < 2 ? `${i * 0.04}s` : '0s',
            transformOrigin: 'bottom',
          }} />
        ))}
      </div>
      <span style={s.voiceDuration(isMine)}>{formatDuration(duration || 0)}</span>
    </div>
  );
}

function ChatContact({ c, active, isTyping, onClick }) {
  const isGroup = c.role === 'group';
  return (
    <div style={s.contact(active)} onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.015)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <div style={s.contactAv(isGroup ? '#6366f1' : avColor(c.user_id))}>
        {isGroup ? <SGroup /> : initials(c.name)}
        {c.is_online && !isGroup && <span style={s.contactOnline} />}
      </div>
      <div style={s.contactInfo}>
        <div style={s.contactTop}>
          <span style={s.contactName}>
            {c.name}
            {!isGroup && <span style={s.contactRole}>{ROLE_LABELS[c.role] || c.role}</span>}
          </span>
          <span style={s.contactTime}>{c.last_time ? formatDate(c.last_time) : ''}</span>
        </div>
        <div style={s.contactBottom}>
          {isTyping ? (
            <span style={{ ...s.contactPreview, color: 'var(--blue-500)', fontWeight: 500, fontSize: 12 }}>
              Печатает...
            </span>
          ) : (
            <span style={c.unread > 0 ? s.contactPreviewBold : s.contactPreview}>
              {c.is_pinned && !c.last_message ? <SPinSmall /> : null}
              {c.last_message || (c.is_pinned ? 'Закреплённый чат' : 'Нет сообщений')}
            </span>
          )}
          {c.unread > 0 && <span style={s.badge}>{c.unread > 99 ? '99+' : c.unread}</span>}
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  return (
    <div style={s.dateSep}>
      <span style={s.dateSepBg}>{date}</span>
    </div>
  );
}

function MessageBubble({ m, isMine }) {
  const hasFile = m.file_url;
  const isImage = m.file_type === 'image';
  const isVoice = m.file_type === 'voice';
  const [voicePlaying, setVoicePlaying] = useState(false);
  const hasContent = m.content && m.content.trim();

  return (
    <div style={s.msgRow(isMine)}>
      {!isMine && (
        <div style={s.msgAv(avColor(m.sender_id))}>
          {initials(m.sender_name)}
        </div>
      )}
      <div style={s.msgBubble(isMine, hasFile, isImage)}>
        {hasFile && isImage && (
          <>
            <div style={s.msgImg}>
              <img src={m.file_url} alt={m.file_name || ''} loading="lazy"
                style={{ width: '100%', display: 'block' }} />
            </div>
            {hasContent && <div style={s.msgImgCaption}>{m.content}</div>}
          </>
        )}
        {hasFile && isVoice && (
          <VoiceMessage isMine={isMine} duration={m.file_duration || 12}
            isPlaying={voicePlaying} onToggle={() => setVoicePlaying(!voicePlaying)} />
        )}
        {hasFile && !isImage && !isVoice && (
          <div style={s.msgFile}>
            <div style={s.msgFileIcon}><SFile /></div>
            <div style={s.msgFileInfo}>
              <div style={s.msgFileName}>{m.file_name || 'Файл'}</div>
              <div style={s.msgFileSize}>{formatFileSize(m.file_size)}</div>
            </div>
          </div>
        )}
        {!isImage && hasContent && <div style={s.msgText}>{m.content}</div>}
        <div style={s.msgMeta}>
          <span style={s.msgTime(isMine)}>{m.created_at ? formatTime(m.created_at) : ''}</span>
          {isMine && (m.is_read ? <SCheckDouble read={true} isMine={true} /> : <SCheck read={false} isMine={true} />)}
        </div>
      </div>
    </div>
  );
}

function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search ? EMOJIS.filter(e => e.includes(search)) : EMOJIS;
  return (
    <div style={s.emojiPicker} onClick={e => e.stopPropagation()}>
      <div style={s.emojiSearch}>
        <input type="text" placeholder="Поиск эмодзи..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.emojiSearchInput} autoFocus />
      </div>
      <div style={s.emojiGrid}>
        {filtered.map((emoji, i) => (
          <button key={i} style={s.emojiItem}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => { onSelect(emoji); onClose(); }}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function ChatPage() {
  const { contacts, activeChat, messages, typingUsers, isConnected, loadContacts, openChat, sendMessage, sendTyping, uploadFile, searchUsers } = useChat();
  const { user } = useAuth();
  const { add } = useToast();
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('all');
  const [showInfo, setShowInfo] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [tabIndicator, setTabIndicator] = useState(0);
  const fileInput = useRef(null);
  const msgEndRef = useRef(null);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  const tabsRef = useRef(null);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Draft messages — save/restore per chat
  const draftKey = (uid) => `chat_draft_${uid}`;
  useEffect(() => {
    if (activeChat?.userId) {
      const saved = localStorage.getItem(draftKey(activeChat.userId));
      setInput(saved || '');
    } else {
      setInput('');
    }
    setAttachedFile(null);
    setShowEmoji(false);
    setShowInfo(true);
  }, [activeChat?.userId]);

  // Save draft on input change
  useEffect(() => {
    if (activeChat?.userId && input) {
      localStorage.setItem(draftKey(activeChat.userId), input);
    }
  }, [input, activeChat?.userId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await searchUsers(searchQuery)); } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    const idx = ['all', 'personal', 'groups'].indexOf(tab);
    setTabIndicator(idx);
  }, [tab]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes typingBounce{0%,80%,100%{transform:scaleY(0.6);opacity:0.35}40%{transform:scaleY(1);opacity:1}}@keyframes voiceWave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !attachedFile) return;
    let fileData = null;
    if (attachedFile) {
      setUploading(true);
      try { fileData = await uploadFile(attachedFile); } catch { if (add) add('Ошибка загрузки файла', 'error'); setUploading(false); return; }
      setUploading(false);
    }
    sendMessage(input.trim(), fileData?.file_url, fileData?.file_type, fileData?.file_name);
    if (activeChat?.userId) localStorage.removeItem(draftKey(activeChat.userId));
    setInput('');
    setAttachedFile(null);
  }, [input, attachedFile, activeChat?.userId, sendMessage, uploadFile, add]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); return; }
    clearTimeout(typingTimer.current);
    sendTyping();
    typingTimer.current = setTimeout(() => {}, 1000);
  };

  const handleAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = '';
  };

  const startChat = useCallback(async (userId, name, role) => {
    setShowModal(false);
    setSearchQuery('');
    openChat(userId, name, role);
  }, [openChat]);

  const toggleMic = () => setRecording(!recording);

  const pinned = contacts.filter(c => c.is_pinned);
  const unpinned = contacts.filter(c => !c.is_pinned);

  const filteredPinned = pinned.filter(c =>
    tab === 'all' || (tab === 'personal' && c.role !== 'group') || (tab === 'groups' && c.role === 'group')
  );
  const filteredUnpinned = unpinned.filter(c =>
    tab === 'all' || (tab === 'personal' && c.role !== 'group') || (tab === 'groups' && c.role === 'group')
  );

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);
  const activeContact = contacts.find(c => c.user_id === activeChat?.userId);
  const isTyping = activeChat && typingUsers[activeChat.userId];
  const isGroup = activeChat?.role === 'group';

  const TABS = [
    { key: 'all', label: 'Все', count: totalUnread },
    { key: 'personal', label: 'Личные' },
    { key: 'groups', label: 'Группы' },
  ];

  return (
    <div style={s.page}>
      {/* ════════════ SIDEBAR ════════════ */}
      <div style={s.sidebar}>
        <div style={s.sbHeader}>
          <div style={s.sbTop}>
            <h2 style={s.sbTitle}>Сообщения</h2>
            <button style={s.sbNewBtn}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.2)'; }}
              onClick={() => setShowModal(true)} title="Новый чат">
              <SPlus />
            </button>
          </div>
          <div style={s.connStatus}>
            <span style={s.connDot(isConnected)} />
            <span style={{ color: 'var(--muted)' }}>{isConnected ? 'Подключено' : 'Нет соединения'}</span>
          </div>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}><SSearch /></span>
            <input type="text" placeholder="Поиск по чатам..." style={s.searchInput}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} />
          </div>
        </div>

        {/* ── Pill Tabs ── */}
        <div style={s.tabsWrap}>
          <div style={s.tabsInner}>
            {TABS.map((t, i) => (
              <button key={t.key}
                style={{ ...s.tab(tab === t.key), width: `${100 / TABS.length}%` }}
                onClick={() => setTab(t.key)}>
                {t.label}
                {t.count > 0 && t.key === 'all' && (
                  <span style={s.tabUnread}>{t.count > 99 ? '99+' : t.count}</span>
                )}
              </button>
            ))}
            <div style={{
              ...s.tabActiveLine,
              width: `${100 / TABS.length}%`,
              transform: `translateX(${tabIndicator * 100}%)`,
            }} />
          </div>
        </div>

        {/* ── Contact List ── */}
        <div style={s.sbList}>
          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
              Нет контактов
            </div>
          )}

          {filteredPinned.length > 0 && (
            <>
              <div style={s.sbSection}>Закреплённые</div>
              {filteredPinned.map(c => (
                <ChatContact key={`p-${c.user_id}`} c={c}
                  active={activeChat?.userId === c.user_id}
                  isTyping={typingUsers[c.user_id]}
                  onClick={() => openChat(c.user_id, c.name, c.role)} />
              ))}
            </>
          )}

          {filteredUnpinned.length > 0 && (
            <>
              {filteredPinned.length > 0 && <div style={s.sbSection}>
                {tab === 'groups' ? 'Групповые чаты' : 'Все чаты'}
              </div>}
              {filteredUnpinned.map(c => (
                <ChatContact key={c.user_id} c={c}
                  active={activeChat?.userId === c.user_id}
                  isTyping={typingUsers[c.user_id]}
                  onClick={() => openChat(c.user_id, c.name, c.role)} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ════════════ MAIN CHAT ════════════ */}
      <div style={s.main}>
        {activeChat ? (
          <>
            {/* ── Header ── */}
            <div style={s.mainHdr}>
              <div style={s.mainHdrLeft}>
                <div style={s.mainHdrAv(isGroup ? '#6366f1' : avColor(activeChat.userId))}>
                  {isGroup ? <SGroup /> : initials(activeChat.name)}
                </div>
                <div style={s.mainHdrInfo}>
                  <div style={s.mainHdrName}>{activeChat.name}</div>
                  <div style={s.mainHdrStatus}>
                    {isTyping ? (
                      <span style={{ color: 'var(--blue-500)', fontWeight: 500 }}>Печатает...</span>
                    ) : isGroup ? (
                      <span>{activeContact?.members_count || 0} участников</span>
                    ) : activeContact?.is_online ? (
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>Онлайн</span>
                    ) : (
                      <span>{activeContact?.last_time ? `Был(а) ${formatDate(activeContact.last_time)}` : ROLE_LABELS[activeChat.role] || activeChat.role}</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={s.mainHdrActions}>
                <button style={s.hdrBtn} title="Поиск в чате"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <SSearchChat />
                </button>
                <button style={s.hdrBtn} title="Звонок"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <SPhone />
                </button>
                <button style={s.hdrBtn} title="Видеозвонок"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <SVideo />
                </button>
                <button style={{
                  ...s.hdrBtn, ...(showInfo ? { background: 'var(--bg)', color: 'var(--blue-500)' } : {}),
                }} onClick={() => setShowInfo(!showInfo)} title="Информация"
                  onMouseEnter={e => { if (!showInfo) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; } }}
                  onMouseLeave={e => { if (!showInfo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                  <SInfo />
                </button>
                <button style={s.hdrBtn} title="Ещё"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <SMore />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div style={s.msgsArea} onClick={() => setShowEmoji(false)}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
                  Начните диалог
                </div>
              )}
              {messages.map((m, i) => {
                const showDate = i === 0 || (m.created_at?.slice(0, 10) !== messages[i - 1]?.created_at?.slice(0, 10));
                return (
                  <div key={m.id || i}>
                    {showDate && <DateSeparator date={formatMsgDate(m.created_at)} />}
                    <MessageBubble m={m} isMine={m.sender_id === user?.id} />
                  </div>
                );
              })}
              {isTyping && (
                <div style={s.typingBubble}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ ...s.typingDot, animation: 'typingBounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            {/* ── Input ── */}
            <div style={s.inputArea}>
              {attachedFile && (
                <div style={s.attachPreview}>
                  {attachedFile.type?.startsWith('image/') ? (
                    <img src={URL.createObjectURL(attachedFile)} alt="preview" style={s.attachPreviewImg} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SFile />
                      <span style={s.attachPreviewName}>{attachedFile.name}</span>
                    </div>
                  )}
                  <button style={s.attachRemove} onClick={() => setAttachedFile(null)}><SClose /></button>
                </div>
              )}
              <div style={{
                ...s.inputRow,
                borderColor: inputFocused ? 'var(--blue-500)' : 'var(--border)',
                boxShadow: inputFocused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
              }}>
                <div style={s.inputActions}>
                  <div style={{ position: 'relative' }}>
                    <button style={showEmoji ? s.inputBtnActive : s.inputBtn}
                      onClick={() => setShowEmoji(!showEmoji)} title="Эмодзи"
                      onMouseEnter={e => { if (!showEmoji) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
                      onMouseLeave={e => { if (!showEmoji) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                      <SEmoji />
                    </button>
                    {showEmoji && (
                      <EmojiPicker
                        onSelect={(emoji) => setInput(prev => prev + emoji)}
                        onClose={() => setShowEmoji(false)} />
                    )}
                  </div>
                  <button style={s.inputBtn} onClick={() => fileInput.current?.click()} title="Прикрепить файл"
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <SAttach />
                  </button>
                  <input ref={fileInput} type="file" hidden onChange={handleAttach} />
                </div>
                <textarea ref={inputRef} style={s.textarea} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Написать сообщение..."
                  rows={1}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }} />
                {input.trim() || attachedFile ? (
                  <button style={s.sendBtn(true)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.2)'; }}
                    onClick={handleSend} disabled={uploading}>
                    {uploading ? <div style={s.spinner} /> : <SSend />}
                  </button>
                ) : (
                  <button style={s.micBtn(recording)}
                    onMouseEnter={e => { if (!recording) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
                    onMouseLeave={e => { if (!recording) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                    onClick={toggleMic} title={recording ? 'Остановить запись' : 'Голосовое сообщение'}>
                    <SMic />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── Empty State ── */
          <div style={s.empty}>
            <div style={s.emptyIconWrap}><SChatEmpty /></div>
            <h3 style={s.emptyTitle}>Выберите чат</h3>
            <p style={s.emptySub}>Выберите собеседника слева или начните новый диалог</p>
            <button style={s.emptyBtn}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(37,99,235,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.25)'; }}
              onClick={() => setShowModal(true)}>
              <SPlus /> Новый чат
            </button>
          </div>
        )}
      </div>

      {/* ════════════ INFO PANEL ════════════ */}
      {activeChat && showInfo && (
        <div style={s.info}>
          <div style={s.infoHdr}>
            <h3 style={s.infoHdrTitle}>Информация</h3>
            <button style={{ ...s.hdrBtn, color: 'var(--muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
              onClick={() => setShowInfo(false)}><SClose /></button>
          </div>
          <div style={s.infoBody}>
            {/* ── Avatar ── */}
            <div style={s.infoAvatar}>
              <div style={s.infoAv(isGroup ? '#6366f1' : avColor(activeChat.userId))}>
                {isGroup ? <SGroup /> : initials(activeChat.name)}
              </div>
              <div style={s.infoName}>{activeChat.name}</div>
              <div style={s.infoRole}>
                {!isGroup && activeContact?.is_online && <span style={s.infoRoleDot} />}
                {isGroup ? `${activeContact?.members_count || 0} участников` : (ROLE_LABELS[activeChat.role] || activeChat.role)}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div style={s.infoActions}>
              <button style={s.infoAction}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient-soft)'; e.currentTarget.style.color = 'var(--blue-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <span style={s.infoActionIcon}><SPhone /></span>
                <span>Звонок</span>
              </button>
              <button style={s.infoAction}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient-soft)'; e.currentTarget.style.color = 'var(--blue-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <span style={s.infoActionIcon}><SVideo /></span>
                <span>Видео</span>
              </button>
              <button style={s.infoAction}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient-soft)'; e.currentTarget.style.color = 'var(--blue-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <span style={s.infoActionIcon}><SPin /></span>
                <span>Закрепить</span>
              </button>
              <button style={s.infoAction}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient-soft)'; e.currentTarget.style.color = 'var(--blue-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <span style={s.infoActionIcon}><SBell /></span>
                <span>Увед.</span>
              </button>
            </div>

            {/* ── About ── */}
            {activeContact && (
              <div style={s.infoSection}>
                <div style={s.infoSectionTitle}>О пользователе</div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Роль</span>
                  <span style={s.infoValue}>{ROLE_LABELS[activeContact.role] || activeContact.role}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Email</span>
                  <span style={s.infoValue}>{activeContact.email || '—'}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Телефон</span>
                  <span style={s.infoValue}>{activeContact.phone || '—'}</span>
                </div>
                {activeContact.group && (
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Группа / Курс</span>
                    <span style={s.infoValue}>{activeContact.group}</span>
                  </div>
                )}
                {activeContact.level && (
                  <div style={s.infoRow}>
                    <span style={s.infoLabel}>Уровень</span>
                    <span style={s.infoValue}>{activeContact.level}</span>
                  </div>
                )}
                {activeContact.joined_at && (
                  <div style={s.infoRowLast}>
                    <span style={s.infoLabel}>Присоединился</span>
                    <span style={s.infoValue}>{formatMsgDate(activeContact.joined_at)}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Group Members ── */}
            {isGroup && activeContact?.members?.length > 0 && (
              <div style={s.infoSection}>
                <div style={s.infoSectionTitle}>
                  Участники ({activeContact.members.length})
                </div>
                {activeContact.members.map((m, i) => (
                  <div key={i} style={s.participant}>
                    <div style={s.participantAv(avColor(m.id || i))}>
                      {initials(m.name)}
                    </div>
                    <div style={s.participantInfo}>
                      <div style={s.participantName}>{m.name}</div>
                      <div style={s.participantRole}>{ROLE_LABELS[m.role] || m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Shared Media ── */}
            <div style={s.infoSection}>
              <div style={s.infoSectionTitle}>Общие медиа и файлы</div>
              {messages.filter(m => m.file_url && m.file_type === 'image').length > 0 ? (
                <div style={s.mediaGrid}>
                  {messages.filter(m => m.file_url && m.file_type === 'image').slice(0, 9).map((m, i) => (
                    <div key={i} style={s.mediaItem}>
                      <img src={m.file_url} alt="" style={s.mediaImg} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={s.infoEmpty}>Нет общих медиа</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ NEW CHAT MODAL ════════════ */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHdr}>
              <h3 style={s.modalTitle}>Новый чат</h3>
              <button style={s.modalClose}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
                onClick={() => setShowModal(false)}><SClose /></button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalSearch}>
                <span style={s.modalSearchIcon}><SSearch /></span>
                <input type="text" placeholder="Поиск по имени..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} style={s.modalSearchInput}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  autoFocus />
              </div>
              {searching ? (
                <div style={s.modalEmpty}><div style={s.spinner} /></div>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u.id} style={s.modalUser} onClick={() => startChat(u.id, u.name, u.role)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={s.modalUserAv(avColor(u.id))}>{initials(u.name)}</div>
                    <div style={s.modalUserInfo}>
                      <div style={s.modalUserName}>
                        {u.name}
                        <span style={s.modalUserRole}>{ROLE_LABELS[u.role] || u.role}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchQuery.trim() ? (
                <div style={s.modalEmpty}>Ничего не найдено</div>
              ) : (
                <div style={s.modalEmpty}>Введите имя для поиска</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
