import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function sameId(a, b) {
  return (a?._id || a)?.toString() === (b?._id || b)?.toString();
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);
  const bottomRef = useRef(null);
  const msgPollRef = useRef(null);
  const listPollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    if (location.state?.toUser) {
      openConvo(location.state.toUser, location.state.jobId);
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll open chat for new messages
  useEffect(() => {
    if (!activeConvo) {
      clearInterval(msgPollRef.current);
      return;
    }
    msgPollRef.current = setInterval(() => {
      fetchMessages(activeConvo.user._id, true);
    }, 4000);
    return () => clearInterval(msgPollRef.current);
  }, [activeConvo]);

  // Poll conversation list for new messages when list is visible
  useEffect(() => {
    if (activeConvo) {
      clearInterval(listPollRef.current);
      return;
    }
    listPollRef.current = setInterval(fetchConversations, 5000);
    return () => clearInterval(listPollRef.current);
  }, [activeConvo]);

  const fetchConversations = async () => {
    try {
      const { data } = await axios.get('/api/messages/conversations');
      setConversations(data);
    } catch {
      // silently fail — not critical
    }
  };

  const fetchMessages = async (otherUserId, silent = false) => {
    try {
      const { data } = await axios.get(`/api/messages/${otherUserId}`);
      setMessages(data);
    } catch {
      if (!silent) setError('Failed to load messages.');
    }
  };

  const openConvo = async (otherUser, jobId) => {
    setActiveConvo({ user: otherUser, jobId });
    setError('');
    await fetchMessages(otherUser._id);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/messages', {
        to: activeConvo.user._id,
        text: text.trim(),
        jobId: activeConvo.jobId,
      });
      setMessages((prev) => [...prev, data]);
      setText('');
      fetchConversations();
    } catch {
      setError('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Sign in to view messages.</p>
        <button onClick={() => navigate('/auth')} style={{ background: '#4a8c6a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    );
  }

  if (activeConvo) {
    const otherName = `${activeConvo.user.firstName || ''} ${activeConvo.user.lastName || ''}`.trim();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { setActiveConvo(null); fetchConversations(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, color: '#374151' }}>‹</button>
          <div
            onClick={() => activeConvo.user._id && setProfileUserId(activeConvo.user._id)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#4a8c6a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {`${activeConvo.user.firstName?.[0] || ''}${activeConvo.user.lastName?.[0] || ''}`.toUpperCase()}
          </div>
          <span
            onClick={() => activeConvo.user._id && setProfileUserId(activeConvo.user._id)}
            style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
          >{otherName}</span>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13, padding: '8px 16px', borderBottom: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((msg) => {
            const isMe = sameId(msg.from, user._id);
            return (
              <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? '#4a8c6a' : '#f3f4f6',
                  color: isMe ? '#fff' : '#111', fontSize: 14, lineHeight: 1.4,
                }}>
                  {msg.text}
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{timeAgo(msg.createdAt)}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '12px 14px', borderRadius: 24, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" disabled={loading || !text.trim()} style={{ padding: '12px 16px', background: '#4a8c6a', color: '#fff', border: 'none', borderRadius: 24, cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
            Send
          </button>
        </form>
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
        </h1>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Messages</h2>
        {conversations.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No conversations yet. Message someone from a job post!</p>
        ) : (
          conversations.map((convo) => {
            const last = convo.lastMessage;
            const myId = user._id?.toString();
            const aId = convo._id?.a?.toString();
            const bId = convo._id?.b?.toString();
            const otherId = aId === myId ? bId : aId;
            const other = last.from?._id?.toString() === otherId ? last.from : last.to;
            const otherName = `${other?.firstName || ''} ${other?.lastName || ''}`.trim();
            const key = `${aId || ''}-${bId || ''}`;
            const hasUnread = convo.unread > 0;
            return (
              <button
                key={key}
                onClick={() => openConvo(other)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 10px', background: hasUnread ? '#f0fdf4' : 'none',
                  border: 'none', borderBottom: '1px solid #f3f4f6',
                  borderRadius: hasUnread ? 10 : 0,
                  cursor: 'pointer', textAlign: 'left', marginBottom: hasUnread ? 2 : 0,
                }}
              >
                <div
                  style={{ position: 'relative', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); other?._id && setProfileUserId(other._id); }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4a8c6a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    {`${other?.firstName?.[0] || ''}${other?.lastName?.[0] || ''}`.toUpperCase()}
                  </div>
                  {hasUnread && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: '#4a8c6a', borderRadius: '50%', border: '2px solid #fff' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: hasUnread ? 800 : 700, fontSize: 14, color: '#111' }}>{otherName}</span>
                    <span style={{ fontSize: 12, color: hasUnread ? '#4a8c6a' : '#9ca3af', fontWeight: hasUnread ? 700 : 400 }}>{timeAgo(last.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: hasUnread ? '#111' : '#6b7280', fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {last.text}
                  </div>
                </div>
                {hasUnread && (
                  <span style={{ background: '#4a8c6a', color: '#fff', borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, padding: '0 5px' }}>
                    {convo.unread > 99 ? '99+' : convo.unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
