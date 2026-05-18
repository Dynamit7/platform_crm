import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── SVG Icons ── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);
const CheckIcon = ({ read }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={read ? 'var(--blue-400)' : 'var(--muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const DocIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

/* ── Helpers ── */
const ROLE_LABELS = { admin: 'Админ', teacher: 'Преподаватель', student: 'Студент' };
const avatarColors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#4f46e5','#be185d'];
const avatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];
const initials = (name) => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const timeStr = (dt) => dt ? dt.slice(11, 16) : '';
const dateStr = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return timeStr(dt);
  if (diff === 1) return 'Вчера';
  if (diff < 7) return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
};

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','💪','🖕','❤️','🧡','💛','💚','💙','💜','🖤','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🌟','⭐','🔥','💯','🎉','🎊','🎈','🎁','🏆','✅','❌','❓','❗','💡','📚','📝','🎯','🚀','💎','👑','🌈','⚡','🎵','🎶','💬','🗨️','👋','🤚','🖐️','✋','🫡'];

/* ── Components ── */
function ChatContact({ c, active, onClick }) {
  return (
    <div className={`ch-contact ${active ? 'ch-contact--active' : ''}`} onClick={onClick}>
      <div className="ch-av" style={{ background: avatarColor(c.user_id) }}>{initials(c.name)}</div>
      <div className="ch-contact-info">
        <div className="ch-contact-top">
          <span className="ch-contact-name">{c.name}</span>
          <span className="ch-contact-time">{c.last_time ? dateStr(c.last_time) : ''}</span>
        </div>
        <div className="ch-contact-bottom">
          <span className="ch-contact-preview">{c.last_message || 'Нет сообщений'}</span>
          {c.unread > 0 && <span className="ch-badge">{c.unread > 99 ? '99+' : c.unread}</span>}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, isMine }) {
  const [showReactions, setShowReactions] = useState(false);
  const hasFile = m.file_url;
  const isImage = m.file_type === 'image';

  return (
    <div className={`ch-msg ${isMine ? 'ch-msg--mine' : 'ch-msg--other'}`}>
      {!isMine && (
        <div className="ch-msg-av" style={{ background: avatarColor(m.sender_id) }}>
          {initials(m.sender_name)}
        </div>
      )}
      <div className="ch-msg-body">
        {hasFile && isImage && (
          <div className="ch-msg-img">
            <img src={m.file_url} alt={m.file_name || ''} loading="lazy" />
          </div>
        )}
        {hasFile && !isImage && (
          <div className="ch-msg-file">
            <div className="ch-msg-file-icon"><DocIcon /></div>
            <div className="ch-msg-file-info">
              <span className="ch-msg-file-name">{m.file_name || 'Файл'}</span>
              <span className="ch-msg-file-size">{formatFileSize(m.file_size)}</span>
            </div>
          </div>
        )}
        {m.content && <div className="ch-msg-text">{m.content}</div>}
        <div className="ch-msg-meta">
          <span className="ch-msg-time">{timeStr(m.created_at)}</span>
          {isMine && <span className="ch-msg-read"><CheckIcon read={m.is_read} /></span>}
        </div>
        <button className="ch-msg-reaction-btn" onClick={() => setShowReactions(!showReactions)}>😀</button>
        {showReactions && (
          <div className="ch-msg-reactions" onMouseLeave={() => setShowReactions(false)}>
            {['❤️','😂','👍','🔥','😮','😢','🙏'].map(r => (
              <button key={r} className="ch-react" onClick={() => setShowReactions(false)}>{r}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  return (
    <div className="ch-date-sep">
      <span>{date}</span>
    </div>
  );
}

function EmojiPicker({ onSelect }) {
  const [searchEmoji, setSearchEmoji] = useState('');
  const filtered = searchEmoji ? EMOJIS.filter(e => e.includes(searchEmoji)) : EMOJIS;
  return (
    <div className="ch-emoji-picker" onClick={e => e.stopPropagation()}>
      <div className="ch-emoji-search">
        <input type="text" placeholder="Поиск..." value={searchEmoji} onChange={e => setSearchEmoji(e.target.value)} />
      </div>
      <div className="ch-emoji-grid">
        {filtered.map((emoji, i) => (
          <button key={i} className="ch-emoji-item" onClick={() => { onSelect(emoji); setSearchEmoji(''); }}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ChatPage() {
  const { contacts, activeChat, messages, typingUsers, loadContacts, openChat, sendMessage, sendTyping, uploadFile, searchUsers } = useChat();
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
  const fileInput = useRef(null);
  const msgEndRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await searchUsers(searchQuery)); } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !attachedFile) return;
    let fileData = null;
    if (attachedFile) {
      setUploading(true);
      try { fileData = await uploadFile(attachedFile); } catch { if (add) add('Ошибка загрузки файла', 'error'); setUploading(false); return; }
      setUploading(false);
    }
    sendMessage(input.trim(), fileData?.file_url, fileData?.file_type, fileData?.file_name);
    setInput('');
    setAttachedFile(null);
  }, [input, attachedFile, sendMessage, uploadFile, add]);

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

  const groupedContacts = contacts.reduce((acc, c) => {
    const role = c.role || 'student';
    if (!acc[role]) acc[role] = [];
    acc[role].push(c);
    return acc;
  }, {});

  const filteredContacts = tab === 'all' ? contacts
    : tab === 'groups' ? contacts.filter(c => c.role === 'group')
    : contacts.filter(c => c.role !== 'group');

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  const activeContact = contacts.find(c => c.user_id === activeChat?.userId);

  return (
    <div className="ch-page">
      {/* ─── Sidebar ─── */}
      <div className="ch-sidebar">
        <div className="ch-sb-hdr">
          <div className="ch-sb-hdr-top">
            <h2>Сообщения</h2>
            <button className="ch-btn-icon" onClick={() => setShowModal(true)} title="Новый чат"><EditIcon /></button>
          </div>
          <div className="ch-sb-search">
            <SearchIcon />
            <input type="text" placeholder="Поиск..." />
          </div>
        </div>
        <div className="ch-sb-tabs">
          <button className={`ch-sb-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            Все {totalUnread > 0 && <span className="ch-badge ch-badge--sm">{totalUnread}</span>}
          </button>
          <button className={`ch-sb-tab ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>Личные</button>
          <button className={`ch-sb-tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Группы</button>
        </div>
        <div className="ch-sb-list">
          {filteredContacts.length === 0 && (
            <div className="ch-sb-empty">
              <div className="ch-sb-empty-text">{tab === 'groups' ? 'Нет групповых чатов' : 'Нет контактов'}</div>
            </div>
          )}
          {filteredContacts.map(c => (
            <ChatContact key={c.user_id} c={c} active={activeChat?.userId === c.user_id}
              onClick={() => openChat(c.user_id, c.name, c.role)} />
          ))}
        </div>
      </div>

      {/* ─── Main Chat ─── */}
      <div className="ch-main">
        {activeChat ? (
          <>
            <div className="ch-main-hdr">
              <div className="ch-main-hdr-left">
                <div className="ch-av ch-av--sm" style={{ background: avatarColor(activeChat.userId) }}>
                  {initials(activeChat.name)}
                </div>
                <div>
                  <div className="ch-main-hdr-name">{activeChat.name}</div>
                  <div className="ch-main-hdr-status">
                    {typingUsers[activeChat.userId] ? (
                      <span className="ch-typing-indicator">печатает<span className="ch-typing-dots"><span>.</span><span>.</span><span>.</span></span></span>
                    ) : (
                      <span className="ch-main-hdr-role">{ROLE_LABELS[activeChat.role] || activeChat.role}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ch-main-hdr-right">
                <button className="ch-btn-icon" title="Видеозвонок"><VideoIcon /></button>
                <button className="ch-btn-icon" title="Звонок"><PhoneIcon /></button>
                <button className={`ch-btn-icon ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)} title="Информация"><InfoIcon /></button>
              </div>
            </div>
            <div className="ch-msgs" onClick={() => setShowEmoji(false)}>
              {messages.map((m, i) => {
                const showDate = i === 0 || (m.created_at?.slice(0, 10) !== messages[i - 1]?.created_at?.slice(0, 10));
                return (
                  <div key={m.id}>
                    {showDate && <DateSeparator date={new Date(m.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />}
                    <MessageBubble m={m} isMine={m.sender_id === user?.id} />
                  </div>
                );
              })}
              {typingUsers[activeChat.userId] && (
                <div className="ch-typing-bubble">
                  <div className="ch-typing-dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
            <div className="ch-input-area">
              {attachedFile && (
                <div className="ch-attach-preview">
                  {attachedFile.type?.startsWith('image/') ? (
                    <img src={URL.createObjectURL(attachedFile)} alt="preview" />
                  ) : (
                    <div className="ch-attach-file-info">
                      <FileIcon />
                      <span>{attachedFile.name}</span>
                    </div>
                  )}
                  <button className="ch-attach-remove" onClick={() => setAttachedFile(null)}><CloseIcon /></button>
                </div>
              )}
              <div className="ch-input-row">
                <button className="ch-btn-icon" onClick={() => fileInput.current?.click()} title="Прикрепить файл">
                  <AttachIcon />
                </button>
                <input ref={fileInput} type="file" hidden onChange={handleAttach} />
                <button className={`ch-btn-icon ${showEmoji ? 'active' : ''}`} onClick={() => setShowEmoji(!showEmoji)} title="Emoji">
                  <EmojiIcon />
                </button>
                <div className="ch-input-wrap">
                  <textarea className="ch-input" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown} placeholder="Написать сообщение..."
                    rows={1} onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }} />
                </div>
                <button className="ch-send-btn" onClick={handleSend} disabled={(!input.trim() && !attachedFile) || uploading}>
                  {uploading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <SendIcon />}
                </button>
              </div>
              {showEmoji && <EmojiPicker onSelect={(emoji) => { setInput(prev => prev + emoji); setShowEmoji(false); }} />}
            </div>
          </>
        ) : (
          <div className="ch-empty">
            <div className="ch-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Выберите чат</h3>
            <p>Выберите собеседника слева или начните новый диалог</p>
            <button className="ch-btn-primary" onClick={() => setShowModal(true)}>
              <EditIcon /> Новый чат
            </button>
          </div>
        )}
      </div>

      {/* ─── Info Panel ─── */}
      {activeChat && showInfo && (
        <div className="ch-info">
          <div className="ch-info-hdr">
            <h3>Информация</h3>
            <button className="ch-btn-icon" onClick={() => setShowInfo(false)}><CloseIcon /></button>
          </div>
          <div className="ch-info-avatar">
            <div className="ch-av ch-av--lg" style={{ background: avatarColor(activeChat.userId) }}>
              {initials(activeChat.name)}
            </div>
            <div className="ch-info-name">{activeChat.name}</div>
            <div className="ch-info-role">{ROLE_LABELS[activeChat.role] || activeChat.role}</div>
          </div>
          <div className="ch-info-actions">
            <button className="ch-info-action"><PhoneIcon /><span>Звонок</span></button>
            <button className="ch-info-action"><VideoIcon /><span>Видео</span></button>
            <button className="ch-info-action"><PinIcon /><span>Закрепить</span></button>
            <button className="ch-info-action"><BellIcon /><span>Уведомления</span></button>
          </div>
          {activeContact && (
            <div className="ch-info-section">
              <div className="ch-info-section-title">О пользователе</div>
              <div className="ch-info-row">
                <span>Роль</span>
                <span>{ROLE_LABELS[activeContact.role] || activeContact.role}</span>
              </div>
              <div className="ch-info-row">
                <span>Email</span>
                <span>{activeContact.email || '—'}</span>
              </div>
              <div className="ch-info-row">
                <span>Телефон</span>
                <span>{activeContact.phone || '—'}</span>
              </div>
            </div>
          )}
          <div className="ch-info-section">
            <div className="ch-info-section-title">Общие медиа</div>
            <div className="ch-info-media">
              {messages.filter(m => m.file_url && m.file_type === 'image').slice(0, 6).map((m, i) => (
                <div key={i} className="ch-info-media-item">
                  <img src={m.file_url} alt="" />
                </div>
              ))}
              {messages.filter(m => m.file_url && m.file_type === 'image').length === 0 && (
                <div className="ch-info-empty">Нет общих медиа</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── New Chat Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3>Новый чат</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            <div className="modal-search">
              <div className="ch-sb-search" style={{ margin: 0 }}>
                <SearchIcon />
                <input type="text" placeholder="Поиск по имени..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal-results">
              {searching ? <div className="modal-empty"><div className="spinner" /></div>
                : searchResults.length === 0 && searchQuery.trim()
                  ? <div className="modal-empty">Ничего не найдено</div>
                  : searchResults.map(u => (
                    <div key={u.id} className="modal-user" onClick={() => startChat(u.id, u.name, u.role)}>
                      <div className="ch-av" style={{ background: avatarColor(u.id) }}>{initials(u.name)}</div>
                      <div className="c-info">
                        <div className="c-name">
                          {u.name}
                          <span className="ch-role-tag">{ROLE_LABELS[u.role] || u.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              {!searchQuery.trim() && <div className="modal-empty">Введите имя для поиска</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
