import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 8000);
    return () => clearInterval(pollRef.current);
  }, [user]);

  useEffect(() => {
    if (pathname === '/messages') {
      setTimeout(fetchUnread, 2000);
    }
  }, [pathname]);

  const fetchUnread = async () => {
    try {
      const { data } = await axios.get('/api/messages/conversations');
      const total = data.reduce((sum, c) => sum + (c.unread || 0), 0);
      setUnreadCount(total);
    } catch {}
  };

  const navItems = [
    {
      path: '/', label: 'Browse',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
    },
    {
      path: '/post', label: 'Post Job',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
          <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
        </svg>
      ),
    },
    {
      path: '/messages', label: 'Messages',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      badge: unreadCount,
    },
    {
      path: '/safety', label: 'Safety',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    },
    {
      path: '/profile', label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, background: '#fff',
      borderTop: '1px solid #e5e7eb', zIndex: 50,
      display: 'flex', alignItems: 'center',
    }}>
      {navItems.map(({ path, label, icon, badge }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '10px 0 8px', background: 'none', border: 'none',
              cursor: 'pointer', color: active ? '#4a8c6a' : '#9ca3af', fontSize: 11,
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {icon}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -7,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', minWidth: 17, height: 17,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                  border: '1.5px solid #fff',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
