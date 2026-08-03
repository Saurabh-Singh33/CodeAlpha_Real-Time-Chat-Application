import React from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '4rem 2rem', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#1A73E8', textAlign: 'center' }}>Contact Us</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Have questions or need support? We're here to help.
        </p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card-solid)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-glass-strong)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#5F6368' }}>Name</label>
            <input type="text" placeholder="Your name" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#5F6368' }}>Email</label>
            <input type="email" placeholder="Your email" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#5F6368' }}>Message</label>
            <textarea rows="5" placeholder="How can we help?" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '1rem', resize: 'vertical' }}></textarea>
          </div>
          <button type="button" style={{ background: '#1A73E8', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>
            Send Message
          </button>
        </form>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#1A73E8', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
