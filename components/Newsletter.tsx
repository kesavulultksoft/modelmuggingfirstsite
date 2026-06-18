'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section style={{ background: '#00AEEF', position: 'relative', overflow: 'hidden', paddingTop: '80px', paddingBottom: '80px' }}>
      {/* Wave divider at TOP */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
          <path fill="#F8FAFC" d="M0,40 C360,80 1080,0 1440,40 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 gap-20 items-center">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <Bell size={40} className="text-white mb-4" />
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Stay ahead. Stay safe.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '360px' }}>
            Get notified when new courses are scheduled near you. No spam — just class dates and safety updates.
          </p>
        </motion.div>

        {/* RIGHT - FORM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-white mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Thank you!</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)' }}>Check your email for updates.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Email Input */}
              <input
                type="email"
                placeholder="Email address"
                required
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)',
                  color: '#1E293B',
                  width: '100%',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,34,96,0.2)')}
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              />

              {/* City & State Row */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  required
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    fontSize: '15px',
                    fontFamily: 'var(--font-sans)',
                    color: '#1E293B',
                    width: '100%',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,34,96,0.2)')}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                />
                <input
                  type="text"
                  placeholder="State"
                  required
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    fontSize: '15px',
                    fontFamily: 'var(--font-sans)',
                    color: '#1E293B',
                    width: '100%',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,34,96,0.2)')}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                style={{
                  background: '#0D2260',
                  color: 'white',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '15px',
                  fontWeight: '700',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3A8C')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0D2260')}
              >
                Notify Me
              </button>

              {/* Checkmarks Row */}
              <div className="flex gap-5 mt-3">
                {['Free', 'No spam', 'Unsubscribe anytime'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-white" />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
