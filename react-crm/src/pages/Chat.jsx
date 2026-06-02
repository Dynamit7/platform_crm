import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import './Chat.css';

/* ─── Icons ─── */
const SSearch = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const SPlus = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SSend = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const SAttach = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
const SEmoji = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>);
const SMic = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>);
const SInfo = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);
const SPhone = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const SVideo = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>);
const SClose = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SCheck = ({ read, isMine }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={read ? (isMine ? '#93c5fd' : '#60a5fa') : (isMine ? 'rgba(255,255,255,0.4)' : 'var(--muted)')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const SCheckDouble = ({ read, isMine }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={read ? (isMine ? '#93c5fd' : '#60a5fa') : (isMine ? 'rgba(255,255,255,0.4)' : 'var(--muted)')} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 7 9 16 4 11"/><polyline points="23 7 14 16 9 11"/></svg>);
const SPin = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>);
const SBell = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const SMore = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>);
const SFile = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const SPinSmall = () => (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>);
const SGroup = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);

/* ─── Constants ─── */
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

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🌟','⭐','🔥','💯','🎉','🎊','🎈','🎁','🏆','✅','❌','❓','❗','💡','📚','📝','🎯','🚀','💎','👑','🌈','⚡','🎵','🎶','💬','🗨️','👋','🤚','🖐️','✋'];

const MOCK_MESSAGES = [
  { id: 'm1', sender_id: 2, sender_name: 'Анна М.', content: 'Привет! Как проходит урок?', created_at: '2026-05-19T09:00:00', is_read: true },
  { id: 'm2', sender_id: 1, sender_name: 'Вы', content: 'Всё отлично! Сегодня прошли новую тему по грамматике.', created_at: '2026-05-19T09:02:00', is_read: true },
  { id: 'm3', sender_id: 2, sender_name: 'Анна М.', content: 'Отлично! Студентам нравится?', created_at: '2026-05-19T09:03:00', is_read: true },
  { id: 'm4', sender_id: 1, sender_name: 'Вы', content: 'Да, очень активные сегодня. Особенно Мария — она сделала все упражнения без ошибок!', created_at: '2026-05-19T09:05:00', is_read: true },
  { id: 'm5', sender_id: 2, sender_name: 'Анна М.', content: '', file_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200', file_type: 'image', file_name: 'lesson_photo.jpg', is_read: true, created_at: '2026-05-19T09:08:00' },
  { id: 'm6', sender_id: 1, sender_name: 'Вы', content: 'Красивый класс! Как раз напоминает нашу школу', created_at: '2026-05-19T09:10:00', is_read: true },
  { id: 'm7', sender_id: 2, sender_name: 'Анна М.', content: 'Кстати, напоминаю — завтра собрание в 15:00. Не опаздывай!', created_at: '2026-05-19T09:12:00', is_read: true },
  { id: 'm8', sender_id: 1, sender_name: 'Вы', content: 'Хорошо, буду вовремя! Новые материалы подготовлю к вечеру.', created_at: '2026-05-19T09:15:00', is_read: true },
  { id: 'm9', sender_id: 2, sender_name: 'Анна М.', content: 'Супер 👍 Договорились', created_at: '2026-05-19T09:16:00', is_read: true },
  { id: 'm10', sender_id: 2, sender_name: 'Анна М.', content: 'Кстати, как успехи у нового студента? Адаптировался?', created_at: '2026-05-19T09:18:00', is_read: false },
  { id: 'm11', sender_id: 1, sender_name: 'Вы', content: 'Да, Тимур быстро втянулся. Уже через неделю начал активно отвечать на уроках. Уровень у него хороший — где-то A2.', created_at: '2026-05-19T09:20:00', is_read: false },
  { id: 'm12', sender_id: 2, sender_name: 'Анна М.', content: 'Отлично! Будем ждать его на B1 через пару месяцев 😊', created_at: '2026-05-19T09:22:00', is_read: false },
];

const MOCK_CONTACTS = [
  { user_id: 2, name: 'Анна М.', role: 'teacher', last_message: 'Будем ждать его на B1 через пару месяцев 😊', last_time: '2026-05-19T09:22:00', unread: 3, is_online: true, is_pinned: true, email: 'anna@tiluser.uz', phone: '+998901112233', group: 'Beginner A1', level: 'Intermediate' },
  { user_id: 3, name: 'Елена В.', role: 'teacher', last_message: 'Спасибо за помощь с методичкой!', last_time: '2026-05-18T16:30:00', unread: 0, is_online: false, is_pinned: false, email: 'elena@tiluser.uz', phone: '+998904455667' },
  { user_id: 4, name: 'Марк', role: 'teacher', last_message: 'Новый план урока готов ✅', last_time: '2026-05-18T14:15:00', unread: 1, is_online: false, is_pinned: true, email: 'mark@tiluser.uz', phone: '+998907788990' },
  { user_id: 5, name: 'Самдат', role: 'student', last_message: 'Когда будет следующее занятие?', last_time: '2026-05-17T11:45:00', unread: 0, is_online: true, is_pinned: false, email: 'samat@tiluser.uz', phone: '+998901234578', group: 'Elementary A2', level: 'A2' },
  { user_id: 6, name: 'Н.Умида', role: 'student', last_message: 'Большое спасибо за урок!', last_time: '2026-05-17T10:20:00', unread: 0, is_online: false, is_pinned: false, email: 'nigina@tiluser.uz', phone: '+998905566778', group: 'Elementary A2' },
  { user_id: 7, name: 'Support Team', role: 'group', last_message: 'Обновление расписания на следующую неделю', last_time: '2026-05-16T09:00:00', unread: 0, is_online: false, is_pinned: false, members_count: 5 },
];

const MOCK_USER_INFO = {
  name: 'Анна М.', role_label: 'Преподаватель', email: 'anna@tiluser.uz', phone: '+998901112233',
  group: 'Все группы', level: 'Intermediate', joined_at: '2026-05-19T09:22:00',
  shared_media: [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100',
  ],
};

function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search ? EMOJIS.filter(e => e.includes(search)) : EMOJIS;
  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, width: 304, height: 250, borderRadius: 12, background: 'var(--surface, #fff)', border: '1px solid var(--border, #eef0f5)', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100 }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: 8, borderBottom: '1px solid var(--border, #eef0f5)' }}>
        <input type="text" placeholder="Поиск эмодзи..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border, #eef0f5)', borderRadius: 8, fontSize: 12, background: 'var(--bg-color, #f8f9fc)', color: 'var(--text, #1a1a2e)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} autoFocus />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {filtered.map((emoji, i) => (
          <button key={i} style={{ width: '100%', aspectRatio: 1, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', fontFamily: 'inherit', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color, #f8f9fc)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => { onSelect(emoji); onClose(); }}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { contacts, activeChat, messages, typingUsers, isConnected, loadContacts, openChat, closeChat, sendMessage, sendTyping, uploadFile, searchUsers } = useChat();
  const { user } = useAuth();
  const { add } = useToast();
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('all');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mobileShowContacts, setMobileShowContacts] = useState(true);
  const fileInput = useRef(null);
  const msgEndRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    loadContacts();
    closeChat();
    setMobileShowContacts(true);
  }, [loadContacts, closeChat]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const draftKey = (uid) => `chat_draft_${uid}`;
  useEffect(() => {
    if (activeChat?.userId) {
      const saved = localStorage.getItem(draftKey(activeChat.userId));
      setInput(saved || '');
    } else { setInput(''); }
    setAttachedFile(null);
    setShowEmoji(false);
  }, [activeChat?.userId]);

  useEffect(() => {
    if (activeChat?.userId && input) localStorage.setItem(draftKey(activeChat.userId), input);
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
    const style = document.createElement('style');
    style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes typingPulse{0%,60%,100%{opacity:0.3;transform:scale(0.8)}30%{opacity:1;transform:scale(1.2)}}`;
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
    setMobileShowContacts(false);
  }, [openChat]);

  const handleContactClick = useCallback((userId, name, role) => {
    openChat(userId, name, role);
    setMobileShowContacts(false);
  }, [openChat]);

  const toggleMic = () => setRecording(!recording);

  // Merge real contacts with mock ones
  const displayContacts = useMemo(() => {
    if (contacts.length > 0) return contacts;
    return MOCK_CONTACTS;
  }, [contacts]);

  // Merge real messages with mock ones for display
  const displayMessages = useMemo(() => {
    if (messages.length > 0) return messages;
    return MOCK_MESSAGES;
  }, [messages]);

  const pinned = displayContacts.filter(c => c.is_pinned);
  const unpinned = displayContacts.filter(c => !c.is_pinned);

  const filteredPinned = pinned.filter(c =>
    tab === 'all' || (tab === 'personal' && c.role !== 'group') || (tab === 'groups' && c.role === 'group')
  );
  const filteredUnpinned = unpinned.filter(c =>
    tab === 'all' || (tab === 'personal' && c.role !== 'group') || (tab === 'groups' && c.role === 'group')
  );

  const totalUnread = displayContacts.reduce((s, c) => s + (c.unread || 0), 0);
  const activeContact = displayContacts.find(c => c.user_id === activeChat?.userId);
  const isTyping = activeChat && typingUsers[activeChat.userId];
  const isGroup = activeChat?.role === 'group';

  // Info panel data
  const infoData = activeContact || MOCK_USER_INFO;
  const infoMedia = useMemo(() => {
    const realMedia = displayMessages.filter(m => m.file_url && m.file_type === 'image');
    if (realMedia.length > 0) return realMedia.slice(0, 9).map(m => m.file_url);
    return MOCK_USER_INFO.shared_media;
  }, [displayMessages]);

  const TABS = [
    { key: 'all', label: 'Все', count: totalUnread },
    { key: 'personal', label: 'Личные' },
    { key: 'groups', label: 'Группы' },
  ];

  return (
    <div className={`chat-page ${user?.role ? 'ed-chat' : ''}`}>
      {/* ═══ LEFT COLUMN: Contacts ═══ */}
      <div className={`chat-contacts ${!mobileShowContacts ? 'chat-contacts--mobile-hidden' : ''}`}>
        <div className="chat-contacts-hdr">
          <h2>Сообщения</h2>
          <button onClick={() => setShowModal(true)} title="Новый чат"
            style={{ width: 34, height: 34, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', color: '#fff', flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <SPlus />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 10px', fontSize: 11, fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
          <span style={{ color: 'var(--muted)' }}>{isConnected ? 'Подключено' : 'Нет соединения'}</span>
        </div>

        <div style={{ padding: '0 12px 10px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по чатам..." className="chat-contacts-search-input"
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--bg-color)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--blue-500)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
        </div>

        <div className="chat-contacts-tabs">
          {TABS.map(t => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              {t.label}
              {t.count > 0 && t.key === 'all' && (
                <span style={{ marginLeft: 5, minWidth: 17, height: 17, borderRadius: 9, padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--blue-500)', verticalAlign: 'middle' }}>
                  {t.count > 99 ? '99+' : t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="chat-contacts-list">
          {displayContacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>Нет контактов</div>
          )}
          {filteredPinned.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 6px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Закреплённые</div>
              {filteredPinned.map(c => (
                <div key={`p-${c.user_id}`} className={`contact-item ${activeChat?.userId === c.user_id ? 'active' : ''}`}
                  onClick={() => handleContactClick(c.user_id, c.name, c.role)}
                  style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}>
                  <div className="contact-item-avatar" style={{ background: c.role === 'group' ? '#6366f1' : avColor(c.user_id) }}>
                    {c.role === 'group' ? <SGroup /> : initials(c.name)}
                    {c.is_online && c.role !== 'group' && <span className="online-dot" />}
                  </div>
                  <div className="contact-item-body">
                    <div className="contact-item-top">
                      <span className="contact-item-name">{c.name}</span>
                      <span className="contact-item-time">{c.last_time ? formatDate(c.last_time) : ''}</span>
                    </div>
                    <div className="contact-item-preview" style={{ color: c.unread > 0 ? 'var(--text)' : 'var(--muted)', fontWeight: c.unread > 0 ? 600 : 400 }}>
                      {c.is_pinned && !c.last_message ? <SPinSmall /> : null}
                      {c.last_message || (c.is_pinned ? 'Закреплённый чат' : 'Нет сообщений')}
                    </div>
                  </div>
                  {c.unread > 0 && (
                    <span className="contact-item-unread">{c.unread > 99 ? '99+' : c.unread}</span>
                  )}
                </div>
              ))}
            </>
          )}
          {filteredUnpinned.length > 0 && (
            <>
              <div style={{ padding: '12px 16px 6px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {filteredPinned.length > 0 ? (tab === 'groups' ? 'Групповые чаты' : 'Все чаты') : ''}
              </div>
              {filteredUnpinned.map(c => (
                <div key={c.user_id} className={`contact-item ${activeChat?.userId === c.user_id ? 'active' : ''}`}
                  onClick={() => handleContactClick(c.user_id, c.name, c.role)}
                  style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}>
                  <div className="contact-item-avatar" style={{ background: c.role === 'group' ? '#6366f1' : avColor(c.user_id) }}>
                    {c.role === 'group' ? <SGroup /> : initials(c.name)}
                    {c.is_online && c.role !== 'group' && <span className="online-dot" />}
                  </div>
                  <div className="contact-item-body">
                    <div className="contact-item-top">
                      <span className="contact-item-name">{c.name}</span>
                      <span className="contact-item-time">{c.last_time ? formatDate(c.last_time) : ''}</span>
                    </div>
                    <div className="contact-item-preview" style={{ color: c.unread > 0 ? 'var(--text)' : 'var(--muted)', fontWeight: c.unread > 0 ? 600 : 400 }}>
                      {c.last_message || 'Нет сообщений'}
                    </div>
                  </div>
                  {c.unread > 0 && (
                    <span className="contact-item-unread">{c.unread > 99 ? '99+' : c.unread}</span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ═══ CENTER COLUMN: Chat Window ═══ */}
      <div className={`chat-main ${!mobileShowContacts && activeChat ? 'chat-main--mobile-active' : ''}`}>
        {activeChat ? (
          <>
            <div className="chat-hdr">
              <button className="chat-back-btn" onClick={() => setMobileShowContacts(true)} aria-label="Назад">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, background: activeChat ? (isGroup ? '#6366f1' : avColor(activeChat.userId)) : avColor(2) }}>
                  {activeChat ? (isGroup ? <SGroup /> : initials(activeChat.name)) : initials('Анна М.')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3>{activeChat?.name || 'Анна М.'}</h3>
                  <p style={{ color: isTyping ? 'var(--blue-500)' : 'var(--muted)', fontWeight: isTyping ? 500 : 400 }}>
                    {isTyping ? 'Печатает...' : (isGroup ? `${activeContact?.members_count || 0} участников` : (activeContact?.is_online ? 'Онлайн' : (activeContact?.last_time ? `Был(а) ${formatDate(activeContact.last_time)}` : 'Преподаватель')))}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                {[SPhone, SVideo, SInfo, SMore].map((Icon, i) => (
                  <button key={i} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-color)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Icon />
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-msgs" onClick={() => setShowEmoji(false)}>
              {displayMessages.map((m, i) => {
                const isMine = m.sender_id === (user?.id || 1);
                const showDate = i === 0 || (m.created_at?.slice(0, 10) !== displayMessages[i - 1]?.created_at?.slice(0, 10));
                const hasFile = m.file_url;
                const isImage = m.file_type === 'image';
                return (
                  <div key={m.id || i}>
                    {showDate && (
                      <div className="chat-date-sep">
                        <span>{formatMsgDate(m.created_at)}</span>
                      </div>
                    )}
                    <div className={`chat-msg-row ${isMine ? 'outgoing' : 'incoming'}`}>
                      {!isMine && (
                        <div className="chat-msg-avatar" style={{ background: avColor(m.sender_id) }}>
                          {initials(m.sender_name)}
                        </div>
                      )}
                      <div>
                        <div className="chat-msg-bubble">
                          {hasFile && isImage && (
                            <img src={m.file_url} alt={m.file_name || ''} className="chat-msg-img" style={{ marginBottom: m.content ? 6 : 0 }} />
                          )}
                          {m.content && <div>{m.content}</div>}
                        </div>
                        <div className="chat-msg-time">
                          <span>{m.created_at ? formatTime(m.created_at) : ''}</span>
                          {isMine && (m.is_read ? <SCheckDouble read={true} isMine={true} /> : <SCheck read={false} isMine={true} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: '16px 16px 16px 3px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            <div className="chat-input-row" style={{ position: 'relative' }}>
              {attachedFile && (
                <div style={{ position: 'absolute', bottom: '100%', left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-color)', borderRadius: 10, marginBottom: 6 }}>
                  {attachedFile.type?.startsWith('image/') ? (
                    <img src={URL.createObjectURL(attachedFile)} alt="preview" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <SFile />
                  )}
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--blue-500)', color: '#fff', fontSize: 9 }}><SClose /></button>
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowEmoji(!showEmoji)} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showEmoji ? 'var(--surface)' : 'transparent', color: showEmoji ? 'var(--blue-500)' : 'var(--text-secondary)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!showEmoji) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; } }}
                  onMouseLeave={e => { if (!showEmoji) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                  <SEmoji />
                </button>
                {showEmoji && <EmojiPicker onSelect={(emoji) => setInput(prev => prev + emoji)} onClose={() => setShowEmoji(false)} />}
              </div>
              <button onClick={() => fileInput.current?.click()} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <SAttach />
              </button>
              <input ref={fileInput} type="file" hidden onChange={handleAttach} />
              <textarea className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} placeholder="Написать сообщение..." rows={1}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; }}
                style={{ borderColor: inputFocused ? 'var(--blue-500)' : 'var(--border)' }} />
              {input.trim() || attachedFile ? (
                <button className="send-btn" onClick={handleSend} disabled={uploading}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {uploading ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <SSend />}
                </button>
              ) : (
                <button className="send-btn" onClick={toggleMic} title={recording ? 'Остановить запись' : 'Голосовое сообщение'}
                  style={{ background: recording ? '#ef4444' : 'var(--accent-gradient)', boxShadow: recording ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none' }}>
                  <SMic />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-400)', marginBottom: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>Выберите чат</h3>
            <p>Выберите собеседника слева или начните новый диалог</p>
            <button onClick={() => setShowModal(true)} style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'var(--accent-gradient)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.25)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(37,99,235,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.25)'; }}>
              <SPlus /> Новый чат
            </button>
          </div>
        )}
      </div>

      {/* ═══ RIGHT COLUMN: Info Panel — render only when chat is selected ═══ */}
      {activeChat && (
        <div className="chat-info">
          <div className="chat-info-avatar" style={{ background: avColor(activeChat.userId) }}>
            {initials(activeChat.name)}
          </div>
          <div className="chat-info-name">{activeChat.name}</div>
          <div className="chat-info-role" style={{ color: activeContact?.is_online ? '#10b981' : 'var(--muted)' }}>
            {activeContact?.is_online ? 'Онлайн' : (ROLE_LABELS[activeChat.role] || activeChat.role || '')}
          </div>

          <div className="chat-info-actions">
            <button><SPhone /><span>Звонок</span></button>
            <button><SVideo /><span>Видео</span></button>
            <button><SPin /><span>Закрепить</span></button>
            <button><SBell /><span>Увед.</span></button>
          </div>

          <div className="chat-info-section">
            <h4>О пользователе</h4>
            <div className="chat-info-field"><span className="label">Email</span><span className="value">{infoData.email || '—'}</span></div>
            <div className="chat-info-field"><span className="label">Телефон</span><span className="value">{infoData.phone || '—'}</span></div>
            <div className="chat-info-field"><span className="label">Роль</span><span className="value">{ROLE_LABELS[infoData.role] || infoData.role_label || infoData.role || '—'}</span></div>
            {infoData.group && <div className="chat-info-field"><span className="label">Группа / Курс</span><span className="value">{infoData.group}</span></div>}
            {infoData.level && <div className="chat-info-field"><span className="label">Уровень</span><span className="value">{infoData.level}</span></div>}
          </div>

          <div className="chat-info-section">
            <h4>Общие медиа</h4>
            {infoMedia.length > 0 ? (
              <div className="chat-info-media">
                {infoMedia.map((url, i) => (
                  <div key={i} style={{ aspectRatio: 1, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-color)' }}>
                    {url.includes('unsplash') ? (
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>📷</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 12, color: 'var(--muted)' }}>Нет общих медиа</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ NEW CHAT MODAL ═══ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Новый чат"
        width={400}
      >
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}><SSearch /></span>
          <input type="text" placeholder="Поиск по имени..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--bg-color)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} autoFocus />
        </div>
        {searching ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--blue-500)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 8px' }} />
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map(u => (
            <div key={u.id} onClick={() => startChat(u.id, u.name, u.role)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0, background: avColor(u.id) }}>{initials(u.name)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
              </div>
            </div>
          ))
        ) : searchQuery.trim() ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>Ничего не найдено</div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>Введите имя для поиска</div>
        )}
      </Modal>
    </div>
  );
}
