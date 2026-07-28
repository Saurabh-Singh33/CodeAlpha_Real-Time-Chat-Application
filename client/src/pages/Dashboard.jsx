import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Video, LogOut, Copy, Check, X, PlusCircle, Link, Shield, Users } from 'lucide-react';
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

  const getServerUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : `${window.location.protocol}//${window.location.hostname}:5000`;
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    setJoinError('');
    
    if (!roomIdInput.trim()) return;
    
    setIsJoining(true);
    let parsedId = roomIdInput.trim();
    if (parsedId.includes('/room/')) {
      parsedId = parsedId.split('/room/')[1];
    }
    parsedId = parsedId.split('?')[0].split('#')[0];

    try {
      const res = await fetch(`${getServerUrl()}/api/rooms/${parsedId}`);
      const data = await res.json();
      
      if (data.exists) {
        navigate(`/room/${parsedId}`);
      } else {
        setJoinError('Meeting not found. Check the room ID and try again.');
      }
    } catch (err) {
      console.error(err);
      setJoinError('Failed to verify meeting. Please check server connection.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const newRoomId = uuidv4();
    try {
      const res = await fetch(`${getServerUrl()}/api/rooms`, {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.35rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Video color="white" size={20} />
          </div>
          <span style={{ background: 'linear-gradient(135deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RealComm
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{user?.username}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Logout" style={{ width: '40px', height: '40px' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="dashboard-hero">
        <h1 className="dashboard-title">Premium Video Meetings for Everyone</h1>
        <p className="dashboard-desc">
          Connect, collaborate, and share with real-time video, interactive whiteboard, instant chat, and crystal clear screen sharing.
        </p>

        <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate} 
            disabled={isCreating}
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', marginBottom: '1.75rem' }}
          >
            <PlusCircle size={22} />
            {isCreating ? 'Generating Room...' : 'New Instant Meeting'}
          </button>
          
          <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
            <div style={{ height: '1px', background: 'var(--border-glass-strong)' }}></div>
            <span style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              background: '#0d121d', 
              padding: '0 12px', 
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              or join existing
            </span>
          </div>
          
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter Meeting ID or Link"
                  value={roomIdInput}
                  onChange={e => setRoomIdInput(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  required
                />
                <Link size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={isJoining} style={{ padding: '0 1.5rem', fontWeight: '600' }}>
                {isJoining ? 'Verifying...' : 'Join'}
              </button>
            </div>
            {joinError && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', textAlign: 'left', marginTop: '0.2rem' }}>{joinError}</div>}
          </form>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', maxWidth: '850px', width: '100%', marginTop: '3.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: 'var(--accent-indigo)', marginBottom: '1rem' }}>
              <Video size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>HD Video & Audio</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>Low latency WebRTC peer-to-peer audio and video streaming.</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: 'var(--accent-emerald)', marginBottom: '1rem' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Live Whiteboard</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>Interactive collaborative drawing board with brush colors and sizes.</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Secure Rooms</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>Instant room creation with SQLite authentication and persistent tokens.</p>
          </div>
        </div>
      </div>
      
      {/* Meeting Created Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)', marginBottom: '1rem' }}>
              <Video size={24} />
            </div>

            <h3 style={{ margin: 0, marginBottom: '0.4rem', color: 'white', fontSize: '1.35rem' }}>Meeting Ready!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Share this link or meeting ID with participants you want in your meeting.
            </p>
            
            <div style={{ background: 'rgba(10, 15, 26, 0.7)', border: '1px solid var(--border-glass-strong)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: '600', textTransform: 'uppercase' }}>Meeting Link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                  <input type="text" readOnly value={`${window.location.origin}/room/${createdRoomId}`} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
                  <button onClick={copyLink} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                    {linkCopied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    {linkCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: '600', textTransform: 'uppercase' }}>Meeting ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                  <input type="text" readOnly value={createdRoomId} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
                  <button onClick={copyId} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                    {idCopied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    {idCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={joinCreatedRoom} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem' }}
            >
              Start & Join Meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
