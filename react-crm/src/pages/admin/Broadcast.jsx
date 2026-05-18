import { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const TEMPLATES = [
  { label: 'Приглашение на пробный урок', text: 'Здравствуйте! Приглашаем вас на бесплатный пробный урок в TIL USER. Запишитесь по телефону или в ответ на это сообщение.' },
  { label: 'Напоминание об оплате', text: 'Уважаемый студент! Напоминаем, что необходимо оплатить обучение. Спасибо!' },
  { label: 'Изменение в расписании', text: 'Уважаемые студенты! В расписании произошли изменения. Актуальное расписание доступно в личном кабинете.' },
  { label: 'Поздравление', text: 'Поздравляем с успешным завершением курса! Мы гордимся вашими достижениями. Ждём вас на следующих курсах!' },
];

export default function Broadcast() {
  const { add } = useToast();
  const [form, setForm] = useState({ message: '', audience: 'all' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const applyTemplate = (text) => setForm({ ...form, message: text });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post('/api/admin/broadcast', form);
      setResult(data);
      if (add) add(`Отправлено ${data.sent} из ${data.total}`, 'success');
    } catch {
      if (add) add('Ошибка рассылки', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Рассылка</h1>
          <p>Отправка сообщений пользователям</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="panel" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Новое сообщение</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Сообщение</label>
              <textarea className="form-input" rows={6} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Введите текст сообщения..." required />
            </div>
            <div className="form-group">
              <label>Получатели</label>
              <select className="form-input" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
                <option value="all">Все пользователи</option>
                <option value="student">Только студенты</option>
                <option value="teacher">Только преподаватели</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Отправка...' : '📨 Отправить'}
            </button>
          </form>
          {result && (
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius)', fontSize: 13 }}>
              <div>✅ Отправлено: <strong>{result.sent}</strong></div>
              <div>❌ Ошибок: <strong>{result.failed}</strong></div>
              <div>👥 Всего: <strong>{result.total}</strong></div>
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>📝 Шаблоны</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map((t, i) => (
              <button key={i} className="btn btn-outline" style={{ textAlign: 'left', padding: '8px 14px', fontSize: 12, justifyContent: 'flex-start', height: 'auto', whiteSpace: 'normal' }}
                onClick={() => applyTemplate(t.text)}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.text.slice(0, 60)}...</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
