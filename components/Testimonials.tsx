'use client';

import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'This experience changed my life for the better. I broke chains. I broke free of the past because of Model Mugging.',
      initials: 'GM',
      name: 'Graduate M.',
      role: 'Course Graduate',
    },
    {
      quote: 'I am really out of shape and couldn\'t believe I could handle two days of physical activity. I really do feel empowered — it is so encouraging to feel I can protect myself.',
      initials: 'C',
      name: 'Cameron',
      role: '2025 Graduate',
    },
    {
      quote: 'After the course, my chronic stress level went down. I was more prepared and less afraid. I wish I had taken this 20 years ago. I am sending my daughters.',
      initials: 'JL',
      name: 'Jennifer L.',
      role: 'Course Graduate',
    },
  ];

  return (
    <section className="bg-[#FFFFFF] relative overflow-hidden" style={{ paddingTop: '112px', paddingBottom: '112px' }}>
      {/* Large decorative quote marks background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Georgia, serif',
          fontSize: '400px',
          fontWeight: 900,
          color: 'rgba(27,58,140,0.03)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: '0.8',
        }}
      >
        {'\u201C'}{'\u201D'}
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <div
            style={{
              display: 'inline-block',
              background: '#E8F4FD',
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
            GRADUATE STORIES
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '800',
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              color: '#1B3A8C',
              marginBottom: '16px',
            }}
          >
            Lives changed. In a weekend.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '400',
              fontSize: '17px',
              lineHeight: '1.8',
              color: '#64748B',
            }}
          >
            The most common thing our graduates say: 'This course changed my life.'
          </p>
        </motion.div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              style={{
                background: 'white',
                borderTop: '3px solid #00AEEF',
                borderBottom: '1px solid #F1F5F9',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: '0',
                padding: '40px 36px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderTopColor = '#0090C5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTopColor = '#00AEEF';
              }}
            >
              {/* Cyan left bar + Quote Text */}
              <div
                style={{
                  borderLeft: '3px solid #00AEEF',
                  paddingLeft: '20px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontStyle: 'italic',
                    fontWeight: '400',
                    fontSize: '18px',
                    color: '#1E293B',
                    lineHeight: '1.9',
                  }}
                >
                  {testimonial.quote}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '24px' }} />

              {/* Author */}
              <div className="flex items-center gap-3.5">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1B3A8C, #00AEEF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#1B3A8C' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-xs" style={{ color: '#94A3B8' }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 font-semibold text-sm transition-all"
            style={{ color: '#00AEEF' }}
            onMouseEnter={(e) => (e.currentTarget.style.gap = '10px')}
            onMouseLeave={(e) => (e.currentTarget.style.gap = '6px')}
          >
            Read More Stories <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
