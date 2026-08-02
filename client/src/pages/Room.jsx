import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { 
  Monitor, MonitorUp, Video, VideoOff, Mic, MicOff, MessageSquare, 
  Smile, X, StopCircle, Users, UserPlus, Layout, Copy, Check, Disc, Clock
} from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('video'); // video | whiteboard
  const [sidePanel, setSidePanel] = useState('chat'); // chat | users
  
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const [isValidating, setIsValidating] = useState(true);
  const [roomError, setRoomError] = useState('');
  
  // Call Duration Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getServerUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : `${window.location.protocol}//${window.location.hostname}:5000`;
  };

  useEffect(() => {
    const validateRoom = async () => {
      try {
        const res = await fetch(`${getServerUrl()}/api/rooms/${roomId}`);
        const data = await res.json();
        if (!data.exists) {
          setRoomError('Meeting not found or link expired.');
        }
      } catch (_err) {
        setRoomError('Failed to verify meeting. Please check network connection.');
      } finally {
        setIsValidating(false);
      }
    };
    validateRoom();
  }, [roomId]);

  useEffect(() => {
    if (!socket || !user || isValidating || roomError) return;
    
    // Request media access
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        streamRef.current = currentStream;
        socket.emit('join-room', roomId, user.name || user.username);
      })
      .catch(err => {
        console.warn('Media access error, joining audio/video fallback', err);
        socket.emit('join-room', roomId, user.name || user.username);
      });
      
    socket.on('room-users', (users) => {
      setUsersInRoom(users);
    });

    socket.on('user-connected', (newUser) => {
      setUsersInRoom(prev => {
        if (!prev.find(u => u.id === newUser.userId)) {
          return [...prev, { id: newUser.userId, username: newUser.username }];
        }
        return prev;
      });
    });

    socket.on('user-disconnected', (userId) => {
      setUsersInRoom(prev => prev.filter(u => u.id !== userId));
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      socket.off('room-users');
      socket.off('user-connected');
      socket.off('user-disconnected');
    };
  }, [roomId, socket, user, isValidating, roomError]);

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsVideoMuted(!nextState);
        socket?.emit('media-state', { isVideoMuted: !nextState, isAudioMuted });
      }
    } else {
      setIsVideoMuted(prev => !prev);
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setIsAudioMuted(!nextState);
        socket?.emit('media-state', { isVideoMuted, isAudioMuted: !nextState });
      }
    } else {
      setIsAudioMuted(prev => !prev);
    }
  };
  
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          stopScreenShare();
        };
        
        setIsScreenSharing(true);
        window.dispatchEvent(new CustomEvent('switch-track', { detail: { track: screenTrack } }));
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        window.dispatchEvent(new CustomEvent('switch-track', { detail: { track: videoTrack } }));
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        const options = { mimeType: 'video/webm;codecs=vp9' };
        const mediaRecorder = new MediaRecorder(displayStream, options);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.style = 'display: none';
          a.href = url;
          a.download = `meeting-recording-${Date.now()}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          displayStream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
        
        displayStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
      } catch (err) {
        console.error('Error starting recording', err);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const sendReaction = (emoji) => {
    socket.emit('reaction', { roomId, userId: socket.id, emoji });
    setShowReactions(false);
  };
  
  const leaveRoom = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    navigate('/');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const [inviteError, setInviteError] = useState('');

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    
    setInviteStatus('sending');
    setInviteError('');
    
    try {
      const res = await fetch(`${getServerUrl()}/api/rooms/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteInput.trim(),
          roomId,
          roomLink: window.location.href,
          inviterName: user?.name || user?.username
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setInviteStatus('sent');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteStatus('');
          setInviteInput('');
        }, 1800);
      } else {
        setInviteStatus('');
        setInviteError(data.error || 'Failed to send invite email.');
      }
    } catch (_err) {
      setInviteStatus('');
      setInviteError('Server error while sending email.');
    }
  };

  if (isValidating) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: 'var(--bg-dark)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="live-dot" style={{ width: '24px', height: '24px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: 'var(--bg-dark)', padding: '1rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-rose)' }}>{roomError}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            The meeting code you entered is invalid or has expired.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="room-container">
        <div className="main-stage">
          {/* Top Bar Header */}
          <div className="top-bar">
            <div className="room-title">
              <span style={{ color: 'var(--text-muted)' }}>Room:</span> 
              <span>{roomId.length > 12 ? `${roomId.substring(0, 12)}...` : roomId}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isRecording && (
                <div className="recording-badge">
                  <div className="live-dot" style={{ background: '#ef4444' }}></div> REC
                </div>
              )}

              <button className="feature-btn" onClick={copyRoomLink} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                {linkCopied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {linkCopied ? 'Copied Link' : 'Copy Link'}
              </button>
              
              <div className="live-badge">
                <div className="live-dot"></div> Live
              </div>
            </div>
          </div>

          {/* Center Stage: Video Grid vs Whiteboard */}
          {activeTab === 'video' ? (
            <VideoGrid 
              localStream={stream} 
              roomId={roomId} 
              isScreenSharing={isScreenSharing} 
              isVideoMuted={isVideoMuted}
              isAudioMuted={isAudioMuted}
            />
          ) : (
            <Whiteboard roomId={roomId} />
          )}
          
          {/* Bottom Dock Control Bar */}
          <div className="bottom-features-bar">
            {/* Left Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{formatDuration(secondsElapsed)}</span>
            </div>

            {/* Center Call Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Emoji Reactions */}
              <div style={{ position: 'relative' }}>
                {showReactions && (
                  <div className="reaction-menu">
                    <button className="reaction-btn" onClick={() => sendReaction('👍')}>👍</button>
                    <button className="reaction-btn" onClick={() => sendReaction('❤️')}>❤️</button>
                    <button className="reaction-btn" onClick={() => sendReaction('😂')}>😂</button>
                    <button className="reaction-btn" onClick={() => sendReaction('👏')}>👏</button>
                    <button className="reaction-btn" onClick={() => sendReaction('🎉')}>🎉</button>
                  </div>
                )}
                <button className="btn-icon" onClick={() => setShowReactions(!showReactions)} title="Send Reaction">
                  <Smile size={22} />
                </button>
              </div>

              {/* Mic Toggle */}
              <button className={`btn-icon ${isAudioMuted ? 'btn-icon-danger' : ''}`} onClick={toggleAudio} title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}>
                {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              
              {/* Leave Call */}
              <button className="btn-icon leave-btn" onClick={leaveRoom} title="Leave Meeting">
                <StopCircle size={26} />
              </button>

              {/* Video Toggle */}
              <button className={`btn-icon ${isVideoMuted ? 'btn-icon-danger' : ''}`} onClick={toggleVideo} title={isVideoMuted ? 'Start Camera' : 'Stop Camera'}>
                {isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
              </button>

              {/* Screen Share */}
              <button className={`btn-icon ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare} title="Share Screen">
                {isScreenSharing ? <Monitor size={22} /> : <MonitorUp size={22} />}
              </button>

              {/* Record Screen */}
              <button className={`btn-icon ${isRecording ? 'btn-icon-danger' : ''}`} onClick={toggleRecording} title={isRecording ? 'Stop Recording' : 'Record Meeting'}>
                <Disc size={22} />
              </button>
            </div>
            
            {/* Right Tools Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, justifyContent: 'flex-end' }}>
              <button className="feature-btn" onClick={() => setActiveTab(activeTab === 'video' ? 'whiteboard' : 'video')}>
                <Layout size={16} />
                <span className="hide-on-mobile">{activeTab === 'video' ? 'Whiteboard' : 'Video Grid'}</span>
              </button>

              <button className={`feature-btn ${sidePanel === 'users' ? 'active' : ''}`} onClick={() => setSidePanel(sidePanel === 'users' ? 'chat' : 'users')}>
                <Users size={16} />
                <span className="hide-on-mobile">{usersInRoom.length + 1}</span>
              </button>
              
              <button className="feature-btn" onClick={() => setShowInviteModal(true)} title="Invite User">
                <UserPlus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel (Chat & Participants) */}
        <div className="side-panel">
          <div className="side-panel-header">
            <span className="side-panel-title">{sidePanel === 'chat' ? 'Group Chat' : 'Participants'}</span>
            <button className="btn-icon" style={{ width: '36px', height: '36px' }} onClick={() => setSidePanel(sidePanel === 'chat' ? 'users' : 'chat')}>
              {sidePanel === 'chat' ? <Users size={16} /> : <MessageSquare size={16} />}
            </button>
          </div>
          
          {sidePanel === 'chat' && <Chat roomId={roomId} />}
          
          {sidePanel === 'users' && (
            <div style={{ padding: '1.25rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
              {/* You */}
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.85rem', border: '1px solid var(--border-glass)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem' }}>
                  {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || user?.username} (You)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Host / Active</div>
                </div>
              </div>
              
              {/* Other Participants */}
              {usersInRoom.map(u => (
                <div key={u.id} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.85rem', border: '1px solid var(--border-glass)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem' }}>
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Participant</div>
                  </div>
                </div>
              ))}
              
              {usersInRoom.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem', fontSize: '0.875rem' }}>
                  No other participants in room yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowInviteModal(false)} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'white', fontSize: '1.3rem' }}>Invite People</h3>
            
            {inviteError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                {inviteError}
              </div>
            )}
            
            <form onSubmit={handleSendInvite}>
              <div className="form-group">
                <label className="form-label">Email or Phone Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. colleague@company.com"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={inviteStatus !== ''}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                {inviteStatus === 'sending' ? 'Sending Invite...' : inviteStatus === 'sent' ? '✓ Invite Sent!' : 'Send Meeting Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
