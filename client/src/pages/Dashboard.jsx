import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Video, LogOut, Copy, Check, X, PlusCircle, Link as LinkIcon, Shield, Users, Bell, Calendar, ChevronDown, Edit2, Trash2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ProfilePanel from '../components/ProfilePanel';

export default function Dashboard() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', team: '' });
  
  const { user, logout } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const navigate = useNavigate();

  const getServerUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : `${window.location.protocol}//${window.location.hostname}:5000`;
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/meetings`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingMeeting 
        ? `${getServerUrl()}/api/meetings/${editingMeeting._id}`
        : `${getServerUrl()}/api/meetings`;
      const method = editingMeeting ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingForm),
        credentials: 'include'
      });
      
      if (res.ok) {
        setShowMeetingModal(false);
        setEditingMeeting(null);
        setMeetingForm({ title: '', date: '', time: '', team: '' });
        fetchMeetings();
      }
    } catch (err) {
      console.error('Error saving meeting:', err);
    }
  };

  const openEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setMeetingForm({ 
      title: meeting.title, 
      date: meeting.date, 
      time: meeting.time, 
      team: meeting.team 
    });
    setShowMeetingModal(true);
  };

  const deleteMeeting = async (id) => {
    // Optimistic deletion
    const previousMeetings = [...meetings];
    setMeetings(meetings.filter(m => m._id !== id));

    try {
      const res = await fetch(`${getServerUrl()}/api/meetings/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to delete meeting');
      }
    } catch (err) {
      console.error('Error deleting meeting:', err);
      alert('Failed to delete meeting. Please try again.');
      setMeetings(previousMeetings); // Revert UI if it fails
    }
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
        body: JSON.stringify({ roomId: newRoomId, hostId: currentUser?.email })
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <header className="app-header" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.35rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Video color="white" size={20} />
          </div>
          <span style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VartaConnect
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button className="btn-icon" title="Notifications" style={{ width: '40px', height: '40px', color: '#4B5563' }}>
            <Bell size={18} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>
              {currentUser?.name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: '600', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {currentUser?.name || currentUser?.username}
              <ChevronDown size={16} color="#6B7280" />
            </span>
          </div>
          <button className="btn-icon" onClick={logout} title="Logout" style={{ width: '40px', height: '40px', color: '#4B5563' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <style>
        {`
          .btn-new-meeting {
            transition: all 0.2s ease;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
          }
          .btn-new-meeting:hover {
            transform: scale(1.05);
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.7);
          }
        `}
      </style>

      <div className="dashboard-hero" style={{ position: 'relative' }}>
        {/* Grid Pattern Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>
        
        {/* Ambient Background Glow Orb */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 40%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>

        <h1 style={{ fontFamily: '"Inter", "Roboto", sans-serif', fontWeight: '800', letterSpacing: '-0.02em', zIndex: 1, position: 'relative', color: '#1F2937', fontSize: '2.75rem', marginBottom: '1rem' }}>Premium Video Meetings for Everyone</h1>
        <p className="dashboard-desc" style={{ zIndex: 1, position: 'relative', color: '#4B5563' }}>
          Connect, collaborate, and share with real-time video, interactive whiteboard, instant chat, and crystal clear screen sharing.
        </p>

        <div className="glass-panel" style={{ 
          padding: '2.5rem', 
          width: '100%', 
          maxWidth: '520px', 
          margin: '0 auto', 
          zIndex: 1, 
          position: 'relative',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px'
        }}>
          <button 
            onClick={handleCreate} 
            disabled={isCreating}
            style={{ 
              width: '100%', 
              padding: '1.1rem', 
              fontSize: '1.05rem', 
              marginBottom: '1.75rem',
              borderRadius: '12px',
              background: '#F1F5F9',
              color: '#1F2937',
              border: '1px solid #E2E8F0',
              fontWeight: '600',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => {
              if (!isCreating) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
              }
            }}
            onMouseOut={e => {
              if (!isCreating) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
              }
            }}
          >
            <PlusCircle size={22} />
            {isCreating ? 'Generating Room...' : 'Start Meeting Now'}
          </button>
          
          <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
            <div style={{ height: '1px', background: '#E5E7EB' }}></div>
            <span style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              background: '#FFFFFF', 
              padding: '0 12px', 
              color: '#6B7280',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              or join existing
            </span>
          </div>
          
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '24px', overflow: 'hidden', padding: '4px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Enter Meeting ID or Link"
                  value={roomIdInput}
                  onChange={e => setRoomIdInput(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem 1rem 0.8rem 2.8rem', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#1F2937', 
                    outline: 'none', 
                    fontSize: '1rem' 
                  }}
                  required
                />
                <LinkIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              </div>
              <button 
                type="submit" 
                disabled={isJoining} 
                style={{ 
                  padding: '0.8rem 1.8rem', 
                  background: '#F1F5F9', 
                  color: '#1F2937', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '20px',
                  fontWeight: '600', 
                  cursor: isJoining ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }} 
                onMouseOver={e => {
                  if (!isJoining) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseOut={e => {
                  if (!isJoining) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }
                }}
              >
                {isJoining ? 'Verifying...' : 'Join'}
              </button>
            </div>
            {joinError && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', textAlign: 'left', marginTop: '0.2rem', paddingLeft: '1rem' }}>{joinError}</div>}
          </form>
        </div>

        {/* Upcoming Meetings Section */}
        <div style={{ width: '100%', maxWidth: '850px', marginTop: '4rem', zIndex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={22} color="#818cf8" />
              Upcoming Meetings
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => {
                  setEditingMeeting(null);
                  setMeetingForm({ title: '', date: '', time: '', team: '' });
                  setShowMeetingModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F1F5F9', color: '#1F2937', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                <Plus size={16} /> Add Meeting
              </button>
              <button 
                style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', color: '#1F2937', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                View All
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            
            {meetings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.95rem', gridColumn: '1 / -1' }}>
                No upcoming meetings scheduled. Click "Add Meeting" to create one.
              </div>
            ) : (
              meetings.map((meeting) => (
                <div key={meeting._id} className="glass-panel meeting-card" style={{ padding: '1.5rem', textAlign: 'left', borderTop: '4px solid #2563eb', position: 'relative', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ background: '#F3F4F6', color: '#374151', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>SCHEDULED</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600', letterSpacing: '0.5px' }}>{meeting.date} at {meeting.time}</div>
                    <div className="card-actions" style={{ display: 'flex', gap: '0.4rem', marginTop: '-4px', position: 'absolute', top: '3rem', right: '1rem' }}>
                      <button onClick={() => openEditModal(meeting)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteMeeting(meeting._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem', color: '#1F2937', fontWeight: '700' }}>{meeting.title}</h3>
                  <p style={{ color: '#4B5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{meeting.team || 'No description'}</p>
                  
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => alert('Feature coming soon!')} className="btn" style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.9rem', background: 'transparent', color: '#374151', border: '1px solid #9CA3AF', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Join Now</button>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', maxWidth: '850px', width: '100%', marginTop: '3.5rem', zIndex: 1, position: 'relative' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: '#4f46e5', marginBottom: '1rem' }}>
              <Video size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#1F2937', fontWeight: '700' }}>HD Video & Audio</h3>
            <p style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: '1.5' }}>Low latency WebRTC peer-to-peer audio and video streaming.</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: '#059669', marginBottom: '1rem' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#1F2937', fontWeight: '700' }}>Live Whiteboard</h3>
            <p style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: '1.5' }}>Interactive collaborative drawing board with brush colors and sizes.</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px', width: 'fit-content', color: '#0891b2', marginBottom: '1rem' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#1F2937', fontWeight: '700' }}>Secure Rooms</h3>
            <p style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: '1.5' }}>Instant room creation with SQLite authentication and persistent tokens.</p>
          </div>
        </div>
      </div>
      
      {/* Meeting Created Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', position: 'relative', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F3F4F6', border: 'none', color: '#4B5563', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', marginBottom: '1rem' }}>
              <Video size={24} />
            </div>

            <h3 style={{ margin: 0, marginBottom: '0.4rem', color: '#1F2937', fontSize: '1.35rem', fontWeight: '700' }}>Meeting Ready!</h3>
            <p style={{ color: '#4B5563', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Share this link or meeting ID with participants you want in your meeting.
            </p>
            
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '1.1rem', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.775rem', color: '#6B7280', marginBottom: '0.3rem', fontWeight: '700', textTransform: 'uppercase' }}>Meeting Link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                  <input type="text" readOnly value={`${window.location.origin}/room/${createdRoomId}`} style={{ flex: 1, background: 'transparent', border: 'none', color: '#1F2937', outline: 'none', fontSize: '0.85rem' }} />
                  <button onClick={copyLink} style={{ background: '#F3F4F6', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '600' }}>
                    {linkCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {linkCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.775rem', color: '#6B7280', marginBottom: '0.3rem', fontWeight: '700', textTransform: 'uppercase' }}>Meeting ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                  <input type="text" readOnly value={createdRoomId} style={{ flex: 1, background: 'transparent', border: 'none', color: '#1F2937', outline: 'none', fontSize: '0.85rem' }} />
                  <button onClick={copyId} style={{ background: '#F3F4F6', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '600' }}>
                    {idCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {idCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={joinCreatedRoom} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', borderRadius: '12px' }}
            >
              Start & Join Meeting
            </button>
          </div>
        </div>
      )}

      <ProfilePanel 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        user={currentUser} 
        onUpdate={setCurrentUser} 
      />

      {/* Add/Edit Meeting Modal */}
      {showMeetingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', position: 'relative', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => { setShowMeetingModal(false); setEditingMeeting(null); }} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F3F4F6', border: 'none', color: '#4B5563', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ margin: 0, marginBottom: '1.5rem', color: '#1F2937', fontSize: '1.35rem', fontWeight: '700' }}>
              {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
            </h3>
            
            <form onSubmit={handleMeetingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Meeting Title</label>
                <input 
                  type="text" 
                  value={meetingForm.title} 
                  onChange={e => setMeetingForm({...meetingForm, title: e.target.value})}
                  placeholder="e.g. Weekly Sync"
                  required
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Date</label>
                  <input 
                    type="date" 
                    value={meetingForm.date} 
                    onChange={e => setMeetingForm({...meetingForm, date: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Time</label>
                  <input 
                    type="time" 
                    value={meetingForm.time} 
                    onChange={e => setMeetingForm({...meetingForm, time: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#4B5563' }}>Team / Description (Optional)</label>
                <input 
                  type="text" 
                  value={meetingForm.team} 
                  onChange={e => setMeetingForm({...meetingForm, team: e.target.value})}
                  placeholder="e.g. Product Team"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem' }}
                />
              </div>
              <button 
                type="submit" 
                style={{ width: '100%', padding: '0.85rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
