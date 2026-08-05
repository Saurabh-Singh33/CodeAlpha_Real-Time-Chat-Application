import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, ChevronRight, Mail, Phone, ChevronDown, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'General',
    message: '',
    botField: '' // Honeypot field
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { question: "Is it really free?", answer: "Yes, VartaConnect is completely free to use with no hidden charges for basic real-time communication." },
    { question: "How do I secure my data?", answer: "All video and audio streams are encrypted end-to-end using industry-standard WebRTC protocols." },
    { question: "Do I need to download an app?", answer: "No! VartaConnect runs directly in your modern web browser. We also have mobile apps if you prefer." },
    { question: "How many people can join a room?", answer: "Currently, we support up to 50 active participants in a single high-definition video room." }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.botField) {
      // Honeypot triggered, ignore submission quietly
      setStatus({ type: 'success', message: 'Your message has been sent! We\'ll reply shortly.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus({ type: 'success', message: 'Your message has been sent! We\'ll reply shortly.' });
        setFormData({ name: '', email: '', subject: '', category: 'General', message: '', botField: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send message. Please try again later.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", "Roboto", sans-serif', backgroundColor: '#ffffff', color: '#202124', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Global Header */}
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

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <div style={{ padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', color: '#5f6368', fontSize: '0.9rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1A73E8', cursor: 'pointer' }}>Home</Link> <span style={{ margin: '0 0.5rem' }}>/</span> Contact Us
          </div>
        </div>
        <div style={{ padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#1A73E8', marginBottom: '1rem', letterSpacing: '-0.02em', fontFamily: '"Inter", "Roboto", sans-serif' }}>
              Contact Us
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#5f6368', maxWidth: '600px', margin: '0 auto' }}>
              Have questions or need support? We're here to help you get the most out of VartaConnect.
            </p>
          </div>

          {/* Split Screen Layout */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'flex-start', marginBottom: '6rem' }}>
            
            {/* Left Side: Contact Info & Trust Signals */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#202124', marginBottom: '1rem' }}>Get in Touch</h2>
                <p style={{ fontSize: '1.1rem', color: '#5f6368', lineHeight: '1.6' }}>
                  Got a question? We're real humans. We'll reply within 1-2 hours during business days.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                <a href="mailto:support@vartaconnect.com" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: '#202124', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Email Us</h3>
                    <p style={{ color: '#5f6368', fontSize: '0.95rem' }}>support@vartaconnect.com</p>
                  </div>
                </a>

                <a href="tel:+18005551234" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: '#202124', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s' }}>
                  <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '12px', color: '#1A73E8' }}>
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Call Us</h3>
                    <p style={{ color: '#5f6368', fontSize: '0.95rem' }}>+1 (800) 555-1234</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Side: Contact Form */}
            <div style={{ flex: '1 1 500px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              
              {status.message && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                  backgroundColor: status.type === 'success' ? '#e6f4ea' : '#fce8e6',
                  color: status.type === 'success' ? '#137333' : '#c5221f'
                }}>
                  {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <span style={{ fontWeight: '500' }}>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Honeypot field - hidden from users */}
                <div style={{ display: 'none' }}>
                  <label>Leave this field empty</label>
                  <input type="text" name="botField" value={formData.botField} onChange={handleChange} tabIndex="-1" autoComplete="off" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#202124', fontSize: '0.95rem' }}>What is this regarding?</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange}
                      style={{ 
                        width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d2d6dc', 
                        fontSize: '1rem', appearance: 'none', backgroundColor: '#fff', outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="General">General Inquiry</option>
                      <option value="Support">Technical Support</option>
                      <option value="Billing">Billing & Sales</option>
                    </select>
                    <ChevronDown size={18} color="#5f6368" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#202124', fontSize: '0.95rem' }}>Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Kailash kumawat" 
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d2d6dc', fontSize: '1rem', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#202124', fontSize: '0.95rem' }}>Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="kailash@example.com" 
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d2d6dc', fontSize: '1rem', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#202124', fontSize: '0.95rem' }}>Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?" 
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d2d6dc', fontSize: '1rem', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#202124', fontSize: '0.95rem' }}>Message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5" 
                    placeholder="Type your message here..." 
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d2d6dc', fontSize: '1rem', resize: 'vertical', outline: 'none' }}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    background: '#1A73E8', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', 
                    fontWeight: '600', fontSize: '1.05rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    marginTop: '0.5rem', transition: 'background-color 0.2s', opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div style={{ maxWidth: '800px', margin: '0 auto', marginTop: '4rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#202124', marginBottom: '2rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqs.map((faq, index) => (
                <div key={index} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{ 
                      width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: '1.1rem', fontWeight: '600', color: '#202124'
                    }}
                  >
                    {faq.question}
                    <ChevronDown size={20} color="#5f6368" style={{ transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                  </button>
                  <div style={{ 
                    padding: openFaq === index ? '0 1.5rem 1.5rem' : '0', 
                    maxHeight: openFaq === index ? '200px' : '0', 
                    overflow: 'hidden', transition: 'all 0.3s ease-in-out',
                    color: '#5f6368', lineHeight: '1.6'
                  }}>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
        </div>
      </main>

      {/* Standard Footer */}
      <footer style={{ backgroundColor: '#ffffff', padding: '4rem 2rem 2rem', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1A73E8', fontWeight: '700', fontSize: '1.5rem', marginBottom: '1rem' }}>
                <Video size={32} />
                <span>VartaConnect</span>
              </div>
              <p style={{ color: '#5f6368', lineHeight: '1.6', maxWidth: '300px' }}>
                Empowering real-time communication for students, professionals, and remote teams everywhere.
              </p>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ fontWeight: '700', color: '#202124', marginBottom: '1.25rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link to="/" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Home</Link></li>
                <li><Link to="/services" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Services</Link></li>
                <li><Link to="/about" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>About</Link></li>
                <li><Link to="/contact" style={{ color: '#5f6368', textDecoration: 'none', transition: 'color 0.2s' }}>Contact</Link></li>
              </ul>
            </div>

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

      {/* Floating Chat Widget Placeholder */}
      <div 
        onClick={() => alert("Live Chat Widget would open here. Integrate Tawk.to or Crisp in production.")}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px',
          backgroundColor: '#1A73E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', boxShadow: '0 8px 24px rgba(26,115,232,0.4)', cursor: 'pointer', zIndex: 100, transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={28} />
      </div>

    </div>
  );
}
