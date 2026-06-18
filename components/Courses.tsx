'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Sunset, Star, ArrowRight } from 'lucide-react';

export default function Courses() {
  const courses = [
    {
      icon: Shield,
      badge: { text: 'MOST POPULAR', bg: '#00AEEF', color: '#0D2260' },
      name: "Women's Basic Course",
      desc: "The flagship 2-day program. Full-force scenarios, crime prevention education, and verbal de-escalation skills. No experience required.",
      duration: 'Weekend · Ages 16+',
      hasBadge: true,
    },
    {
      icon: Zap,
      badge: { text: 'ADVANCED', bg: 'rgba(255,255,255,0.1)', color: 'white' },
      name: 'Advanced Course',
      desc: 'Armed assailants and multiple attackers. Built on your Basic course foundation. The next level of protection.',
      duration: 'Weekend · Graduates Only',
    },
    {
      icon: Sunset,
      badge: { text: 'RETREAT', bg: '#F59E0B', color: '#451A03' },
      name: 'Retreat Format',
      desc: 'Basic course with accommodation included. A deeper, more immersive experience with overnight stay.',
      duration: 'Overnight · All Levels',
    },
    {
      icon: Star,
      badge: { text: 'YOUTH', bg: 'rgba(0,174,239,0.15)', color: '#00AEEF' },
      name: 'Teen & Youth',
      desc: 'Age-appropriate self-defense and safety education with padded assailant scenarios adapted for younger learners.',
      duration: 'Ages 8–15',
    },
  ];

  return (
    <section className="bg-[#F8FAFC]" style={{ paddingTop: '112px', paddingBottom: '112px' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 gap-20 items-start">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
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
              OUR PROGRAMS
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
              Courses designed for every stage.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: '400',
                fontSize: '17px',
                lineHeight: '1.8',
                marginBottom: '48px',
                color: '#64748B',
                maxWidth: '360px',
              }}
            >
              Whether you are just starting your self-defense journey or looking to advance your skills, we have a program tailored to your needs.
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-[#00AEEF] font-semibold text-sm hover:gap-3 transition-all">
              View All Courses <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* RIGHT - FEATURED LAYOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Featured Women's Basic Card - Full Width */}
            {courses.slice(0, 1).map((course, idx) => {
              const Icon = course.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    minHeight: '180px',
                    background: 'linear-gradient(135deg, #1B3A8C 0%, #0D2260 100%)',
                    border: '2px solid rgba(0,174,239,0.3)',
                    borderRadius: '16px',
                    padding: '32px 40px',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,174,239,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left Side (60%) */}
                  <div style={{ flex: '0 0 60%' }}>
                    {course.hasBadge && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(0,174,239,0.15)',
                          color: '#00AEEF',
                          fontSize: '9px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', background: '#00AEEF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D2260', fontSize: '12px' }}>🛡️</div>
                        Most Popular
                      </div>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '24px', color: 'white', marginBottom: '12px' }}>
                      {course.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.8', marginBottom: '16px' }}>
                      {course.desc}
                    </p>
                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '4px' }}>Weekend</span>
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '4px' }}>Ages 16+</span>
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '4px' }}>No Experience Needed</span>
                    </div>
                  </div>

                  {/* Right Side (40%) - Stats */}
                  <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '40px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '64px', color: '#00AEEF', lineHeight: 1 }}>12</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '16px' }}>Max students</div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '32px', color: 'white', lineHeight: 1, marginTop: '16px' }}>20hrs</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Course duration</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 3 Smaller Cards Below */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {courses.slice(1).map((course, idx) => {
                const Icon = course.icon;
                return (
                  <motion.div
                    key={idx + 1}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (idx + 1) * 0.08 }}
                    className="group hover:-translate-y-1.5 transition-transform duration-300"
                    style={{
                      background: '#1B3A8C',
                      borderTop: '3px solid rgba(0,174,239,0.4)',
                      borderRight: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: 'none',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderTopColor = '#00AEEF';
                      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,174,239,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderTopColor = 'rgba(0,174,239,0.4)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Icon */}
                    <div style={{ marginBottom: '12px' }}>
                      <Icon size={24} style={{ color: '#00AEEF' }} />
                    </div>

                    {/* Badge */}
                    {!course.hasBadge && (
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background: course.badge.bg,
                          color: course.badge.color,
                          marginBottom: '12px',
                          display: 'inline-block',
                        }}
                      >
                        {course.badge.text}
                      </div>
                    )}

                    {/* Content */}
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '16px', color: 'white', marginBottom: '8px' }}>
                      {course.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '16px' }}>
                      {course.desc}
                    </p>

                    {/* Duration */}
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: '400', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      {course.duration}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
