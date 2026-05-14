import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import Browse from './pages/Browse';
import PostJob from './pages/PostJob';
import Messages from './pages/Messages';
import Safety from './pages/Safety';
import Profile from './pages/Profile';
import Auth from './pages/Auth';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/post" element={<PostJob />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
