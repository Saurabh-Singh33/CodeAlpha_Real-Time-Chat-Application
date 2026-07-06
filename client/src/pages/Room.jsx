import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { Monitor, MonitorUp, Video, VideoOff, Mic, MicOff, MessageSquare, PenTool, LogOut, Circle, Smile, X, StopCircle, Play, Activity, Users, UserPlus, Settings, Layout, Copy, Check } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('video'); // video | whiteboard
  const [sidePanel, setSidePanel] = useState('chat'); // chat | users
  
  const [stream, setStream] = useState(null);
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
  
  useEffect(() => {
    if (!socket || !user) return;
    
    // Request media access
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        socket.emit('join-room', roomId, user.username);
      })
      .catch(err => {
        console.error('Failed to get local stream', err);
        // Fallback for users without camera/mic
        socket.emit('join-room', roomId, user.username);
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      socket.off('room-users');
      socket.off('user-connected');
      socket.off('user-disconnected');
    };
  }, [roomId, socket, user]);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };
  
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        // When user clicks 'Stop sharing' on browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
        
        // We will pass an event or flag to VideoGrid to replace tracks, 
        // but for now, we'll just emit an event to socket or handle it in VideoGrid.
        // For simplicity, we can set a state that VideoGrid watches.
        setIsScreenSharing(true);
        // Dispatching a custom event to tell VideoGrid to switch track
        window.dispatchEvent(new CustomEvent('switch-track', { detail: { track: screenStream.getVideoTracks()[0] } }));
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (stream) {
      window.dispatchEvent(new CustomEvent('switch-track', { detail: { track: stream.getVideoTracks()[0] } }));
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // Record the screen to capture the whole meeting view
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
          mediaRecorder.stop();
        };
      } catch (err) {
        console.error("Error starting recording", err);
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
    navigate('/');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    
    setInviteStatus('sending');
    setTimeout(() => {
      setInviteStatus('sent');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus('');
        setInviteInput('');
      }, 2000);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="room-container">
        <div className="main-stage">
          <div className="top-bar">
            <div className="room-title">Meeting Room: {roomId}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn" onClick={copyRoomLink} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                {linkCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {linkCopied ? 'Copied' : 'Copy Link'}
              </button>
              <div className="live-badge">
                <div className="live-dot"></div> Live
              </div>
            </div>
          </div>

          {activeTab === 'video' ? (
            <VideoGrid localStream={stream} roomId={roomId} isScreenSharing={isScreenSharing} />
          ) : (
            <Whiteboard roomId={roomId} />
          )}
          
          {/* Bottom Features Bar */}
          <div className="bottom-features-bar" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-secondary)', flex: 1 }}>
              <Play size={20} />
              <Activity size={24} />
              <span style={{ fontSize: '0.8rem' }}>01:36</span>
            </div>

            {/* Center Controls */}
            <div className="controls-bar" style={{ display: 'flex', gap: '1.25rem', margin: '0 auto', boxShadow: 'none', border: 'none', background: 'transparent', padding: 0 }}>
              {/* React */}
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
                <button className="btn-icon" onClick={() => setShowReactions(!showReactions)} title="React">
                  <Smile size={24} />
                </button>
              </div>

              {/* Mic */}
              <button className={`btn-icon ${isAudioMuted ? 'btn-icon-danger' : ''}`} onClick={toggleAudio} title="Toggle Mic">
                {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              {/* Leave - Red circle in middle */}
              <button className="btn-icon leave-btn" onClick={leaveRoom} style={{ width: '64px', height: '64px', borderRadius: '50%' }} title="Leave Room">
                <StopCircle size={28} />
              </button>

              {/* Camera */}
              <button className={`btn-icon ${isVideoMuted ? 'btn-icon-danger' : ''}`} onClick={toggleVideo} title="Toggle Camera">
                {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              {/* Share */}
              <button className={`btn-icon ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare} title="Share Screen">
                {isScreenSharing ? <Monitor size={24} /> : <MonitorUp size={24} />}
              </button>
            </div>
            
            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'flex-end' }}>
              <button className="feature-btn" onClick={() => setActiveTab(activeTab === 'video' ? 'whiteboard' : 'video')}>
                <Layout size={18} />
                <span className="hide-on-mobile">{activeTab === 'video' ? 'Whiteboard' : 'Video'}</span>
              </button>

              <div 
                className={`feature-btn hide-on-mobile ${sidePanel === 'users' ? 'active' : ''}`} 
                onClick={() => setSidePanel(sidePanel === 'users' ? 'chat' : 'users')}
                style={{ cursor: 'pointer' }}
              >
                <Users size={18} />
                <span style={{ opacity: 0.8, marginLeft: '4px' }}>{usersInRoom.length + 1}</span>
              </div>
              
              <div className="feature-btn hide-on-mobile" onClick={() => setShowInviteModal(true)} style={{ cursor: 'pointer' }}>
                <UserPlus size={18} />
              </div>
              
              <div style={{ color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '10px' }}>
                <Settings size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="side-panel dark-panel">
          <div className="side-panel-header">
            <span className="side-panel-title">Group chat</span>
            <button className="btn-icon" style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={() => setSidePanel(sidePanel === 'chat' ? 'users' : 'chat')}>
              {sidePanel === 'chat' ? <Users size={16} /> : <MessageSquare size={16} />}
            </button>
          </div>
          
          {sidePanel === 'chat' && <Chat roomId={roomId} />}
          {sidePanel === 'users' && (
            <div style={{ padding: '1rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.username} (You)</div>
                </div>
              </div>
              
              {usersInRoom.map(u => (
                <div key={u.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.username}</div>
                  </div>
                </div>
              ))}
              
              {usersInRoom.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem' }}>
                  You are the only one here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowInviteModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>Invite someone</h3>
            
            <form onSubmit={handleSendInvite}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Email or Phone Number
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. user@gmail.com or +1 234..."
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn" 
                disabled={inviteStatus !== ''}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  background: inviteStatus === 'sent' ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: inviteStatus !== '' ? 'not-allowed' : 'pointer'
                }}
              >
                {inviteStatus === 'sending' ? 'Sending...' : inviteStatus === 'sent' ? 'Invite Sent!' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
