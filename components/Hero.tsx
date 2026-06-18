'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, Star } from 'lucide-react';

export default function Hero() {
  const stats = [
    { number: '100K+', label: 'WOMEN TRAINED' },
    { number: '97%', label: 'SUCCESS RATE IN REAL ATTACKS' },
    { number: '50+', label: 'YEARS OF APPLIED RESEARCH' },
    { number: '1,000+', label: 'ATTACKERS STOPPED BY VOICE ALONE' },
  ];

  return (
    <section
      className="relative min-h-screen overflow-hidden pt-[72px] flex items-center"
      style={{
        background: 'linear-gradient(135deg, #0B1A3E 0%, #0D2260 50%, #0B1A3E 100%)',
      }}
    >
      {/* Animated Orb 1 - Top Right */}
      <motion.div
        className="absolute z-0 pointer-events-none"
        style={{
          top: '-200px',
          right: '-100px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle at center, rgba(0,174,239,0.15) 0%, rgba(27,58,140,0.08) 40%, transparent 70%)',
          borderRadius: '50%',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated Orb 2 - Bottom Left */}
      <div
        className="absolute z-0 pointer-events-none"
        style={{
          bottom: '-150px',
          left: '-100px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle at center, rgba(0,174,239,0.08) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-[55fr_45fr] gap-16 items-center">
          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full mb-7 border"
              style={{
                background: 'rgba(0,174,239,0.1)',
                borderColor: 'rgba(0,174,239,0.25)',
              }}
            >
              <Sparkles size={14} style={{ color: '#00AEEF' }} />
              <span className="font-semibold text-xs" style={{ color: '#00AEEF' }}>
                The Original Full-Force Self Defense · Est. 1971
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              <div style={{ fontSize: 'clamp(48px, 5.5vw, 72px)', color: 'white', fontWeight: 700, marginBottom: '4px' }}>
                Learn to
              </div>
              <div style={{ fontSize: 'clamp(56px, 7vw, 88px)', color: 'white', fontWeight: 900, marginBottom: '12px' }}>
                Fight Back
              </div>
              <div style={{
                fontSize: 'clamp(56px, 7vw, 88px)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00AEEF 0%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                In a Weekend.
              </div>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mb-10 max-w-sm"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '17px',
                lineHeight: 1.75,
              }}
            >
              Real adrenaline. Real scenarios. Real confidence. Model Mugging trains women to defeat physical assault — not just understand it. No martial arts background required.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex gap-4 mb-7"
            >
              <button
                className="px-8 py-4 rounded-lg font-bold text-white transition-all duration-300"
                style={{
                  background: '#00AEEF',
                  boxShadow: '0 0 32px rgba(0,174,239,0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0090C5';
                  e.currentTarget.style.boxShadow = '0 0 48px rgba(0,174,239,0.55)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00AEEF';
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(0,174,239,0.4)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Find a Class Near You
              </button>
              <button
                className="px-8 py-4 rounded-lg font-semibold text-white transition-all duration-300"
                style={{
                  background: 'transparent',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                How It Works
              </button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex items-center gap-2.5"
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />
              ))}
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                Trusted by 100,000+ graduates since 1971
              </span>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - STATS PANEL */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-3xl p-2 overflow-hidden"
            style={{
              background: 'rgba(13, 34, 96, 0.4) !important',
              backdropFilter: 'blur(24px) !important',
              WebkitBackdropFilter: 'blur(24px) !important',
              border: '1px solid rgba(0, 174, 239, 0.2) !important',
              borderTop: '2px solid rgba(0, 174, 239, 0.4) !important',
            } as any}
          >
            <div className="grid grid-cols-2">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '32px 28px',
                    borderRight: idx % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}
                >
                  <div
                    className="block mb-2.5"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '52px',
                      fontWeight: 900,
                      color: '#00AEEF',
                      lineHeight: 1,
                    }}
                  >
                    {stat.number}
                  </div>
                  <div className="block mb-2.5" style={{ width: '28px', height: '2px', background: '#00AEEF', opacity: 0.4, borderRadius: '2px' }} />
                  <div
                    className="block text-xs uppercase"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      letterSpacing: '0.12em',
                      lineHeight: 1.4,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* SCROLL INDICATOR */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Scroll
          </div>
          <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
        </motion.div>
      </div>
    </section>
  );
}
