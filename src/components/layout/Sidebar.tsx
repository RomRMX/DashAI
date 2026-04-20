import { NavLink } from 'react-router-dom';
import { Rocket, Zap, BookOpen, PlayCircle, GraduationCap } from 'lucide-react';

const NAV = [
  { path: '/releases',   Icon: Rocket,        label: 'AI Releases',  num: '01' },
  { path: '/skills',     Icon: Zap,           label: 'Skills',       num: '02' },
  { path: '/dictionary', Icon: BookOpen,       label: 'Dictionary',   num: '03' },
  { path: '/youtube',    Icon: PlayCircle,     label: 'YouTube',      num: '04' },
  { path: '/guides',     Icon: GraduationCap, label: 'Guides',       num: '05' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--ink-800)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--fg)', textTransform: 'uppercase' }}>RMX.AI</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflow: 'auto' }}>
        {NAV.map(({ path, Icon, label, num }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 16px',
              textDecoration: 'none',
              borderLeft: isActive ? '2px solid var(--signal-orange)' : '2px solid transparent',
              background: isActive ? 'var(--ink-700)' : 'transparent',
              transition: 'background var(--dur-fast) var(--ease-out)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  color={isActive ? 'var(--signal-orange)' : 'var(--fg-muted)'}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? 'var(--fg)' : 'var(--fg-muted)' }}>{label}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>{num}</div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          v1.0.0 · 2025
        </div>
      </div>
    </aside>
  );
}
