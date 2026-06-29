import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import { Monitor, MonitorUp, Video, VideoOff, Mic, MicOff, MessageSquare, PenTool, LogOut, Circle, Smile, X, StopCircle } from 'lucide-react';

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
          {activeTab === 'video' ? (
            <VideoGrid localStream={stream} roomId={roomId} isScreenSharing={isScreenSharing} />
          ) : (
            <Whiteboard roomId={roomId} />
          )}
          
          <div className="controls-bar">
            {/* Record */}
            <div style={{ position: 'relative' }}>
              <button className={`btn-icon ${isRecording ? 'btn-icon-danger' : ''}`} onClick={toggleRecording}>
                {isRecording ? <StopCircle size={22} /> : <Circle size={22} />}
                <span>Record</span>
              </button>
            </div>

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
              <button className="btn-icon" onClick={() => setShowReactions(!showReactions)}>
                <Smile size={22} />
                <span>React</span>
              </button>
            </div>

            {/* Mic */}
            <button className={`btn-icon ${isAudioMuted ? 'btn-icon-danger' : ''}`} onClick={toggleAudio}>
              {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
              <span>Mic</span>
            </button>
            
            {/* Camera */}
            <button className={`btn-icon ${isVideoMuted ? 'btn-icon-danger' : ''}`} onClick={toggleVideo}>
              {isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
              <span>Camera</span>
            </button>

            {/* Share */}
            <button className={`btn-icon ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
              {isScreenSharing ? <Monitor size={22} /> : <MonitorUp size={22} />}
              <span>Share</span>
            </button>

            {/* Leave */}
            <button className="btn-icon leave-btn" onClick={leaveRoom}>
              <X size={22} />
              <span>Leave</span>
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
