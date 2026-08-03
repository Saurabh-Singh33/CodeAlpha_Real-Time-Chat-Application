import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function AiChatbotPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
      <div style={{ background: 'var(--bg-card-solid)', width: '100%', maxWidth: '600px', height: '600px', borderRadius: '8px', border: '1px solid var(--border-glass-strong)', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass-strong)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#e8f0fe', color: '#1A73E8', padding: '8px', borderRadius: '50%' }}>
            <MessageSquare size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#202124', fontWeight: '500' }}>Varta AI Assistant</h2>
        </div>
        
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5F6368', background: '#F8F9FA' }}>
          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>The AI Chatbot is currently under development.</p>
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Check back soon for intelligent meeting summaries and real-time assistance!</p>
        </div>
        
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8F9FA', border: '1px solid #dadce0', borderRadius: '24px', padding: '0.75rem 1rem' }}>
            <input type="text" placeholder="Type a message..." disabled style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: '#5F6368' }} />
          </div>
        </div>

      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ color: '#1A73E8', textDecoration: 'none', fontWeight: '500' }}>Back to Home</Link>
      </div>
    </div>
  );
}
