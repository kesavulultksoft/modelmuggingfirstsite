'use client';

import { motion, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function ImpactStats() {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    let counter = setInterval(() => {
      setCount((prev) => (prev < 97 ? prev + 1 : 97));
    }, 20);
    return () => clearInterval(counter);
  }, [isInView]);

  // Generate random particle positions
  const particles = Array.from({ length: 8 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3,
  }));

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1A3E 0%, #0D2260 40%, #1B3A8C 100%)', paddingTop: '112px', paddingBottom: '112px' }} ref={ref}>
      {/* Animated particles */}
      {particles.map((particle, idx) => (
        <motion.div
          key={idx}
          className="absolute z-0 pointer-events-none rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: 'rgba(0,174,239,0.3)',
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 gap-20 items-center relative z-10">
        {/* LEFT - BIG 97% */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(100px, 14vw, 160px)',
              color: '#FFFFFF',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              marginBottom: '20px',
              display: 'block',
            }}
          >
            {count}%
          </div>
          <div
            style={{
              display: 'block',
              width: '80px',
              height: '3px',
              background: '#00AEEF',
              borderRadius: '2px',
              margin: '20px 0 12px',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.35)',
              display: 'block',
            }}
          >
            SUCCESS RATE
          </div>
        </motion.div>

        {/* RIGHT - COPY */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
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
            PROVEN RESULTS
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
            Of graduates who were physically attacked, fought off their assailant successfully.
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
            Based on 231 reported real-world attacks across 50+ years and 100,000+ graduates. More than 1,000 graduates stopped attacks with voice and body language alone — never throwing a single punch.
          </p>

          {/* 3 Pills */}
          <div className="flex flex-wrap gap-3">
            {['231 reported attacks', '50+ years of data', '100,000+ graduates'].map((pill, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: '3px solid #00AEEF',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
