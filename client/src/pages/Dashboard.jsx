import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Video, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [roomId, setRoomId] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  return (
    <div>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1.25rem' }}>
          <Video color="var(--accent-primary)" />
          <span>RealComm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.username}</span>
          <button className="btn btn-icon" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Start a Meeting</h2>
          
          <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%', marginBottom: '2rem', padding: '1rem' }}>
            <Video size={20} />
            Create New Room
          </button>
          
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <hr style={{ borderColor: 'var(--border-color)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '0 10px', color: 'var(--text-secondary)' }}>
              or
            </span>
          </div>
          
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter Room Code"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn" style={{ background: 'var(--text-primary)', color: 'var(--bg-dark)' }}>
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
