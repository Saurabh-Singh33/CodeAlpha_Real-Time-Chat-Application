import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Send, Paperclip, Download, X } from 'lucide-react';

export default function Chat({ roomId }) {
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
                alignItems: isSelf ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3px', padding: '0 4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {isSelf ? 'You' : msg.sender}
                  </span>
                  {msg.timestamp && (
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>

                <div className={`message ${isSelf ? 'self' : ''}`}>
                  {msg.type === 'text' ? (
                    msg.text
                  ) : isImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <img 
                        src={msg.fileData} 
                        alt={msg.fileName} 
                        onClick={() => setSelectedImage(msg.fileData)}
                        style={{ 
                          maxWidth: '220px', 
                          maxHeight: '180px', 
                          borderRadius: '10px', 
                          objectFit: 'cover', 
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.2)' 
                        }} 
                      />
                      <a 
                        href={msg.fileData} 
                        download={msg.fileName} 
                        style={{ fontSize: '0.75rem', color: isSelf ? '#e0e7ff' : 'var(--accent-indigo)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Download size={12} /> {msg.fileName}
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Paperclip size={16} />
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {msg.fileName}
                      </div>
                      <a 
                        href={msg.fileData} 
                        download={msg.fileName} 
                        style={{ color: isSelf ? '#fff' : 'var(--accent-indigo)', padding: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}
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
      <form onSubmit={sendMessage} className="chat-input">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
        />
        <button 
          type="button" 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image or File"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: input.trim() ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.1)', 
            color: 'white', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
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
