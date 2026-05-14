import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

function resizeImage(file, maxSize = 300) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
  });
}

export default function EditProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    zipCode: user?.zipCode || '',
  });
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    const resized = await resizeImage(file);
    setProfilePic(resized);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.put('/api/auth/profile', { ...form, profilePic });
      updateUser(data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.22s ease' }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 4, margin: '0 auto 20px' }} />

        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, textAlign: 'center' }}>Edit Profile</h2>

        {/* Profile picture */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar firstName={form.firstName} lastName={form.lastName} profilePic={profilePic} size={80} fontSize={26} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: '#4a8c6a', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 14, lineHeight: 1,
              }}
            >✎</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ marginTop: 10, background: 'none', border: 'none', color: '#4a8c6a', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Change photo
          </button>
          {profilePic && (
            <button
              onClick={() => setProfilePic('')}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', marginTop: 2 }}
            >
              Remove photo
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First name</label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last name</label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Phone number</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>ZIP code</label>
          <input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#4a8c6a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
