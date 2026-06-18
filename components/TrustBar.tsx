'use client';

import { CalendarCheck, Heart, Users, MapPin, BookOpen } from 'lucide-react';

export default function TrustBar() {
  const items = [
    { icon: CalendarCheck, text: 'Est. 1971' },
    { icon: Heart, text: 'Non-Profit Organization' },
    { icon: Users, text: '100,000+ Graduates' },
    { icon: MapPin, text: 'US · Germany · Switzerland' },
    { icon: BookOpen, text: 'Stanford Research Foundation' },
  ];

  return (
    <section className="bg-white border-b" style={{ borderColor: '#F1F5F9', paddingTop: '20px', paddingBottom: '20px' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-center flex-wrap gap-0">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2" style={{ padding: '0 32px' }}>
              {i > 0 && <div className="w-px h-5" style={{ background: '#E2E8F0' }} />}
              <Icon size={15} style={{ color: '#00AEEF' }} />
              <span className="text-xs font-semibold" style={{ color: '#1B3A8C' }}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
