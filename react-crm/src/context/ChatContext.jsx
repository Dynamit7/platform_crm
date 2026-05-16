import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { userId, name, role }
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const connect = useCallback(() => {
    if (!user.id) return;
    const token = localStorage.getItem('access_token');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${proto}//${location.host}/ws/chat/${user.id}`);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.current.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      setMessages((prev) => {
        if (activeChat && (msg.sender_id === activeChat.userId || msg.receiver_id === activeChat.userId)) {
          return [...prev, msg];
        }
        return prev;
      });
    };

    ws.current.onclose = () => setTimeout(connect, 3000);
  }, [user.id, activeChat]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const loadContacts = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/messages/contacts/${user.id}`);
      setContacts(data);
    } catch { /* ignore */ }
  }, [user.id]);

  const openChat = useCallback(async (userId, name, role) => {
    setActiveChat({ userId, name, role });
    try {
      const { data } = await api.get(`/api/messages/${user.id}?with_user=${userId}`);
      setMessages(data);
    } catch {
      setMessages([]);
    }
  }, [user.id]);

  const sendMessage = useCallback((content) => {
    if (!ws.current || ws.current.readyState !== 1 || !activeChat) return;
    ws.current.send(JSON.stringify({ receiver_id: activeChat.userId, content }));
  }, [activeChat]);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) return [];
    const { data } = await api.get(`/api/messages/users/search?q=${encodeURIComponent(query)}`);
    return data;
  }, []);

  return (
    <ChatContext.Provider value={{ contacts, activeChat, messages, loadContacts, openChat, sendMessage, searchUsers }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
