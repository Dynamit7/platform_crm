import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

const MAX_RECONNECT_ATTEMPTS = 10;

export function ChatProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempt = useRef(0);
  const intentionalClose = useRef(false);
  const mountedRef = useRef(true);
  const { user } = useAuth();
  const activeChatRef = useRef(null);
  activeChatRef.current = activeChat;
  const loadContactsRef = useRef(null);

  const connect = useCallback(() => {
    if (!user?.id) return;
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;
    if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }

    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${proto}//${location.host}/ws/chat/${user.id}`);
    ws.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) { socket.close(); return; }
      reconnectAttempt.current = 0;
      setIsConnected(true);
      socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === 'typing') {
        setTypingUsers(prev => ({ ...prev, [msg.sender_id]: true }));
        setTimeout(() => setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false })), 3000);
        return;
      }
      if (msg.type === 'messages_read') {
        const ids = new Set(msg.message_ids || []);
        setMessages(prev => prev.map(m => ids.has(m.id) ? { ...m, is_read: true } : m));
        return;
      }
      if (msg.type === 'error') {
        return;
      }
      const current = activeChatRef.current;
      const myId = user?.id;
      const isIncoming = msg.sender_id !== myId;
      const isInOpenChat = current && msg.sender_id === current.userId;

      // If a NEW incoming message lands in the chat that is currently open,
      // immediately tell the server "I read it" so the sender sees ✓✓.
      if (current && msg.sender_id === current.userId && msg.id && !msg._temp) {
        try { socket.send(JSON.stringify({ type: 'mark_read', sender_id: current.userId })); } catch {}
      }

      // Update contacts list: bump unread + preview of last message
      if (msg.id && !msg._temp) {
        const partnerId = isIncoming ? msg.sender_id : msg.receiver_id;
        const preview = msg.content || (msg.file_name ? `📎 ${msg.file_name}` : '📎 файл');
        setContacts(prev => {
          const idx = prev.findIndex(c => c.user_id === partnerId);
          if (idx === -1) {
            // unknown partner — refresh full list async
            loadContactsRef.current?.();
            return prev;
          }
          const bumpUnread = isIncoming && !isInOpenChat;
          const updated = {
            ...prev[idx],
            last_message: preview,
            last_time: msg.created_at || new Date().toISOString(),
            unread: bumpUnread ? (prev[idx].unread || 0) + 1 : prev[idx].unread || 0,
          };
          // Re-sort: bring active conversation to the top
          const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
          return next;
        });
      }

      setMessages((prev) => {
        if (!current) return prev;
        // Only add if it belongs to current chat
        if (msg.sender_id !== current.userId && msg.receiver_id !== current.userId) return prev;
        // Replace optimistic temp message if found (same sender + content)
        const tempIdx = prev.findIndex(m => m._temp && m.sender_id === msg.sender_id && m.content === msg.content);
        if (tempIdx !== -1) {
          const copy = [...prev];
          copy[tempIdx] = msg;
          return copy;
        }
        return [...prev, msg];
      });
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      ws.current = null;
      if (intentionalClose.current) { intentionalClose.current = false; return; }
      reconnectAttempt.current += 1;
      if (reconnectAttempt.current > MAX_RECONNECT_ATTEMPTS) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current - 1), 30000);
      reconnectTimeout.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    intentionalClose.current = false;
    connect();
    if (user?.id) {
      // initial unread badge population
      api.get(`/api/messages/contacts/${user.id}`).then(({ data }) => {
        if (mountedRef.current) setContacts(data);
      }).catch(() => {});
    }
    return () => {
      mountedRef.current = false;
      intentionalClose.current = true;
      if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
      ws.current?.close();
      ws.current = null;
    };
  }, [connect]);

  const loadContacts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/messages/contacts/${user.id}`);
      setContacts(data);
    } catch {}
  }, [user?.id]);
  loadContactsRef.current = loadContacts;

  const openChat = useCallback(async (userId, name, role) => {
    setActiveChat({ userId, name, role });
    // Local reset of unread for this contact — server is hit by GET below and
    // pushes messages_read to the original sender via WS.
    setContacts(prev => prev.map(c => c.user_id === userId ? { ...c, unread: 0 } : c));
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/messages/${user.id}?with_user=${userId}`);
      setMessages(data);
    } catch { setMessages([]); }
  }, [user?.id]);

  const closeChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
  }, []);

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  const sendMessage = useCallback((content, fileUrl, fileType, fileName) => {
    if (!ws.current || ws.current.readyState !== 1 || !activeChat) return;
    ws.current.send(JSON.stringify({
      receiver_id: activeChat.userId,
      content,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
    }));
    // Optimistic add for ALL messages (text + file)
    setMessages(prev => [...prev, {
      _temp: true,
      id: Date.now(),
      sender_id: user?.id,
      sender_name: user?.name || 'Вы',
      receiver_id: activeChat.userId,
      content: content || '',
      file_url: fileUrl || null,
      file_type: fileType || null,
      file_name: fileName || null,
      created_at: new Date().toISOString().slice(0, 16),
      is_read: false,
    }]);
  }, [activeChat, user?.id, user?.name]);

  const sendTyping = useCallback(() => {
    if (!ws.current || ws.current.readyState !== 1 || !activeChat) return;
    ws.current.send(JSON.stringify({ type: 'typing', receiver_id: activeChat.userId }));
  }, [activeChat]);

  const uploadFile = useCallback(async (file) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/api/messages/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }, []);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) return [];
    const { data } = await api.get(`/api/messages/users/search?q=${encodeURIComponent(query)}`);
    return data;
  }, []);

  return (
    <ChatContext.Provider value={{
      contacts, activeChat, messages, typingUsers, isConnected, totalUnread,
      loadContacts, openChat, closeChat, sendMessage, sendTyping, uploadFile, searchUsers,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
