import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import UserProfileModal from './UserProfileModal';

const CATEGORY_COLORS = {
  Services: { bg: '#e8f4f0', color: '#2d6a4f' },
  Borrow: { bg: '#fff3cd', color: '#856404' },
  'Garage Sales': { bg: '#f3e8ff', color: '#6b21a8' },
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const AVATAR_COLORS = ['#4a8c6a', '#e8a87c', '#7eb8d4', '#c084fc', '#f97316'];
function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function JobCard({ job, onMessage, onResolve, onDelete, showActions = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  const poster = job.poster || {};
  const initials = getInitials(poster.firstName, poster.lastName);
  const fullName = `${poster.firstName || ''} ${poster.lastName || ''}`.trim();
  const catStyle = CATEGORY_COLORS[job.category] || { bg: '#e5e7eb', color: '#374151' };
  const isOwner = user && poster._id === user._id;

  const handleHelp = () => {
    if (!user) { navigate('/auth'); return; }
    onMessage?.(job);
  };

  const handleMessage = () => {
    if (!user) { navigate('/auth'); return; }
    onMessage?.(job);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
      padding: 16, marginBottom: 12, position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => poster._id && setProfileUserId(poster._id)}
            style={{
              width: 42, height: 42, borderRadius: '50%', background: avatarColor(poster.firstName),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
              cursor: poster._id ? 'pointer' : 'default',
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{job.title}</div>
            <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                onClick={() => poster._id && setProfileUserId(poster._id)}
                style={{ cursor: poster._id ? 'pointer' : 'default', textDecoration: poster._id ? 'underline' : 'none', textDecorationStyle: 'dotted' }}
              >{fullName}</span>
              <span>·</span>
              <span>{timeAgo(job.createdAt)}</span>
              <span style={{
                background: '#d1fae5', color: '#065f46', borderRadius: 20,
                padding: '1px 8px', fontSize: 11, fontWeight: 600,
              }}>
                {poster.zipCode}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: catStyle.bg, color: catStyle.color,
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {job.category}
          </span>
          {(isOwner || showActions) && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af', fontSize: 18 }}
              >
                ···
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 28, background: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: 8, zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 130,
                }}>
                  {isOwner && onResolve && (
                    <button
                      onClick={() => { onResolve(job._id); setMenuOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                    >
                      Mark resolved
                    </button>
                  )}
                  {isOwner && onDelete && (
                    <button
                      onClick={() => { onDelete(job._id); setMenuOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <span style={{
          background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
        }}>
          {job.payRate > 0 ? `$${job.payRate} / ${job.payUnit}` : '$0'}
        </span>
      </div>

      <p style={{ fontSize: 14, color: '#374151', marginBottom: 14, lineHeight: 1.5 }}>
        {job.description.length > 80 ? job.description.slice(0, 80) + '…' : job.description}
      </p>

      {!isOwner && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleHelp}
            style={{
              flex: 1, background: '#4a8c6a', color: '#fff', border: 'none',
              borderRadius: 12, padding: '11px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            I can help
          </button>
          <button
            onClick={handleMessage}
            style={{
              flex: 1, background: '#fff', color: '#111', border: '1.5px solid #e5e7eb',
              borderRadius: 12, padding: '11px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Message
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 44, background: '#fff', color: '#9ca3af', border: '1.5px solid #e5e7eb',
              borderRadius: 12, fontWeight: 700, fontSize: 18, cursor: 'pointer',
            }}
          >
            ···
          </button>
        </div>
      )}

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
