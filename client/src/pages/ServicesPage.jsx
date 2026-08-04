import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, MessageSquare, Globe, MonitorUp, Smartphone, Infinity, Headset, Video, ChevronRight } from 'lucide-react';

export default function ServicesPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/hero-illustration.png',
    '/varta-carousel-2.png',
    '/varta-hero-mockup.png'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000); // 2 seconds rotation
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={{ fontFamily: '"Inter", "Roboto", sans-serif', backgroundColor: '#ffffff', color: '#202124', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header with Breadcrumb / Navigation */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1A73E8', fontWeight: '700', fontSize: '1.25rem' }}>
          <Video size={28} />
          <span>VartaConnect</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Home <ChevronRight size={16} /> Services
          </Link>
          <Link to="/about" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s' }}>About</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: '500', transition: 'color 0.2s' }}>Contact</Link>
          <Link to="/login" style={{ 
            textDecoration: 'none', backgroundColor: '#1A73E8', color: '#ffffff', 
            padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '500', transition: 'background-color 0.2s' 
          }}>
            Sign In
          </Link>
        </nav>
      </header>

      {/* 2. Main Content */}
      <main style={{ flex: 1, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#1A73E8', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              VartaConnect
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#5f6368', maxWidth: '800px', margin: '0 auto' }}>
              Comprehensive real-time communication built for seamless collaboration.
            </p>
          </div>

          {/* 3. Split Screen Layout */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
            
            {/* Left Side: Services List (2 Column Grid) */}
            <div style={{ flex: '1 1 600px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                
                {/* Feature 1 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>End-to-End Encrypted Video & Voice</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>High-definition calls with zero compromise on privacy.</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>AI Meeting Assistant</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Auto-generated transcripts, real-time note-taking, and actionable meeting summaries.</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Real-time Chat & File Transfer</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Instant messaging with the ability to send images and files directly in the chat window.</p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Low-Latency Global Infrastructure</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Seamless real-time connection across borders.</p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <MonitorUp size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Advanced Collaboration Tools</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Interactive whiteboards, screen sharing, and breakout rooms.</p>
                  </div>
                </div>

                {/* Feature 6 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Cross-Platform Access</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Available on Web, iOS, Android, and Desktop.</p>
                  </div>
                </div>

                {/* Feature 7 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Infinity size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Unlimited Free Usage</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>No time limits for students or professionals.</p>
                  </div>
                </div>

                {/* Feature 8 */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Headset size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>Priority Support</h3>
                    <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>Dedicated 24/7 technical support for all users.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Side: Carousel */}
            <div style={{ flex: '1 1 500px', position: 'relative', height: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
              {slides.map((slide, index) => (
                <div 
                  key={index} 
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: currentSlide === index ? 1 : 0, 
                    transition: 'opacity 0.8s ease-in-out',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa'
                  }}
                >
                  <img src={slide} alt={`VartaConnect Service Mockup ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              ))}
              
              {/* Carousel Indicators */}
              <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '0.5rem', zIndex: 5 }}>
                {slides.map((_, index) => (
                  <button 
                    key={index} 
                    onClick={() => setCurrentSlide(index)}
                    style={{ 
                      width: currentSlide === index ? '24px' : '8px', 
                      height: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: currentSlide === index ? '#1A73E8' : 'rgba(0,0,0,0.2)', 
                      border: 'none', cursor: 'pointer', transition: 'width 0.3s'
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
