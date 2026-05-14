const AVATAR_COLORS = ['#4a8c6a', '#e8a87c', '#7eb8d4', '#c084fc', '#f97316'];
function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function Avatar({ firstName, lastName, profilePic, size = 44, fontSize = 15 }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: profilePic ? 'transparent' : avatarColor(firstName),
    }}>
      {profilePic
        ? <img src={profilePic} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#fff', fontWeight: 700, fontSize }}>{initials}</span>
      }
    </div>
  );
}
