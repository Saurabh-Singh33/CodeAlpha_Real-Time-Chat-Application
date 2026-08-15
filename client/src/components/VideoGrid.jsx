import React, { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { MicOff, VideoOff, Monitor } from 'lucide-react';

export default function VideoGrid({ localStream, isScreenSharing, isVideoMuted, isAudioMuted }) {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [peers, setPeers] = useState({}); // { socketId: { stream, username, isVideoMuted, isAudioMuted } }
  const peersRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const localVideoRef = useRef();
  const [reactions, setReactions] = useState({}); // { socketId: { emoji, id } }
  const [userMediaStates, setUserMediaStates] = useState({}); // { socketId: { isVideoMuted, isAudioMuted } }

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle track switching for screen share
  useEffect(() => {
    const handleSwitchTrack = (e) => {
      const newTrack = e.detail.track;
      
      // Update existing WebRTC peer senders
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video');
        if (sender && newTrack) {
          sender.replaceTrack(newTrack);
        }
      });
      
      // Update local video element
      if (localVideoRef.current && newTrack) {
        const tracks = [newTrack];
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if (audioTrack) tracks.push(audioTrack);
        }
        localVideoRef.current.srcObject = new MediaStream(tracks);
      }
    };
    
    window.addEventListener('switch-track', handleSwitchTrack);
    return () => window.removeEventListener('switch-track', handleSwitchTrack);
  }, [localStream]);

  // Handle reactions & media states from socket
  useEffect(() => {
    if (!socket) return;
    
    const handleReaction = ({ userId, emoji }) => {
      const reactionId = Date.now();
      setReactions(prev => ({
        ...prev,
        [userId]: { emoji, id: reactionId }
      }));
      
      setTimeout(() => {
        setReactions(prev => {
          if (prev[userId]?.id === reactionId) {
            const next = { ...prev };
            delete next[userId];
            return next;
          }
          return prev;
        });
      }, 2200);
    };

    const handleUserMediaState = ({ userId, isVideoMuted, isAudioMuted }) => {
      setUserMediaStates(prev => ({
        ...prev,
        [userId]: { isVideoMuted, isAudioMuted }
      }));
    };

    socket.on('reaction', handleReaction);
    socket.on('user-media-state', handleUserMediaState);

    return () => {
      socket.off('reaction', handleReaction);
      socket.off('user-media-state', handleUserMediaState);
    };
  }, [socket]);

  // WebRTC Signaling with ICE candidate queueing
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  useEffect(() => {
    if (!socket) return;

    const addPendingCandidates = async (targetSocketId, pc) => {
      const pending = pendingCandidatesRef.current[targetSocketId];
      if (pending && pending.length > 0) {
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding pending ICE candidate', e);
          }
        }
        delete pendingCandidatesRef.current[targetSocketId];
      }
    };

    const createPeerConnection = (targetSocketId, username, initiator) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote tracks
      peerConnection.ontrack = (event) => {
        setPeers(prev => ({
          ...prev,
          [targetSocketId]: {
            stream: event.streams[0],
            username: username
          }
        }));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            target: targetSocketId,
            candidate: event.candidate
          });
        }
      };

      if (initiator) {
        peerConnection.createOffer()
          .then(offer => {
            return peerConnection.setLocalDescription(offer);
          })
          .then(() => {
            socket.emit('offer', { target: targetSocketId, sdp: peerConnection.localDescription });
          });
      }

      peersRef.current[targetSocketId] = peerConnection;
      return peerConnection;
    };

    // When someone joins the room
    socket.on('user-connected', ({ userId, username }) => {
      createPeerConnection(userId, username, true);
    });

    // When someone sends an offer
    socket.on('offer', async ({ caller, sdp, username }) => {
      const pc = createPeerConnection(caller, username, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await addPendingCandidates(caller, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { target: caller, sdp: answer });
    });

    // When someone answers
    socket.on('answer', async ({ caller, sdp }) => {
      const pc = peersRef.current[caller];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await addPendingCandidates(caller, pc);
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', async ({ caller, candidate }) => {
      const pc = peersRef.current[caller];
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      } else {
        if (!pendingCandidatesRef.current[caller]) {
          pendingCandidatesRef.current[caller] = [];
        }
        pendingCandidatesRef.current[caller].push(candidate);
      }
    });

    // User disconnected
    socket.on('user-disconnected', (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
        delete pendingCandidatesRef.current[userId];
        
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
      }
    });

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
    };
  }, [socket]);

  return (
    <div className="video-grid">
      {/* Local User Tile */}
      <div className="video-container">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ display: isVideoMuted ? 'none' : 'block', objectFit: isScreenSharing ? 'contain' : 'cover', width: '100%', height: '100%' }} 
        />
        {isVideoMuted && (
          <div className="avatar-fallback">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="video-label">
          {user?.username} (You)
          {isAudioMuted && <span className="video-status-icon"><MicOff size={12} /></span>}
          {isVideoMuted && <span className="video-status-icon"><VideoOff size={12} /></span>}
          {isScreenSharing && <span className="video-status-icon" style={{ background: 'rgba(99, 102, 241, 0.3)', color: 'var(--accent-indigo)' }}><Monitor size={12} /></span>}
        </div>
        {reactions[socket?.id] && (
          <div className="reaction-overlay" key={reactions[socket.id].id}>
            {reactions[socket.id].emoji}
          </div>
        )}
      </div>
      
      {/* Remote Users Tiles */}
      {Object.entries(peers).map(([socketId, peerData]) => {
        const mediaState = userMediaStates[socketId] || {};
        return (
          <RemoteVideo 
            key={socketId} 
            stream={peerData.stream} 
            username={peerData.username} 
            reaction={reactions[socketId]}
            isVideoMuted={mediaState.isVideoMuted}
            isAudioMuted={mediaState.isAudioMuted}
          />
        );
      })}
    </div>
  );
}

function RemoteVideo({ stream, username, reaction, isVideoMuted, isAudioMuted }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ display: isVideoMuted ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      {isVideoMuted && (
        <div className="avatar-fallback">
          {username?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="video-label">
        {username}
        {isAudioMuted && <span className="video-status-icon"><MicOff size={12} /></span>}
        {isVideoMuted && <span className="video-status-icon"><VideoOff size={12} /></span>}
      </div>
      {reaction && (
        <div className="reaction-overlay" key={reaction.id}>
          {reaction.emoji}
        </div>
      )}
    </div>
  );
}
