import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { Monitor, Video, VideoOff, Mic, MicOff, MessageSquare, PenTool, LogOut } from 'lucide-react';

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
  
  const leaveRoom = () => {
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Video color="var(--accent-primary)" />
          <span>Room: {roomId}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn ${activeTab === 'video' ? 'btn-primary' : 'glass-panel'}`} onClick={() => setActiveTab('video')}>
            <Video size={18} /> Video
          </button>
          <button className={`btn ${activeTab === 'whiteboard' ? 'btn-primary' : 'glass-panel'}`} onClick={() => setActiveTab('whiteboard')}>
            <PenTool size={18} /> Whiteboard
          </button>
        </div>
        <button className="btn btn-danger" onClick={leaveRoom}>
          <LogOut size={18} /> Leave
        </button>
      </header>

      <div className="room-container">
        <div className="main-stage">
          {activeTab === 'video' ? (
            <VideoGrid localStream={stream} roomId={roomId} />
          ) : (
            <Whiteboard roomId={roomId} />
          )}
          
          <div className="controls-bar glass-panel">
            <button className="btn btn-icon" onClick={toggleAudio} style={{ background: isAudioMuted ? 'var(--accent-danger)' : 'rgba(255,255,255,0.1)' }}>
              {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button className="btn btn-icon" onClick={toggleVideo} style={{ background: isVideoMuted ? 'var(--accent-danger)' : 'rgba(255,255,255,0.1)' }}>
              {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          </div>
        </div>

        <div className="side-panel glass-panel">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              style={{ flex: 1, padding: '1rem', background: sidePanel === 'chat' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              onClick={() => setSidePanel('chat')}
            >
              Chat & Files
            </button>
          </div>
          
          {sidePanel === 'chat' && <Chat roomId={roomId} />}
        </div>
      </div>
    </div>
  );
}
