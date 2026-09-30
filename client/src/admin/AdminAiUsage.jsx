import React from 'react';
import { Sparkles } from 'lucide-react';
import './admin.css';

function AdminAiUsage() {
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} style={{ color: '#A855F7' }} /> AI Usage & Analytics
          </h1>
          <p className="admin-subtext">Monitor Gemini API consumption, quotas, and AI-generated summaries across VartaConnect.</p>
        </div>
      </div>
      
      <div className="admin-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Sparkles size={48} style={{ color: '#E4E4E7', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#18181B' }}>Coming Soon: Phase 2</h3>
        <p style={{ color: '#71717A', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          Detailed AI token analytics, cost estimations, and per-meeting summary breakdowns will be available in the upcoming release.
        </p>
      </div>
    </div>
  );
}

export default AdminAiUsage;
