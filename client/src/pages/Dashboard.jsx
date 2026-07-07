import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Video, LogOut, Copy, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    setJoinError('');
    
    if (!roomIdInput.trim()) return;
    
    setIsJoining(true);
    // Extract ID if it's a full URL
    let parsedId = roomIdInput.trim();
    if (parsedId.includes('/room/')) {
      parsedId = parsedId.split('/room/')[1];
    }
    // Remove query params or hashes if any
    parsedId = parsedId.split('?')[0].split('#')[0];

    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${parsedId}`);
      const data = await res.json();
      
      if (data.exists) {
        navigate(`/room/${parsedId}`);
      } else {
        setJoinError('Meeting not found.');
      }
    } catch (err) {
      console.error(err);
      setJoinError('Failed to verify meeting. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const newRoomId = uuidv4();
    try {
      const res = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomId: newRoomId })
      });
      
      if (res.ok) {
        setCreatedRoomId(newRoomId);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    } finally {
      setIsCreating(false);
    }
  };
  
  const copyLink = () => {
    const link = `${window.location.origin}/room/${createdRoomId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyId = () => {
    navigator.clipboard.writeText(createdRoomId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };
  
  const joinCreatedRoom = () => {
    navigate(`/room/${createdRoomId}`);
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
          
          <button 
            className="btn" 
            onClick={handleCreate} 
            disabled={isCreating}
            style={{ width: '100%', marginBottom: '2rem', padding: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', fontWeight: 'bold', fontSize: '1.1rem', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.7 : 1 }}
          >
            <Video size={20} />
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
          
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <hr style={{ borderColor: 'var(--border-color)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '0 10px', color: 'var(--text-secondary)' }}>
              or
            </span>
          </div>
          
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter Meeting ID or Link"
                value={roomIdInput}
                onChange={e => setRoomIdInput(e.target.value)}
                style={{ flex: 1, border: joinError ? '2px solid #ef4444' : '2px solid rgba(139, 92, 246, 0.3)', padding: '0.75rem 1rem', fontSize: '1rem' }}
                required
              />
              <button type="submit" className="btn" disabled={isJoining} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', fontWeight: 'bold', padding: '0 1.5rem', opacity: isJoining ? 0.7 : 1 }}>
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
            {joinError && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'left', marginTop: '0.25rem' }}>{joinError}</div>}
          </form>
        </div>
      </div>
      
      {/* Meeting Created Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'white', fontSize: '1.4rem' }}>Here's your joining info</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Send this to people you want to meet with. Be sure to save it so you can use it later, too.
            </p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Meeting Link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="text" readOnly value={`${window.location.origin}/room/${createdRoomId}`} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
                  <button onClick={copyLink} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem', border: 'none', color: 'white', cursor: 'pointer' }} title="Copy Link">
                    {linkCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.8rem 0' }}></div>
              
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Meeting ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="text" readOnly value={createdRoomId} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
                  <button onClick={copyId} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem', border: 'none', color: 'white', cursor: 'pointer' }} title="Copy Meeting ID">
                    {idCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={joinCreatedRoom} 
              className="btn" 
              style={{ width: '100%', padding: '0.8rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Join Meeting Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
