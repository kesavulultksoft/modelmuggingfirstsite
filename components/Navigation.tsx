'use client';

import Link from 'next/link';
import { Menu, X, ChevronDown, Shield, Zap, Sunset, Users, User, Award, Calendar, Home, Gift, HelpCircle, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownItems = {
    training: [
      { icon: Shield, label: 'Women\'s Basic Course', desc: 'Ages 16+ · No experience needed' },
      { icon: Zap, label: 'Advanced Course', desc: 'Graduates only' },
      { icon: Sunset, label: 'Retreat Format', desc: 'Overnight immersive' },
      { icon: Users, label: 'Teen & Youth', desc: 'Ages 8–15' },
      { icon: User, label: 'Men\'s Course', desc: '' },
      { icon: Award, label: 'Instructor Cert.', desc: 'Teach the program' },
    ],
    quick: [
      { icon: Calendar, label: 'View Full Schedule', desc: '' },
      { icon: Home, label: 'Host a Class', desc: '' },
      { icon: Gift, label: 'Gift a Course', desc: '' },
      { icon: HelpCircle, label: 'FAQs', desc: '' },
    ],
  };

  return (
    <nav
      className="fixed top-0 w-full z-50 border-b"
      style={{
        background: '#FFFFFF',
        borderColor: '#F1F5F9',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        height: '72px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/modelmugging-MnCtjWKkfIvH5N9oZUAn4TO5Rz5Q8c.png"
            alt="Model Mugging Self Defense"
            style={{ height: '48px', width: 'auto' }}
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          {/* Courses with Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className="flex items-center gap-1 font-semibold text-xs"
              style={{
                color: '#1B3A8C',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00AEEF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1B3A8C')}
            >
              Courses <ChevronDown size={14} />
            </button>

            {dropdownOpen && (
              <div
                className="absolute top-[72px] left-0 w-[500px] bg-white rounded-b-4xl"
                style={{
                  border: '1px solid #F1F5F9',
                  borderTop: '3px solid #00AEEF',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  padding: '24px 28px',
                }}
              >
                {/* Two Columns */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  {/* Left Column */}
                  <div>
                    <div
                      className="text-xs font-bold uppercase mb-4"
                      style={{ color: '#94A3B8', letterSpacing: '0.15em' }}
                    >
                      Training Programs
                    </div>
                    {dropdownItems.training.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={idx}
                          href="#"
                          className="flex items-center gap-3 p-2.5 rounded-lg mb-2 hover:rounded-lg transition-all"
                          style={{ background: 'transparent' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#E8F4FD')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#E8F4FD' }}
                          >
                            <Icon size={16} style={{ color: '#00AEEF' }} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold" style={{ color: '#1B3A8C' }}>
                              {item.label}
                            </div>
                            {item.desc && (
                              <div className="text-xs" style={{ color: '#94A3B8' }}>
                                {item.desc}
                              </div>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>

                  {/* Right Column */}
                  <div>
                    <div
                      className="text-xs font-bold uppercase mb-4"
                      style={{ color: '#94A3B8', letterSpacing: '0.15em' }}
                    >
                      Quick Links
                    </div>
                    {dropdownItems.quick.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={idx}
                          href="#"
                          className="flex items-center gap-3 p-2.5 rounded-lg mb-2 hover:rounded-lg transition-all"
                          style={{ background: 'transparent' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#E8F4FD')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#E8F4FD' }}
                          >
                            <Icon size={16} style={{ color: '#00AEEF' }} />
                          </div>
                          <div className="text-xs font-semibold" style={{ color: '#1B3A8C' }}>
                            {item.label}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Strip */}
                <div
                  className="flex items-center gap-2 p-3.5 rounded-b-2xl"
                  style={{
                    background: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <MapPin size={14} style={{ color: '#00AEEF' }} />
                  <span className="text-xs" style={{ color: '#475569' }}>
                    Next course: Philadelphia · Apr 11–12, 2026
                  </span>
                  <a
                    href="#"
                    className="ml-auto text-xs font-bold"
                    style={{ color: '#00AEEF' }}
                  >
                    Register Now →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Other Links */}
          {['Why Us', 'Schedule', 'Stories', 'About'].map((label) => (
            <a
              key={label}
              href="#"
              className="font-semibold text-xs"
              style={{
                color: '#1B3A8C',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00AEEF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1B3A8C')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <button
          className="hidden lg:block px-6 py-2.5 rounded-lg font-bold transition-all"
          style={{
            background: '#00AEEF',
            color: '#FFFFFF',
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(0,174,239,0.35)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0090C5';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00AEEF';
            e.currentTarget.style.transform = 'none';
          }}
        >
          Find a Class
        </button>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} style={{ color: '#1B3A8C' }} /> : <Menu size={24} style={{ color: '#1B3A8C' }} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[72px] h-screen z-999"
          style={{
            background: '#FFFFFF',
            padding: '24px',
          }}
        >
          <div className="flex flex-col gap-6">
            {['Courses', 'Why Us', 'Schedule', 'Stories', 'About'].map((label) => (
              <a
                key={label}
                href="#"
                className="font-semibold text-lg"
                style={{ color: '#1B3A8C', textDecoration: 'none' }}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
          <button
            className="w-full mt-6 px-6 py-4 rounded-lg font-bold"
            style={{
              background: '#00AEEF',
              color: '#FFFFFF',
              fontSize: '16px',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Find a Class
          </button>
        </div>
      )}
    </nav>
  );
}
