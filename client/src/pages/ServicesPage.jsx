import React from 'react';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '4rem 2rem', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#1A73E8' }}>Our Services</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          VartaConnect offers a robust suite of tools for individuals and enterprises.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem', color: '#5F6368', textAlign: 'left', display: 'inline-block' }}>
          <li style={{ marginBottom: '1rem' }}>✓ Secure End-to-End Encrypted Video Calls</li>
          <li style={{ marginBottom: '1rem' }}>✓ Real-time Chat & Collaboration</li>
          <li style={{ marginBottom: '1rem' }}>✓ Advanced AI Meeting Assistant</li>
          <li style={{ marginBottom: '1rem' }}>✓ Cross-platform Compatibility</li>
        </ul>
        <div style={{ marginTop: '3rem' }}>
          <Link to="/" style={{ padding: '0.75rem 1.5rem', background: '#1A73E8', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '500' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
