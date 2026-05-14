import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    if (user) fetchMyJobs();
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      const { data } = await axios.get('/api/jobs/my');
      setMyJobs(data);
    } catch {}
  };

  const handleResolve = async (jobId) => {
    try {
      await axios.put(`/api/jobs/${jobId}/resolve`);
      fetchMyJobs();
    } catch {}
  };

  const handleDelete = async (jobId) => {
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      fetchMyJobs();
    } catch {}
  };

  if (!user) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Sign in to view your profile.</p>
        <button onClick={() => navigate('/auth')} style={{ background: '#4a8c6a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const activeJobs = myJobs.filter((j) => j.status === 'active');

  return (
    <div>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
        </h1>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8a87c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>ZIP {user.zipCode} · Verified neighbor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ color: '#f59e0b' }}>★</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{user.rating?.toFixed(1) || '0.0'}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>({user.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Jobs posted', value: myJobs.length },
            { label: 'Helped', value: user.helped || 0 },
            { label: 'Earned', value: `$${user.earned || 0}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, background: '#f9fafb', borderRadius: 12, padding: '12px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Active listings */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
            Your active listings
          </div>
          {activeJobs.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No listings yet.</p>
          ) : (
            activeJobs.map((job) => (
              <JobCard key={job._id} job={job} onResolve={handleResolve} onDelete={handleDelete} showActions />
            ))
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: '#fff', color: '#ef4444', border: '1.5px solid #e5e7eb', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
