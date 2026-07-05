export default function Footer() {
  const s = {
    footer: { borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', fontSize: '0.85rem' },
    row: { display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' },
    link: { color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' },
    pillars: { display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
    pill: { border: '1px solid var(--border)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' },
    copy: { color: 'var(--text-dim)' },
    disc: { marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)' },
  }
  return (
    <footer style={s.footer}>
      <div style={s.pillars}>
        {['Vedic Astrology', 'Lal Kitab', 'Palmistry', 'Numerology', 'Destiny Chat'].map(p => (
          <span key={p} style={s.pill}>{p}</span>
        ))}
      </div>
      <div style={s.row}>
        <a href="#" style={s.link}>Privacy Policy</a>
        <a href="#" style={s.link}>Terms of Use</a>
        <a href="#" style={s.link}>Contact</a>
        <a href="#" style={s.link}>About</a>
      </div>
      <p style={s.copy}>© {new Date().getFullYear()} TheBhagya · Ancient wisdom, modern precision</p>
      <p style={s.disc}>For spiritual guidance purposes only. Not a substitute for professional advice.</p>
    </footer>
  )
}
