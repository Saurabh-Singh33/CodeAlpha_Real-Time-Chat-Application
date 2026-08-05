import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Headset, Video } from 'lucide-react';

export default function About() {
  return (
    <div style={{ fontFamily: '"Inter", "Roboto", sans-serif', backgroundColor: '#ffffff', color: '#202124', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1A73E8', fontWeight: '700', fontSize: '1.25rem', cursor: 'pointer' }}>
          <Video size={28} />
          <span>VartaConnect</span>
        </Link>
        
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
            <Link to="/about" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s' }}>About</Link>
            <Link to="/services" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s' }}>Services</Link>
            <Link to="/contact" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s' }}>Contact Us</Link>
          </div>
          <Link to="/login" className="btn-modern-primary">
            Sign in
          </Link>
          <Link to="/signup" className="btn-modern-secondary">
            Sign up
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <main style={{ flex: 1 }}>
        <div style={{ padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', color: '#5f6368', fontSize: '0.9rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1A73E8', cursor: 'pointer' }}>Home</Link> <span style={{ margin: '0 0.5rem' }}>/</span> About
          </div>
        </div>
        <section style={{ 
          display: 'flex', flexDirection: 'row', alignItems: 'center', 
          maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem', gap: '4rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem', color: '#202124', letterSpacing: '-0.02em' }}>
              Empowering Real-Time Communication For Everyone
            </h1>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.7', color: '#5f6368', marginBottom: '2.5rem' }}>
              VartaConnect is a premium video conferencing and collaboration solution designed to bring teams and individuals closer together. We've engineered it for secure business meetings, but made our core features 100% free for students, professionals, and teams. Backed by enterprise-grade security and responsive 24/7 tech support.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/signup" style={{ 
                textDecoration: 'none', backgroundColor: '#1A73E8', color: '#ffffff', 
                padding: '0.875rem 1.75rem', borderRadius: '8px', fontWeight: '600', fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(26,115,232,0.3)', transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                Start Meeting for Free
              </Link>
              <Link to="/demo" style={{ 
                textDecoration: 'none', backgroundColor: 'transparent', color: '#1A73E8', 
                padding: '0.875rem 1.75rem', borderRadius: '8px', fontWeight: '600', fontSize: '1rem',
                border: '2px solid #1A73E8', transition: 'background-color 0.2s'
              }}>
                View Demo
              </Link>
            </div>
          </div>
          <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/varta-hero-mockup.png" 
              alt="VartaConnect Interface Mockup" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            />
          </div>
        </section>

        {/* 3. "Who We Serve" Section */}
        <section style={{ backgroundColor: '#f8f9fa', padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#202124', letterSpacing: '-0.01em' }}>Who We Serve</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
              {/* Column 1 */}
              <div style={{ backgroundColor: '#ffffff', padding: '3rem 2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center', transition: 'transform 0.3s, box-shadow 0.3s' }}>
                <div style={{ backgroundColor: '#e8f0fe', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1A73E8' }}>
                  <GraduationCap size={36} />
                </div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '1rem', color: '#202124' }}>Free for Students</h3>
                <p style={{ color: '#5f6368', lineHeight: '1.7' }}>We believe education should be accessible. Students get full premium access with no time limits.</p>
              </div>

              {/* Column 2 */}
              <div style={{ backgroundColor: '#ffffff', padding: '3rem 2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center', transition: 'transform 0.3s, box-shadow 0.3s' }}>
                <div style={{ backgroundColor: '#e8f0fe', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1A73E8' }}>
                  <Briefcase size={36} />
                </div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '1rem', color: '#202124' }}>Built for Professionals</h3>
                <p style={{ color: '#5f6368', lineHeight: '1.7' }}>Secure, high-definition meetings for remote teams and enterprise clients.</p>
              </div>

              {/* Column 3 */}
              <div style={{ backgroundColor: '#ffffff', padding: '3rem 2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center', transition: 'transform 0.3s, box-shadow 0.3s' }}>
                <div style={{ backgroundColor: '#e8f0fe', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1A73E8' }}>
                  <Headset size={36} />
                </div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '1rem', color: '#202124' }}>24/7 Tech Support</h3>
                <p style={{ color: '#5f6368', lineHeight: '1.7' }}>Our dedicated support team is always available to help you troubleshoot and ensure seamless communication.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Visual Feature Showcase */}
        <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#202124', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Seamless Collaboration</h2>
          <p style={{ fontSize: '1.25rem', color: '#5f6368', marginBottom: '4rem', maxWidth: '700px', margin: '0 auto 4rem' }}>
            Share ideas visually with integrated image sharing right alongside your live video feed.
          </p>
          <div style={{ position: 'relative', margin: '0 auto', maxWidth: '1000px' }}>
            <img 
              src="/varta-feature-banner.png" 
              alt="Feature Showcase Banner" 
              style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}
            />
          </div>
        </section>
      </main>

      {/* 5. Standard Footer */}
      <footer style={{ backgroundColor: '#ffffff', padding: '4rem 2rem 2rem', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
            {/* Logo Left */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1A73E8', fontWeight: '700', fontSize: '1.5rem', marginBottom: '1rem' }}>
                <Video size={32} />
                <span>VartaConnect</span>
              </div>
              <p style={{ color: '#5f6368', lineHeight: '1.6', maxWidth: '300px' }}>
                Empowering real-time communication for students, professionals, and remote teams everywhere.
              </p>
            </div>

            {/* Quick Links Middle */}
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ fontWeight: '700', color: '#202124', marginBottom: '1.25rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link to="/" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Home</Link></li>
                <li><Link to="/services" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Services</Link></li>
                <li><Link to="/about" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>About</Link></li>
                <li><Link to="/contact" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Contact</Link></li>
              </ul>
            </div>

            {/* Socials Right */}
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ fontWeight: '700', color: '#202124', marginBottom: '1.25rem' }}>Connect</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="#" style={{ color: '#5f6368', transition: 'color 0.2s' }} aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" style={{ color: '#5f6368', transition: 'color 0.2s' }} aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" style={{ color: '#5f6368', transition: 'color 0.2s' }} aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" style={{ color: '#5f6368', transition: 'color 0.2s' }} aria-label="X (Twitter)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '1px', backgroundColor: '#e0e0e0' }}></div>
          <p style={{ color: '#80868b', fontSize: '0.875rem', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} VartaConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
