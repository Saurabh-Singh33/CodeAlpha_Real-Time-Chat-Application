import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '4rem 2rem', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#1A73E8' }}>About VartaConnect</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          VartaConnect is a premium video conferencing solution designed to bring teams and individuals closer together. 
          Originally engineered for secure business meetings, we've made our core features free and available for everyone.
        </p>
        <Link to="/" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#1A73E8', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '500' }}>Back to Home</Link>
      </div>
    </div>
  );
}
