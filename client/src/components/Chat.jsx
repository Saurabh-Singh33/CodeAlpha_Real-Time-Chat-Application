import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Send, Paperclip } from 'lucide-react';

export default function Chat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
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
    if (input.trim()) {
      socket.emit('chat-message', {
        type: 'text',
        text: input,
        roomId
      });
      setInput('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      socket.emit('chat-message', {
        type: 'file',
        fileData: evt.target.result,
        fileName: file.name,
        fileType: file.type,
        roomId
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => {
          const isSelf = msg.senderId === socket.id;
          return (
            <div key={index} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: isSelf ? 'flex-end' : 'flex-start'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                {isSelf ? 'You' : msg.sender}
              </span>
              <div className={`message ${isSelf ? 'self' : ''}`}>
                {msg.type === 'text' ? (
                  msg.text
                ) : (
                  <div>
                    <a href={msg.fileData} download={msg.fileName} style={{ color: isSelf ? '#fff' : 'var(--accent-primary)', textDecoration: 'underline' }}>
                      📎 {msg.fileName}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
        />
        <button 
          type="button" 
          className="btn btn-icon" 
          style={{ background: 'rgba(255,255,255,0.1)' }}
          onClick={() => fileInputRef.current.click()}
          title="Attach File"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-icon">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
