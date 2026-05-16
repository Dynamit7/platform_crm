import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import './Chat.css';

const ROLE_LABELS = { admin: '👑 Админ', teacher: '👩‍🏫 Преподаватель', student: '👨‍🎓 Студент' };
const ROLE_COLOR = { admin: 'admin', teacher: 'teacher', student: 'student' };

export default function ChatPage() {
  const { contacts, activeChat, messages, loadContacts, openChat, sendMessage, searchUsers } = useChat();
  const { user } = useAuth();
  const { add } = useToast();
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsers(searchQuery);
        setSearchResults(res);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, sendMessage]);

  const startChat = useCallback(async (userId, name, role) => {
    setShowModal(false);
    setSearchQuery('');
    openChat(userId, name, role);
  }, [openChat]);

  const msgEndRef = useCallback((node) => {
    if (node) node.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="chat-page">
      {/* Contacts sidebar */}
      <div className="chat-contacts">
        <div className="chat-contacts-hdr">
          <h2>💬 Сообщения</h2>
          <button className="new-msg-btn" onClick={() => setShowModal(true)} title="Новое сообщение">✏️</button>
        </div>
        <div className="chat-contacts-list">
          {contacts.map((c) => (
            <div key={c.user_id}
              className={`contact-item ${activeChat?.userId === c.user_id ? 'active' : ''}`}
              onClick={() => openChat(c.user_id, c.name, c.role)}>
              <div className={`c-av ${ROLE_COLOR[c.role] || 'student'}`}>{c.name[0].toUpperCase()}</div>
              <div className="c-info">
                <div className="c-name">
                  {c.name}
                  <span className={`c-role-badge ${ROLE_COLOR[c.role] || 'student'}`}>{ROLE_LABELS[c.role]}</span>
                </div>
                <div className="c-last">{c.last_message || 'Нет сообщений'}</div>
              </div>
              {c.unread > 0 && <div className="c-badge">{c.unread}</div>}
            </div>
          ))}
          {contacts.length === 0 && <div className="chat-empty">Нет контактов</div>}
        </div>
      </div>

      {/* Message area */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-hdr">
              <div className={`c-av ${ROLE_COLOR[activeChat.role] || 'student'}`}>{activeChat.name[0].toUpperCase()}</div>
              <div>
                <h3>{activeChat.name}</h3>
                <p>{ROLE_LABELS[activeChat.role]}</p>
              </div>
            </div>
            <div className="chat-msgs">
              {messages.map((m) => (
                <div key={m.id} className={`msg-row ${m.sender_id === user?.id ? 'mine' : ''}`}>
                  <div className="m-av">{(m.sender_id === user?.id ? user?.name : m.sender_name || '?')[0].toUpperCase()}</div>
                  <div>
                    <div className="bubble">{m.content}</div>
                    <div className="m-time">{(m.created_at || '').slice(11, 16)}</div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <div className="chat-input-row">
              <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Написать сообщение..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
              <button className="send-btn" onClick={handleSend}>➤</button>
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <div style={{ fontSize: 56 }}>💬</div>
            <h3>Выберите собеседника</h3>
            <p>Выберите контакт слева или нажмите ✏️ чтобы написать новое сообщение</p>
          </div>
        )}
      </div>

      {/* New message modal */}
      {showModal && (
        <div className="modal-overlay show" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3>✏️ Новое сообщение</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-search">
              <input type="text" placeholder="Поиск по имени..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            </div>
            <div className="modal-results">
              {searching ? <div className="modal-empty"><div className="spinner" /></div>
                : searchResults.length === 0 && searchQuery.trim()
                  ? <div className="modal-empty">Ничего не найдено</div>
                  : searchResults.map((u) => (
                    <div key={u.id} className="modal-user" onClick={() => startChat(u.id, u.name, u.role)}>
                      <div className={`c-av ${ROLE_COLOR[u.role] || 'student'}`}>{u.name[0].toUpperCase()}</div>
                      <div className="c-info">
                        <div className="c-name">
                          {u.name}
                          <span className={`c-role-badge ${ROLE_COLOR[u.role] || 'student'}`}>{ROLE_LABELS[u.role]}</span>
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
