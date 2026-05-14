import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AVATAR_COLORS = ['#4a8c6a', '#e8a87c', '#7eb8d4', '#c084fc', '#f97316'];
function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function UserProfileModal({ userId, onClose }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get(`/api/users/${userId}`)
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : '?';
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 480, padding: '28px 24px 40px',
          animation: 'slideUp 0.22s ease',
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 4, margin: '0 auto 24px' }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>Loading...</div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>Could not load profile.</div>
        ) : (
          <>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: avatarColor(profile.firstName),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{fullName}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  ZIP {profile.zipCode} · Verified neighbor
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ color: '#f59e0b', fontSize: 15 }}>★</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{profile.rating?.toFixed(1) || '0.0'}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>({profile.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Jobs posted', value: profile.jobsPosted || 0 },
                { label: 'Helped', value: profile.helped || 0 },
                { label: 'Earned', value: `$${profile.earned || 0}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ flex: 1, background: '#f9fafb', borderRadius: 14, padding: '14px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {currentUser && currentUser._id !== profile._id?.toString() && (
                <button
                  onClick={() => {
                    onClose();
                    navigate('/messages', { state: { toUser: profile } });
                  }}
                  style={{ flex: 1, padding: 14, borderRadius: 14, background: '#4a8c6a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  Message
                </button>
              )}
              <button
                onClick={onClose}
                style={{ flex: 1, padding: 14, borderRadius: 14, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#374151' }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
