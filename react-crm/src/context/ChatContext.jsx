import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const { user } = useAuth();
  const activeChatRef = useRef(null);
  activeChatRef.current = activeChat;

  const connect = useCallback(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('access_token');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${proto}//${location.host}/ws/chat/${user.id}`);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.current.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === 'typing') {
        setTypingUsers(prev => ({ ...prev, [msg.sender_id]: true }));
        setTimeout(() => setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false })), 3000);
        return;
      }
      const current = activeChatRef.current;
      setMessages((prev) => {
        if (current && (msg.sender_id === current.userId || msg.receiver_id === current.userId)) {
          return [...prev, msg];
        }
        return prev;
      });
    };

    ws.current.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };
  }, [user?.id]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  const loadContacts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/messages/contacts/${user.id}`);
      setContacts(data);
    } catch {}
  }, [user?.id]);

  const openChat = useCallback(async (userId, name, role) => {
    setActiveChat({ userId, name, role });
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/messages/${user.id}?with_user=${userId}`);
      setMessages(data);
    } catch { setMessages([]); }
  }, [user?.id]);

  const sendMessage = useCallback((content, fileUrl, fileType, fileName) => {
    if (!ws.current || ws.current.readyState !== 1 || !activeChat) return;
    ws.current.send(JSON.stringify({
      receiver_id: activeChat.userId,
      content,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
    }));
    if (fileUrl) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender_id: user?.id,
        content: content || '',
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        created_at: new Date().toISOString().slice(0, 16),
        is_read: false,
      }]);
    }
  }, [activeChat, user?.id]);

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
      contacts, activeChat, messages, typingUsers,
      loadContacts, openChat, sendMessage, sendTyping, uploadFile, searchUsers,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
