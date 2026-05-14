export default function Safety() {
  const tips = [
    { icon: '🤝', title: 'Meet in public', desc: 'For first-time meetings, choose a public place like a coffee shop or park.' },
    { icon: '👥', title: 'Bring a friend', desc: 'When possible, have someone accompany you to jobs or meetups.' },
    { icon: '📞', title: 'Share your plans', desc: "Tell a trusted person where you're going and when you expect to return." },
    { icon: '✅', title: 'Verify profiles', desc: 'Look for the "Verified neighbor" badge before trusting someone.' },
    { icon: '💳', title: 'Pay safely', desc: 'Use the app\'s payment system. Never send cash or gift cards upfront.' },
    { icon: '🚩', title: 'Report issues', desc: 'Use the report button on any post that seems suspicious or unsafe.' },
  ];

  return (
    <div>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Helpful <span style={{ color: '#4a8c6a' }}>Neighbor</span>
        </h1>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Safety First</h2>
          <p style={{ color: '#4a8c6a', fontSize: 14, marginTop: 6 }}>Your safety is our top priority</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tips.map((tip) => (
            <div key={tip.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{tip.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Emergency?</div>
          <a href="tel:911" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', borderRadius: 12, padding: '10px 24px', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Call 911
          </a>
        </div>
      </div>
    </div>
  );
}
