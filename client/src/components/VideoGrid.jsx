import React, { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function VideoGrid({ localStream, roomId, isScreenSharing }) {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [peers, setPeers] = useState({}); // { socketId: { stream, username } }
  const peersRef = useRef({});
  const localVideoRef = useRef();
  const [reactions, setReactions] = useState({}); // { socketId: { emoji, id } }

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle track switching for screen share
  useEffect(() => {
    const handleSwitchTrack = (e) => {
      const newTrack = e.detail.track;
      
      // Update peers
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      });
      
      // Update local video element
      if (localVideoRef.current) {
        if (newTrack.kind === 'video') {
           const tracks = [newTrack];
           if (localStream) {
             const audioTrack = localStream.getAudioTracks()[0];
             if (audioTrack) tracks.push(audioTrack);
           }
           localVideoRef.current.srcObject = new MediaStream(tracks);
        }
      }
    };
    
    window.addEventListener('switch-track', handleSwitchTrack);
    return () => window.removeEventListener('switch-track', handleSwitchTrack);
  }, [localStream]);

  // Handle reactions
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
      }, 2000);
    };

    socket.on('reaction', handleReaction);
    return () => socket.off('reaction', handleReaction);
  }, [socket]);


  useEffect(() => {
    if (!socket || !localStream) return;

    const createPeerConnection = (targetSocketId, username, initiator) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local tracks
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

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
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', { target: targetSocketId, sdp: offer });
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
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { target: caller, sdp: answer });
    });

    // When someone answers
    socket.on('answer', async ({ caller, sdp }) => {
      const pc = peersRef.current[caller];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', async ({ caller, candidate }) => {
      const pc = peersRef.current[caller];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // User disconnected
    socket.on('user-disconnected', (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
        
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
  }, [socket, localStream]);

  return (
    <div className="video-grid">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline muted style={{ objectFit: isScreenSharing ? 'contain' : 'cover' }} />
        <div className="video-label">{user?.username} (You)</div>
        {reactions[socket?.id] && (
          <div className="reaction-overlay" key={reactions[socket.id].id}>
            {reactions[socket.id].emoji}
          </div>
        )}
      </div>
      
      {Object.entries(peers).map(([socketId, peerData]) => (
        <RemoteVideo 
          key={socketId} 
          stream={peerData.stream} 
          username={peerData.username} 
          reaction={reactions[socketId]}
        />
      ))}
    </div>
  );
}

function RemoteVideo({ stream, username, reaction }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      <video ref={videoRef} autoPlay playsInline />
      <div className="video-label">{username}</div>
      {reaction && (
        <div className="reaction-overlay" key={reaction.id}>
          {reaction.emoji}
        </div>
      )}
    </div>
  );
}
