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

      {/* 2. Main Content (Pastel Blue Background) */}
      <main style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <div style={{ padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#1A73E8', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                VartaConnect
              </h1>
              <p style={{ fontSize: '1.25rem', color: '#5f6368', maxWidth: '800px', margin: '0 auto' }}>
                Comprehensive real-time communication built for seamless collaboration.
              </p>
            </div>

            {/* 3. Split Screen Layout */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
              
              {/* Left Side: Services List */}
              <div style={{ flex: '1 1 600px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  
                  {[
                    { icon: ShieldCheck, title: "End-to-End Encrypted Video & Voice", desc: "High-definition calls with zero compromise on privacy." },
                    { icon: Sparkles, title: "AI Meeting Assistant", desc: "Auto-generated transcripts, real-time note-taking, and actionable meeting summaries." },
                    { icon: MessageSquare, title: "Real-time Chat & File Transfer", desc: "Instant messaging with the ability to send images and files directly in the chat window." },
                    { icon: Globe, title: "Low-Latency Global Infrastructure", desc: "Seamless real-time connection across borders." },
                    { icon: MonitorUp, title: "Advanced Collaboration Tools", desc: "Interactive whiteboards, screen sharing, and breakout rooms." },
                    { icon: Smartphone, title: "Cross-Platform Access", desc: "Available on Web, iOS, Android, and Desktop." },
                    { icon: Infinity, title: "Unlimited Free Usage", desc: "No time limits for students or professionals." },
                    { icon: Headset, title: "Priority Support", desc: "Dedicated 24/7 technical support for all users." }
                  ].map((feature, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8', flexShrink: 0 }}>
                        <feature.icon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#202124', marginBottom: '0.5rem' }}>{feature.title}</h3>
                        <p style={{ color: '#5f6368', lineHeight: '1.5', fontSize: '0.95rem' }}>{feature.desc}</p>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {/* Right Side: Carousel */}
              <div style={{ flex: '1 1 500px', position: 'relative', height: '480px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
                {slides.map((slide, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      opacity: currentSlide === index ? 1 : 0, 
                      transition: 'opacity 0.8s ease-in-out',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff'
                    }}
                  >
                    <img src={slide} alt={`VartaConnect Service Mockup ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
                
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
        </div>

        {/* New Bottom Banner Section */}
        <section style={{ backgroundColor: '#EEF2FF', padding: '6rem 2rem', marginTop: '4rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1A73E8', marginBottom: '1.5rem' }}>Ready to connect your team?</h2>
            <p style={{ fontSize: '1.125rem', color: '#4f46e5', marginBottom: '3rem', opacity: 0.8 }}>
              Join thousands of professionals and students experiencing seamless real-time communication today.
            </p>
            <Link to="/signup" style={{ 
              display: 'inline-block',
              textDecoration: 'none', backgroundColor: '#1A73E8', color: '#ffffff', 
              padding: '1rem 2.5rem', borderRadius: '8px', fontWeight: '600', fontSize: '1.125rem',
              boxShadow: '0 4px 14px rgba(26,115,232,0.3)', transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              Start a meeting now
            </Link>
          </div>
        </section>
      </main>

      {/* Standard Footer */}
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
