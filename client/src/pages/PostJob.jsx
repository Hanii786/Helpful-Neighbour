import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PROMO_CODES = { 'WELCOME50': 0.5, 'FREE100': 0 };

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'Services', description: '', payRate: '', payUnit: 'hour' });
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Please sign in to post a job.</p>
        <button onClick={() => navigate('/auth')} style={{ background: '#4a8c6a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    );
  }

  const baseFee = 1.0;
  const fee = discount !== null ? discount : baseFee;

  const applyPromo = () => {
    const val = PROMO_CODES[promoCode.toUpperCase()];
    if (val !== undefined) {
      setDiscount(val);
      setError('');
    } else {
      setError('Invalid promo code');
      setDiscount(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/jobs', {
        title: form.title,
        category: form.category,
        description: form.description,
        payRate: parseFloat(form.payRate) || 0,
        payUnit: form.payUnit,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
    background: '#fff', marginTop: 6,
  };
  const labelStyle = { fontSize: 14, fontWeight: 600, color: '#111', display: 'block', marginBottom: 0 };

  return (
    <div>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
        </h1>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a8c6a', display: 'inline-block', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#166534' }}>Location verified · ZIP {user.zipCode}</div>
            <div style={{ fontSize: 12, color: '#4ade80' }}>Only visible to neighbors within 5 miles</div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Job title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Walk my dog, Garage sale..." style={inputStyle} required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: 20 }}>
                <option>Services</option>
                <option>Borrow</option>
                <option>Garage Sales</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what you need..." rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Pay rate</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 12, flex: 1, overflow: 'hidden' }}>
                  <span style={{ padding: '13px 10px 13px 14px', color: '#6b7280', fontSize: 15 }}>$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.payRate}
                    onChange={(e) => setForm({ ...form, payRate: e.target.value })}
                    placeholder="0.00"
                    style={{ border: 'none', outline: 'none', fontSize: 15, flex: 1, padding: '13px 12px 13px 0' }}
                  />
                </div>
                <select
                  value={form.payUnit}
                  onChange={(e) => setForm({ ...form, payUnit: e.target.value })}
                  style={{ padding: '13px 36px 13px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 15, outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: 18 }}
                >
                  <option value="hour">/ hour</option>
                  <option value="day">/ day</option>
                  <option value="month">/ month</option>
                  <option value="year">/ year</option>
                  <option value="fixed">fixed</option>
                  <option value="free">free</option>
                </select>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Enter $0 if free (borrowing, garage sales)</p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Promo code <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional — post for free)</span></label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="E.G. WELCOME50" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                <button type="button" onClick={applyPromo} style={{ padding: '13px 18px', background: '#4a8c6a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Apply
                </button>
              </div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#374151' }}>Posting fee</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {discount === 0 ? <span style={{ color: '#4a8c6a' }}>FREE</span> : `$${fee.toFixed(2)}`}
              </span>
            </div>

            <button type="submit" style={{ width: '100%', padding: 15, borderRadius: 16, background: '#4a8c6a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Posting...' : 'Continue to payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
