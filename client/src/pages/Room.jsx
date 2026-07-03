import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { Monitor, MonitorUp, Video, VideoOff, Mic, MicOff, MessageSquare, PenTool, LogOut, Circle, Smile, X, StopCircle, Play, Activity, Users, UserPlus, Settings, Layout } from 'lucide-react';

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
      
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="room-container">
        <div className="main-stage">
          <div className="top-bar">
            <div className="room-title">Overview of new real estate proposals</div>
            <div className="live-badge">
              <div className="live-dot"></div> Live
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

              <div className="feature-btn hide-on-mobile">
                <Users size={18} />
                <span style={{ opacity: 0.5, marginLeft: '4px' }}>34+</span>
              </div>
              
              <div className="feature-btn hide-on-mobile">
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
          {sidePanel === 'users' && <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Users list placeholder</div>}
        </div>
      </div>
    </div>
  );
}
