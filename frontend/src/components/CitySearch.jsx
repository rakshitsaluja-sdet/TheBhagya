import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * CitySearch — global city autocomplete using Nominatim (OpenStreetMap)
 *
 * Props:
 *   onSelect(lat, lon, tz, name) — called when user picks a city
 *   placeholder  — input placeholder text
 *   style        — optional style override for the outer wrapper
 *   inputStyle   — optional style override for the text input
 *   label        — optional label text (rendered above input)
 *   labelStyle   — optional style override for the label
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const TIMEZONEAPI = 'https://timeapi.io/api/TimeZone/coordinate'

// Fallback timezone map for common cases (avoids extra API call)
const TZ_FALLBACK = {
  IN: 'Asia/Kolkata',
  AE: 'Asia/Dubai',
  SG: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur',
  GB: 'Europe/London',
  US: 'America/New_York',    // rough default; timeapi overrides accurately
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  NP: 'Asia/Kathmandu',
  BD: 'Asia/Dhaka',
  LK: 'Asia/Colombo',
  PK: 'Asia/Karachi',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  NL: 'Europe/Amsterdam',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  JP: 'Asia/Tokyo',
  CN: 'Asia/Shanghai',
}

export default function CitySearch({
  onSelect,
  placeholder = 'Search any city worldwide…',
  style,
  inputStyle,
  label,
  labelStyle,
}) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState('')
  const debounceRef             = useRef(null)
  const wrapperRef              = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1&featuretype=city`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      // Filter to populated places
      const places = data.filter(d =>
        ['city', 'town', 'village', 'municipality', 'suburb', 'administrative'].includes(d.type) ||
        d.class === 'place' || d.class === 'boundary'
      )
      setResults(places.slice(0, 8))
      setOpen(places.length > 0)
    } catch {
      setResults([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e) {
    const v = e.target.value
    setQuery(v)
    setSelected('')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 400)
  }

  async function pickCity(place) {
    const lat = parseFloat(place.lat)
    const lon = parseFloat(place.lon)
    const cc  = place.address?.country_code?.toUpperCase() || ''

    // Build display name: "City, State, Country"
    const addr = place.address || {}
    const parts = [
      addr.city || addr.town || addr.village || addr.municipality || addr.county,
      addr.state,
      addr.country,
    ].filter(Boolean)
    const displayName = parts.join(', ')

    setQuery(displayName)
    setSelected(displayName)
    setOpen(false)
    setResults([])

    // Try timeapi.io for accurate timezone; fall back to country-based default
    let tz = TZ_FALLBACK[cc] || 'UTC'
    try {
      const tzRes = await fetch(`${TIMEZONEAPI}?latitude=${lat}&longitude=${lon}`)
      if (tzRes.ok) {
        const tzData = await tzRes.json()
        if (tzData.timeZone) tz = tzData.timeZone
      }
    } catch {
      // use fallback
    }

    onSelect(lat, lon, tz, displayName)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const baseInput = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: 'var(--bg-input)',
    border: `1px solid ${loading ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: open && results.length > 0 ? '10px 10px 0 0' : 10,
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    ...inputStyle,
  }

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--bg-elevated, #1B1533)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    zIndex: 9999,
    maxHeight: 280,
    overflowY: 'auto',
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  }

  const defaultLabelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    marginBottom: '0.35rem',
    ...labelStyle,
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      {label && <label style={defaultLabelStyle}>{label}</label>}

      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        style={baseInput}
        onFocus={() => results.length > 0 && setOpen(true)}
      />

      {/* Loading spinner dot */}
      {loading && (
        <span style={{
          position: 'absolute',
          right: '0.9rem',
          top: label ? 'calc(1.35rem + 0.8rem + 0.35rem)' : '0.8rem',
          width: 8, height: 8,
          background: 'var(--gold)',
          borderRadius: '50%',
          animation: 'bh-pulse 0.8s ease-in-out infinite alternate',
        }} />
      )}

      {open && results.length > 0 && (
        <div style={dropdownStyle}>
          {results.map((place, i) => {
            const addr = place.address || {}
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || place.display_name.split(',')[0]
            const sub  = [addr.state, addr.country].filter(Boolean).join(', ')
            return (
              <div
                key={place.place_id || i}
                onMouseDown={() => pickCity(place)}
                style={{
                  padding: '0.7rem 1rem',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border-soft, rgba(255,255,255,0.06))' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(223,168,79,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{city}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{sub}</div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes bh-pulse {
          from { opacity: 0.4; transform: scale(0.9); }
          to   { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
