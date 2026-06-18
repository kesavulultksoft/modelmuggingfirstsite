'use client';

import { motion } from 'framer-motion';

export default function WhyModule() {
  const cards = [
    {
      badge: '01',
      title: 'Full-Force Training',
      desc: 'You hit at full power against a padded assailant — not thin air. Muscle memory built under real adrenaline is the only kind that works under real adrenaline.',
    },
    {
      badge: '02',
      title: 'Built on Real Crime Data',
      desc: 'Every technique comes from analyzing thousands of actual crimes against women, survivor interviews, and predator typology research. Nothing invented at a whiteboard.',
    },
    {
      badge: '03',
      title: 'Designed for Women',
      desc: 'Female co-instructors model every scenario. Training reflects how women are actually targeted. Fear, freeze response, and emotional history are all addressed.',
    },
    {
      badge: '04',
      title: 'Adrenaline Stress Training',
      desc: 'The course replicates the real physiological state of being attacked. Skills learned under real stress are the only skills that reliably work under real stress.',
    },
    {
      badge: '05',
      title: 'Small, Supportive Groups',
      desc: 'Maximum 12 students per class. Every scenario is personalized to each student\'s physical and emotional starting point. You are never just a number.',
    },
    {
      badge: '06',
      title: 'Rooted in Psychology',
      desc: 'Founded on Albert Bandura\'s self-efficacy research at Stanford. Overcoming fear of assault follows the same proven psychological pathway as overcoming any deep fear.',
    },
  ];

  return (
    <section className="bg-white" style={{ paddingTop: '112px', paddingBottom: '112px' }} id="why">
      <div className="max-w-6xl mx-auto px-6">
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
            WHY MODEL MUGGING
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
            Not a typical self-defense class.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '400',
              fontSize: '17px',
              lineHeight: '1.8',
              marginBottom: '48px',
              color: '#64748B',
            }}
          >
            We invented full-force training in 1971. Every technique comes from real crime data, real psychology, and 50+ years of proven results.
          </p>
        </motion.div>

        {/* Asymmetric Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {/* Featured Large Card - spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            style={{
              gridColumn: 'span 2',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'row',
              background: '#1B3A8C',
              border: '1.5px solid #1B3A8C',
              borderRadius: '20px',
              padding: '40px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#00AEEF';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,174,239,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = '#1B3A8C';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Left side - Text */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(0,174,239,0.2)',
                  color: '#00AEEF',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  marginBottom: '12px',
                }}
              >
                {cards[0].badge}
              </div>
              <div
                style={{
                  width: '36px',
                  height: '3px',
                  background: '#00AEEF',
                  borderRadius: '2px',
                  marginBottom: '20px',
                }}
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '22px',
                  color: 'white',
                  marginBottom: '12px',
                }}
              >
                {cards[0].title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '400',
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: '1.8',
                }}
              >
                {cards[0].desc}
              </p>
            </div>
            {/* Right side - Decorative shield icon */}
            <div
              style={{
                fontSize: '120px',
                color: 'rgba(0,174,239,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '32px',
              }}
            >
              🛡️
            </div>
          </motion.div>

          {/* 5 Normal cards - 1 col each */}
          {cards.slice(1).map((card, idx) => (
            <motion.div
              key={idx + 1}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (idx + 1) * 0.08 }}
              className="transition-all duration-300"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #F1F5F9',
                borderRadius: '20px',
                padding: '32px',
                minHeight: '220px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = '#00AEEF';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,174,239,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '#F1F5F9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Badge */}
              <div
                style={{
                  display: 'inline-block',
                  background: '#E8F4FD',
                  color: '#00AEEF',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  marginBottom: '14px',
                }}
              >
                {card.badge}
              </div>

              {/* Cyan Bar */}
              <div
                style={{
                  width: '36px',
                  height: '3px',
                  background: '#00AEEF',
                  borderRadius: '2px',
                  display: 'block',
                  marginBottom: '16px',
                }}
              />

              {/* Title & Desc */}
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '18px',
                  color: '#1B3A8C',
                  marginBottom: '10px',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '400',
                  fontSize: '14px',
                  color: '#64748B',
                  lineHeight: '1.8',
                }}
              >
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
