'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Principles() {
  const [activeTab, setActiveTab] = useState(0);

  const principles = [
    {
      title: 'Crime Is an Emotional & Physical Problem',
      desc: 'Understanding how and why predators select their targets — criminal psychology, behavioral cues, and predator motivations — is the foundation of all effective prevention.',
    },
    {
      title: 'Know Your Options',
      desc: 'From verbal de-escalation and escape to full physical force — having a complete spectrum of options and knowing when to apply each one is what real empowerment looks like.',
    },
    {
      title: 'Proper Preparation',
      desc: 'Martial science applied: building muscle memory through realistic adrenaline-state repetition so that skills are available under real pressure — not just in a calm gym.',
    },
    {
      title: 'Mind, Body & Spirit Are One',
      desc: 'Fear, confidence, emotional history, and physical capability are inseparable. Model Mugging addresses all of them together — never treating the body and mind as separate problems.',
    },
    {
      title: 'Awareness — The Final Shield',
      desc: 'Situational awareness of your environment, your own body language, and potential threats is the most powerful — and most overlooked — form of self-defense.',
    },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: '#0D2260', paddingTop: '112px', paddingBottom: '112px' }} id="principles">
      {/* Decorative watermark background */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: 0,
          right: 0,
          fontFamily: 'var(--font-display)',
          fontSize: '200px',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.02)',
          letterSpacing: '0.5em',
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        I II III IV V
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0,174,239,0.15)',
              color: '#00AEEF',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '6px 16px',
              borderRadius: '999px',
              marginBottom: '20px',
            }}
          >
            THE FRAMEWORK
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '800',
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              color: 'white',
              marginBottom: '16px',
            }}
          >
            Five principles that underpin everything.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '400',
              fontSize: '17px',
              lineHeight: '1.8',
              marginBottom: '48px',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Self-defense is not just technique. It is a complete system — understanding crime, preparing your body and mind, and staying aware before, during, and after a threat.
          </p>
        </motion.div>

        {/* Tab Row */}
        <div
          style={{
            display: 'inline-flex',
            gap: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            padding: '8px',
            marginBottom: '32px',
          }}
        >
          {[1, 2, 3, 4, 5].map((num, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTab(idx)}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '900',
                  fontSize: '28px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: activeTab === idx ? 'rgba(0,174,239,0.2)' : 'transparent',
                  color: activeTab === idx ? '#00AEEF' : 'rgba(255,255,255,0.2)',
                  boxShadow: activeTab === idx ? '0 0 20px rgba(0,174,239,0.2)' : 'none',
                }}
              >
                {activeTab === idx ? (activeTab + 1) : String.fromCharCode(73 + idx)}
              </button>
              {/* Cyan dot indicator */}
              {activeTab === idx && (
                <motion.div
                  layoutId="indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    background: '#00AEEF',
                    borderRadius: '50%',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Panel */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            borderLeft: '4px solid #00AEEF',
            borderRadius: '0 16px 16px 0',
            padding: '40px 48px',
            minHeight: '180px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative background number */}
          <div
            className="absolute pointer-events-none select-none"
            style={{
              top: '-10px',
              right: '24px',
              fontFamily: 'var(--font-display)',
              fontSize: '110px',
              fontWeight: 900,
              color: 'rgba(0,174,239,0.05)',
              lineHeight: 1,
            }}
          >
            {activeTab + 1}
          </div>

          {/* Animated Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="relative z-10"
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '26px',
                  color: 'white',
                  marginBottom: '12px',
                }}
              >
                {principles[activeTab].title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '400',
                  fontSize: '17px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: '1.85',
                  maxWidth: '620px',
                }}
              >
                {principles[activeTab].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
