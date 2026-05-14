import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';

const CATEGORIES = ['All', 'Services', 'Borrow', 'Garage Sales'];
const GUEST_LIMIT = 3;

export default function Browse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const { data } = await axios.get('/api/jobs', { params });
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [category]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchJobs();
  };

  const displayedJobs = user ? jobs : jobs.slice(0, GUEST_LIMIT);
  const hasMore = !user && jobs.length > GUEST_LIMIT;

  const handleMessage = (job) => {
    navigate('/messages', { state: { toUser: job.poster, jobId: job._id } });
  };

  const zip = user?.zipCode || '00000';

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#4a8c6a" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>ZIP {zip} · 5 mi</span>
          </div>
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: 34, height: 34, borderRadius: '50%', background: '#e8a87c',
                color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
              }}
            >
              {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '6px 14px', borderRadius: 20, background: '#4a8c6a',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Sign in
            </button>
          )}
        </div>

        {/* App title */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111' }}>
            Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Help and get help in your neighborhood</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}
            style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search jobs near you..."
            style={{
              width: '100%', padding: '11px 12px 11px 36px', borderRadius: 24,
              border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
              background: '#f9fafb',
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: category === cat ? '#4a8c6a' : '#e5e7eb',
                background: category === cat ? '#4a8c6a' : '#fff',
                color: category === cat ? '#fff' : '#374151',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Distance banner */}
      <div style={{ margin: '12px 16px 0', background: '#f0fdf4', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a8c6a', flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 13, color: '#166534' }}>Only showing jobs within 5 miles</span>
      </div>

      {/* Job list */}
      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
        ) : displayedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No jobs found.</div>
        ) : (
          displayedJobs.map((job) => (
            <JobCard key={job._id} job={job} onMessage={handleMessage} />
          ))
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: '#4a8c6a', color: '#fff', border: 'none',
                borderRadius: 24, padding: '12px 36px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Show more — Sign in to see all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
