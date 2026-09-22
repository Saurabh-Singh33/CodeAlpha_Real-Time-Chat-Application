import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Send, Paperclip, Download, X } from 'lucide-react';

export default function Chat({ roomId, chatEnabled = true }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const { socket } = useContext(SocketContext);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatEnabled) return;
    if (input.trim() && socket) {
      socket.emit('chat-message', {
        type: 'text',
        text: input.trim(),
        roomId
      });
      setInput('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (socket) {
        socket.emit('chat-message', {
          type: 'file',
          fileData: evt.target.result,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          roomId
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_e) {
      return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.85rem' }}>
            No messages yet. Say hello to everyone! 👋
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.senderId === socket?.id;
            const isImage = msg.fileType && msg.fileType.startsWith('image/');
            return (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
                marginBottom: '0.15rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280' }}>
                    {isSelf ? 'You' : msg.sender}
                  </span>
                  {msg.timestamp && (
                    <span style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>
                      • {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>

                <div 
                  className={`message ${isSelf ? 'self' : ''}`}
                  style={{
                    textAlign: isSelf ? 'right' : 'left',
                    color: '#1F2937'
                  }}
                >
                  {msg.type === 'text' ? (
                    msg.text
                  ) : isImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start', gap: '0.4rem' }}>
                      <img 
                        src={msg.fileData} 
                        alt={msg.fileName} 
                        onClick={() => setSelectedImage(msg.fileData)}
                        style={{ 
                          maxWidth: '220px', 
                          maxHeight: '180px', 
                          borderRadius: '8px', 
                          objectFit: 'cover', 
                          cursor: 'pointer',
                          border: '1px solid #E5E7EB' 
                        }} 
                      />
                      <a 
                        href={msg.fileData} 
                        download={msg.fileName} 
                        style={{ fontSize: '0.75rem', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Download size={12} /> {msg.fileName}
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1F2937' }}>
                      <Paperclip size={15} color="#6B7280" />
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {msg.fileName}
                      </div>
                      <a 
                        href={msg.fileData} 
                        download={msg.fileName} 
                        style={{ color: '#2563EB', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        title="Download File"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={sendMessage} className="chat-input" style={{ opacity: chatEnabled ? 1 : 0.6 }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
          disabled={!chatEnabled}
        />
        <button 
          type="button" 
          style={{ background: 'transparent', border: 'none', color: 'var(--rm-text-muted)', cursor: chatEnabled ? 'pointer' : 'not-allowed', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}
          onClick={() => chatEnabled && fileInputRef.current?.click()}
          title="Attach Image or File"
          disabled={!chatEnabled}
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          placeholder={chatEnabled ? "Type a message..." : "Chat is disabled by host"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!chatEnabled}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || !chatEnabled}
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: (input.trim() && chatEnabled) ? 'var(--rm-accent)' : 'rgba(0,0,0,0.1)', 
            color: (input.trim() && chatEnabled) ? 'white' : 'var(--rm-text-muted)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (input.trim() && chatEnabled) ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s'
          }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Image Preview Lightbox Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(8px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 200,
            padding: '2rem' 
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Full view" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: 'var(--shadow-glass)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
