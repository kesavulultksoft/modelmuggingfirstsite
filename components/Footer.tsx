'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#0D2260', color: 'white' }}>
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-4 gap-12 mb-16">
          {/* COLUMN 1 - Brand */}
          <div>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: '20px',
                display: 'block',
              }}
            >
              About
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: 'rgba(255,255,255,0.55)',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: 'rgba(255,255,255,0.55)',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  The Research
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: 'rgba(255,255,255,0.55)',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  Team & Instructors
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: 'rgba(255,255,255,0.55)',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                >
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 2 - Programs */}
          <div>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: '20px',
                display: 'block',
              }}
            >
              Programs
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Women's Basic
                </Link>
              </li>
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Advanced
                </Link>
              </li>
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Retreat
                </Link>
              </li>
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Corporate Training
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 - Policies */}
          <div>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: '20px',
                display: 'block',
              }}
            >
              Policies
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', display: 'block', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 - Contact */}
          <div>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: '20px',
                display: 'block',
              }}
            >
              Contact
            </h3>
            <ul className="space-y-3">
              <li style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)' }}>
                <strong style={{ color: '#00AEEF' }}>Phone</strong>
                <br />
                1-800-MODEL-99
              </li>
              <li style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)' }}>
                <strong style={{ color: '#00AEEF' }}>Email</strong>
                <br />
                <a href="mailto:info@modelmugging.com" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  info@modelmugging.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Bottom Section */}
        <div className="pt-12 flex justify-between items-center">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            © {currentYear} Model Mugging®. Est. 1971. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
              Instagram
            </a>
            <a href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
              Facebook
            </a>
            <a href="#" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'white')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
