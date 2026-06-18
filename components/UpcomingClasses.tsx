'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function UpcomingClasses() {
  const [selectedCity, setSelectedCity] = useState('All');

  const cities = ['All', 'Philadelphia', 'NYC', 'Denver', 'LA', 'Bay Area', 'Boston', 'Las Vegas', 'Seattle'];

  const events = [
    { month: 'APR', day: '11-12', city: 'Philadelphia', state: 'PA', course: "Women's Basic", spots: 12 },
    { month: 'APR', day: '18-19', city: 'New York City', state: 'NY', course: "Women's Basic", spots: 8 },
    { month: 'APR', day: '25-26', city: 'Denver', state: 'CO', course: "Women's Basic", spots: 12 },
    { month: 'MAY', day: '9-10', city: 'Los Angeles', state: 'CA', course: "Women's Basic", spots: 5 },
    { month: 'MAY', day: '16-17', city: 'Bay Area', state: 'CA', course: "Women's Basic", spots: 12 },
    { month: 'MAY', day: '30-31', city: 'Boston', state: 'MA', course: "Women's Basic", spots: 12 },
    { month: 'JUN', day: '6-7', city: 'Las Vegas', state: 'NV', course: 'Retreat', spots: 10 },
    { month: 'SEP', day: '12-13', city: 'Seattle', state: 'WA', course: "Women's Basic", spots: 12 },
  ];

  return (
    <section className="bg-white" style={{ paddingTop: '112px', paddingBottom: '112px' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-end mb-12"
        >
          <div>
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
              UPCOMING CLASSES
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                color: '#1B3A8C',
              }}
            >
              Find a class near you.
            </h2>
          </div>
          <div className="flex gap-3">
            <select style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', color: '#1B3A8C', fontWeight: 500 }}>
              <option>All Locations</option>
            </select>
            <select style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', color: '#1B3A8C', fontWeight: 500 }}>
              <option>All Courses</option>
            </select>
            <button style={{ background: 'white', border: '1.5px solid #1B3A8C', borderRadius: '8px', padding: '10px 20px', color: '#1B3A8C', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              View Full Schedule
            </button>
          </div>
        </motion.div>

        {/* Location Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedCity === city ? '#1B3A8C' : '#F1F5F9',
                color: selectedCity === city ? 'white' : '#1B3A8C',
                borderColor: selectedCity === city ? '#1B3A8C' : '#E2E8F0',
              }}
              onMouseEnter={(e) => {
                if (selectedCity !== city) {
                  e.currentTarget.style.background = '#E8F4FD';
                  e.currentTarget.style.borderColor = '#00AEEF';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCity !== city) {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Header */}
          <div className="grid gap-6 p-0 pb-3.5" style={{ gridTemplateColumns: '90px 1fr 180px 120px 140px', borderBottom: '2px solid #F1F5F9' }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              DATE
            </div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              LOCATION
            </div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              COURSE
            </div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              SPOTS
            </div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
              ACTION
            </div>
          </div>

          {/* Rows */}
          {events
            .filter((event) => selectedCity === 'All' || event.city === selectedCity || (selectedCity === 'NYC' && event.city === 'New York City') || (selectedCity === 'LA' && event.city === 'Los Angeles'))
            .map((event, idx) => {
            const spotColor = event.spots >= 12 ? '#16A34A' : event.spots <= 5 ? '#D97706' : '#94A3B8';
            const isEvenRow = idx % 2 === 0;
            return (
              <div
                key={idx}
                className="grid gap-6 border-b transition-all duration-200 cursor-pointer group"
                style={{
                  gridTemplateColumns: '90px 1fr 180px 120px 140px',
                  borderColor: '#F8FAFC',
                  padding: '20px',
                  background: isEvenRow ? 'white' : '#FAFBFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F0F9FF';
                  e.currentTarget.style.paddingLeft = '32px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isEvenRow ? 'white' : '#FAFBFF';
                  e.currentTarget.style.paddingLeft = '20px';
                }}
              >
                {/* Date */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: '700',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#94A3B8',
                      display: 'block',
                    }}
                  >
                    {event.month}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: '900',
                      fontSize: '30px',
                      color: '#1B3A8C',
                      lineHeight: '1.1',
                      display: 'block',
                    }}
                  >
                    {event.day}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <div className="font-semibold text-base" style={{ color: '#1B3A8C' }}>
                    {event.city}, <span style={{ color: '#94A3B8' }}>{event.state}</span>
                  </div>
                </div>

                {/* Course Badge */}
                <div
                  className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest w-fit"
                  style={{
                    background: event.course === 'Retreat' ? '#FEF3C7' : '#E8F4FD',
                    color: event.course === 'Retreat' ? '#92400E' : '#00AEEF',
                  }}
                >
                  {event.course}
                </div>

                {/* Spots */}
                <div className="font-medium text-sm" style={{ color: spotColor }}>
                  {event.spots} spots
                </div>

                {/* Action */}
                <div className="flex justify-end">
                  <a
                    href="#"
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#00AEEF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#00AEEF';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.padding = '8px 18px';
                      e.currentTarget.style.borderRadius = '6px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#00AEEF';
                      e.currentTarget.style.padding = '0';
                      e.currentTarget.style.borderRadius = '0';
                    }}
                  >
                    Register <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Note */}
        <p className="text-center text-xs mt-6" style={{ color: '#94A3B8' }}>
          Events are fetched from the backend API · component accepts events[] prop
        </p>
      </div>
    </section>
  );
}
