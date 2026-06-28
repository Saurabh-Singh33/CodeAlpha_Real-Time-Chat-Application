import React, { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function VideoGrid({ localStream, roomId }) {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [peers, setPeers] = useState({}); // { socketId: { stream, username } }
  const peersRef = useRef({});
  const localVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
        <video ref={localVideoRef} autoPlay playsInline muted />
        <div className="video-label">{user?.username} (You)</div>
      </div>
      
      {Object.entries(peers).map(([socketId, peerData]) => (
        <RemoteVideo key={socketId} stream={peerData.stream} username={peerData.username} />
      ))}
    </div>
  );
}

function RemoteVideo({ stream, username }) {
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
    </div>
  );
}
