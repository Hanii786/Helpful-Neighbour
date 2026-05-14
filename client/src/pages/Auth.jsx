import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder, style }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value} onChange={onChange}
        placeholder={placeholder}
        style={{ ...style, paddingRight: 44 }}
        required
      />
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('signup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMsg, setLocationMsg] = useState('');

  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', zipCode: '', lat: null, lng: null,
  });
  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    setLocationMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const zip = data.address?.postcode?.split('-')[0] || '';
          setSignupForm(f => ({ ...f, zipCode: zip, lat: latitude, lng: longitude }));
          setLocationMsg(zip ? `✓ Location detected (ZIP: ${zip})` : 'Could not detect ZIP — please enter manually.');
        } catch {
          setLocationMsg('Failed to fetch location. Please enter ZIP manually.');
        }
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          setLocationMsg('Location access denied. To enable: tap the 🔒 icon in your browser address bar → Site settings → Allow Location. Then try again.');
        } else {
          setLocationMsg('Could not get location. Please enter ZIP manually.');
        }
      },
      { timeout: 10000 }
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // always start with email verification
      const { data } = await axios.post('/api/auth/register', { ...signupForm, verifyMethod: 'email' });
      setUserId(data.userId);
      setVerifyMethod('email');
      setTab('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { userId, otp });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (switchTo) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/resend-otp', {
        userId,
        ...(switchTo && { switchTo }),
      });
      if (switchTo) setVerifyMethod(switchTo);
      else setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', signinForm);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.userId) {
        setUserId(err.response.data.userId);
        setTab('otp');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
    background: '#fff', marginTop: 6, boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 14, fontWeight: 600, color: '#111', display: 'block', marginTop: 14 };
  const btnStyle = {
    width: '100%', padding: 15, borderRadius: 16, background: '#4a8c6a',
    color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 20,
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, padding: '32px 24px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
            Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>Help and get help in your neighborhood</p>
        </div>

        {tab !== 'otp' && (
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {['signup', 'signin'].map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: tab === t ? '#fff' : 'transparent', fontWeight: tab === t ? 700 : 500, fontSize: 14, cursor: 'pointer', color: tab === t ? '#111' : '#6b7280', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
              >
                {t === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* ── OTP step ── */}
        {tab === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{verifyMethod === 'phone' ? '📱' : '📧'}</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                {verifyMethod === 'phone' ? 'Check your phone' : 'Check your email'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
                We sent a 6-digit code to your {verifyMethod === 'phone' ? 'phone number' : 'email address'}.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <label style={labelStyle}>Enter OTP code</label>
              <input
                value={otp} onChange={(e) => setOtp(e.target.value)}
                placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                required
              />
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <button type="button" onClick={() => handleResendOtp(null)}
              style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#4a8c6a', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 8 }}
            >
              Resend code
            </button>

            {/* divider + switch method */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {verifyMethod === 'email' ? (
              <button
                type="button"
                onClick={() => handleResendOtp('phone')}
                disabled={loading}
                style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                📱 Verify through phone number instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleResendOtp('email')}
                disabled={loading}
                style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                📧 Verify through email instead
              </button>
            )}
          </div>
        )}

        {/* ── Sign up ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First name</label>
                <input value={signupForm.firstName} onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })} placeholder="Jane" style={inputStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last name</label>
                <input value={signupForm.lastName} onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })} placeholder="Smith" style={inputStyle} required />
              </div>
            </div>

            <label style={labelStyle}>ZIP code</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                value={signupForm.zipCode}
                onChange={(e) => setSignupForm({ ...signupForm, zipCode: e.target.value })}
                placeholder="91701"
                style={{ ...inputStyle, marginTop: 0, flex: 1 }} required
              />
              <button type="button" onClick={detectLocation} disabled={locationLoading}
                title="Use my current location"
                style={{ padding: '0 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 18, flexShrink: 0, opacity: locationLoading ? 0.6 : 1 }}
              >
                {locationLoading ? '⏳' : '📍'}
              </button>
            </div>
            {locationMsg && (
              <p style={{ fontSize: 12, color: locationMsg.startsWith('✓') ? '#4a8c6a' : '#f59e0b', marginTop: 5, lineHeight: 1.5 }}>
                {locationMsg}
              </p>
            )}

            <label style={labelStyle}>Email</label>
            <input type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} placeholder="you@example.com" style={inputStyle} required />

            <label style={labelStyle}>Phone number</label>
            <input type="tel" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} placeholder="+1 555 000 0000" style={inputStyle} required />

            <label style={labelStyle}>Password</label>
            <PasswordInput value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} placeholder="At least 6 characters" style={inputStyle} />

            <label style={labelStyle}>Confirm password</label>
            <PasswordInput value={signupForm.confirmPassword} onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} placeholder="Repeat password" style={inputStyle} />

            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
              By continuing you agree to be a kind neighbor.
            </p>
          </form>
        )}

        {/* ── Sign in ── */}
        {tab === 'signin' && (
          <form onSubmit={handleSignin}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={signinForm.email} onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })} placeholder="you@example.com" style={inputStyle} required />
            <label style={labelStyle}>Password</label>
            <PasswordInput value={signinForm.password} onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })} placeholder="Password" style={inputStyle} />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
              By continuing you agree to be a kind neighbor.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
