import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'

/* ── Styles ─────────────────────────────────────────────────────────────── */
const G = '#C9933A'
const FG = '#F5F0E8'
const MUTED = 'rgba(245,240,232,0.52)'
const LINE = 'rgba(201,147,58,0.15)'

const S = {
  // Page wrapper forces dark bg for WebGL to sit on
  page: { background: '#05050f', minHeight: '100vh', position: 'relative' },

  // Canvas is fixed, behind content
  canvas: {
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    zIndex: 0, pointerEvents: 'none', display: 'block',
  },

  // Content sits above canvas
  content: { position: 'relative', zIndex: 1 },

  // Each section: 12-col grid, full viewport height
  sec: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    columnGap: '1.5rem',
    alignItems: 'center',
    padding: '0 5vw',
    pointerEvents: 'none',
    position: 'relative',
  },

  // Glass panel
  glass: {
    background: 'rgba(5,5,20,0.62)',
    backdropFilter: 'blur(22px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
    border: `1px solid ${LINE}`,
    padding: '2.8rem 3rem 3.2rem',
  },

  // Typography
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    fontSize: '0.60rem', letterSpacing: '4.5px', textTransform: 'uppercase',
    color: G, marginBottom: '1.6rem', fontWeight: 600,
  },
  eyebrowLine: { width: 20, height: 1, background: G, flexShrink: 0 },

  h1: {
    fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(3.2rem,7.5vw,7.8rem)', lineHeight: 0.87, letterSpacing: '-0.02em',
    color: FG, marginBottom: '1.8rem',
  },
  h2: {
    fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(2.4rem,5.5vw,5.6rem)', lineHeight: 0.9, letterSpacing: '-0.02em',
    color: FG, marginBottom: '1.6rem',
  },
  bodyT: { fontSize: '0.88rem', lineHeight: 1.85, color: MUTED, maxWidth: 420 },
  accent: { color: G },
  meta: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    marginTop: '2.2rem', fontSize: '0.58rem', letterSpacing: '3px',
    textTransform: 'uppercase', color: 'rgba(245,240,232,0.24)',
  },
  metaSpan: { paddingLeft: '1rem', borderLeft: `1px solid ${LINE}` },

  // Buttons — need pointerEvents:auto to be clickable through the overlay
  btnRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2.2rem', pointerEvents: 'auto' },
  btnP: {
    background: 'linear-gradient(135deg,#C9933A,#8B6020)', color: '#FFF8EC',
    padding: '0.9rem 2.2rem', border: 'none', cursor: 'pointer',
    fontSize: '0.72rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    fontWeight: 600, textDecoration: 'none', display: 'inline-block',
  },
  btnO: {
    background: 'transparent', color: FG, padding: '0.9rem 2.2rem',
    border: '1px solid rgba(201,147,58,0.4)', cursor: 'pointer',
    fontSize: '0.72rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    textDecoration: 'none', display: 'inline-block',
  },

  // Feature 2x2 grid
  featGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
    background: LINE, border: `1px solid ${LINE}`, marginTop: '1px',
  },
  featCard: {
    background: 'rgba(5,5,20,0.90)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', padding: '1.6rem',
    pointerEvents: 'auto', cursor: 'pointer',
  },
  featIcon: { fontSize: '1.6rem', marginBottom: '0.7rem', display: 'block' },
  featName: {
    fontFamily: "'Cinzel', serif", fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '2.5px', textTransform: 'uppercase', color: G, marginBottom: '0.4rem',
  },
  featDesc: { fontSize: '0.76rem', color: 'rgba(245,240,232,0.44)', lineHeight: 1.68 },

  // Stats
  statRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    borderTop: `1px solid ${LINE}`, marginTop: '2rem', paddingTop: '1.8rem',
  },
  statSep: { borderLeft: `1px solid ${LINE}`, paddingLeft: '1rem' },
  statN: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '2.3rem', fontWeight: 700,
    color: G, lineHeight: 1, display: 'block', marginBottom: '0.2rem',
  },
  statL: { fontSize: '0.52rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(245,240,232,0.28)' },

  // Tags
  tagRow: { display: 'flex', gap: '0.7rem', marginTop: '2rem', flexWrap: 'wrap', pointerEvents: 'auto' },
  tag: {
    fontSize: '0.60rem', letterSpacing: '2px', textTransform: 'uppercase',
    border: `1px solid ${LINE}`, padding: '0.5rem 0.9rem',
    color: 'rgba(245,240,232,0.45)', fontFamily: "'Cinzel', serif",
  },

  // Footer links
  ftrRow: {
    display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.2rem 2rem',
    borderTop: `1px solid ${LINE}`, paddingTop: '2rem', marginTop: '2.5rem',
    pointerEvents: 'auto',
  },
  ftrA: {
    fontSize: '0.58rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.22)', textDecoration: 'none',
  },

  // Scroll hint
  scrollHint: {
    position: 'absolute', bottom: '2.2rem', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    opacity: 0.22, fontSize: '0.5rem', letterSpacing: '4px', textTransform: 'uppercase',
    pointerEvents: 'none', color: FG,
  },
}

/* ── Feature data ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '☽', name: 'Kundali Reading', desc: 'Swiss Ephemeris, Lahiri Ayanamsa. Natal chart, Vimshottari dasha, ashtakavarga — precise to arc-seconds.', to: '/chart/new' },
  { icon: '✦', name: 'Destiny Chat',    desc: 'AI Jyotish assistant. Ask anything about your chart — dashas, transits, yogas. Deep, personal answers.', to: '/destiny-chat' },
  { icon: '∑', name: 'Numerology',      desc: 'Pythagorean and Chaldean systems. Life path, destiny, soul urge, personal year, and partner compatibility.', to: '/numerology' },
  { icon: '📖', name: 'Lal Kitab',      desc: 'Ancient Punjabi remedies. House map, Pucca Ghar planets, personalised remedy plan for karmic relief.', to: '/chart/new' },
]

/* ── WebGL orrery setup (runs once on mount) ───────────────────────────── */
function useOrrery(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const PI2 = Math.PI * 2
    const MOB = window.innerWidth < 880

    /* Scene + camera + renderer */
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 0, 10)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    /* Glow texture */
    function makeGlowTex() {
      const sz = 128, c = document.createElement('canvas')
      c.width = c.height = sz
      const ctx = c.getContext('2d')
      const g   = ctx.createRadialGradient(sz/2, sz/2, 0, sz/2, sz/2, sz/2)
      g.addColorStop(0,    'rgba(255,255,255,1)')
      g.addColorStop(0.10, 'rgba(255,255,255,0.9)')
      g.addColorStop(0.38, 'rgba(255,255,255,0.22)')
      g.addColorStop(0.72, 'rgba(255,255,255,0.04)')
      g.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz)
      return new THREE.CanvasTexture(c)
    }
    const GLOW_TEX = makeGlowTex()
    const disposables = [GLOW_TEX] // track for cleanup

    /* Starfield */
    const STAR_N = MOB ? 3500 : 7500
    const sPosArr = new Float32Array(STAR_N * 3)
    const sColArr = new Float32Array(STAR_N * 3)
    for (let i = 0; i < STAR_N; i++) {
      const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * PI2
      const r = 18 + Math.random() * 38
      sPosArr[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      sPosArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      sPosArr[i*3+2] = r * Math.cos(phi)
      const br = 0.3 + Math.random() * 0.7
      sColArr[i*3]   = br * (0.70 + Math.random() * 0.30)
      sColArr[i*3+1] = br * (0.78 + Math.random() * 0.22)
      sColArr[i*3+2] = br
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPosArr, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(sColArr, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.042, sizeAttenuation: true, vertexColors: true,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.65,
    })
    scene.add(new THREE.Points(starGeo, starMat))
    disposables.push(starGeo, starMat)

    /* Helpers */
    function orbitLine(r, col = 0xC9933A, op = 0.14, segs = 160) {
      const pts = []
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * PI2
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color: col, opacity: op, transparent: true, depthWrite: false })
      disposables.push(geo, mat)
      return new THREE.Line(geo, mat)
    }

    function makeSphere(sz, hexColor, glowRGB, glowSz) {
      const grp = new THREE.Group()
      const cGeo = new THREE.SphereGeometry(sz, 26, 18)
      const cMat = new THREE.MeshBasicMaterial({ color: hexColor })
      grp.add(new THREE.Mesh(cGeo, cMat))
      const hGeo = new THREE.SphereGeometry(sz * 2.0, 14, 10)
      const hMat = new THREE.MeshBasicMaterial({
        color: hexColor, transparent: true, opacity: 0.09,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      grp.add(new THREE.Mesh(hGeo, hMat))
      const sprMat = new THREE.SpriteMaterial({
        map: GLOW_TEX,
        color: new THREE.Color(glowRGB[0], glowRGB[1], glowRGB[2]),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.86,
      })
      const spr = new THREE.Sprite(sprMat)
      spr.scale.set(glowSz, glowSz, 1)
      grp.add(spr)
      disposables.push(cGeo, cMat, hGeo, hMat, sprMat)
      return grp
    }

    /* Graha data */
    const GRAHAS = [
      { hex:0xFF9933, gl:[1.0,0.60,0.10], r:0.00, spd:0,        sz:0.23, gsz:0.72, orCol:0 },
      { hex:0xBBCCFF, gl:[0.70,0.80,1.00], r:0.62, spd:0.013,   sz:0.10, gsz:0.30, orCol:0x8899EE },
      { hex:0x33EE77, gl:[0.15,0.95,0.45], r:0.96, spd:0.011,   sz:0.09, gsz:0.25, orCol:0x33EE77 },
      { hex:0xFF77BB, gl:[1.00,0.45,0.75], r:1.24, spd:0.009,   sz:0.11, gsz:0.32, orCol:0xFF77BB },
      { hex:0xFF3311, gl:[1.00,0.18,0.08], r:1.62, spd:0.0068,  sz:0.13, gsz:0.37, orCol:0xFF3311 },
      { hex:0xFFCC33, gl:[1.00,0.80,0.18], r:2.18, spd:0.0044,  sz:0.18, gsz:0.54, orCol:0xFFCC33 },
      { hex:0x99AABB, gl:[0.58,0.65,0.75], r:2.82, spd:0.0028,  sz:0.16, gsz:0.46, orCol:0x99AABB },
      { hex:0x3344AA, gl:[0.18,0.25,0.72], r:1.90, spd:-0.0022, sz:0.09, gsz:0.24, orCol:0x334466 },
      { hex:0xAA3322, gl:[0.72,0.18,0.12], r:1.90, spd:-0.0022, sz:0.09, gsz:0.24, orCol:0 },
    ]

    /* Orrery root group */
    const orrery = new THREE.Group()
    orrery.rotation.x = 0.22
    scene.add(orrery)

    /* Earth at geocentric center */
    orrery.add(makeSphere(0.13, 0x3366AA, [0.20,0.38,0.82], 0.36))

    /* Zodiac ring + 12 rashi ticks */
    const ZR = 3.60
    orrery.add(orbitLine(ZR, 0xC9933A, 0.22, 256))
    for (let z = 0; z < 12; z++) {
      const a  = (z / 12) * PI2
      const am = ((z + 0.5) / 12) * PI2
      const mkTick = (r0, r1, angle, op) => {
        const pts = [
          new THREE.Vector3(Math.cos(angle)*r0, 0, Math.sin(angle)*r0),
          new THREE.Vector3(Math.cos(angle)*r1, 0, Math.sin(angle)*r1),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color:0xC9933A, opacity:op, transparent:true })
        disposables.push(geo, mat)
        return new THREE.Line(geo, mat)
      }
      orrery.add(mkTick(ZR, ZR+0.24, a,  0.42))
      orrery.add(mkTick(ZR, ZR+0.11, am, 0.18))
    }

    /* Orbit groups for animation */
    const orbitGroups = []

    /* Rahu + Ketu — always 180° apart, shared group */
    const rkGroup = new THREE.Group()
    rkGroup.rotation.y = Math.random() * PI2
    rkGroup.rotation.z = (Math.random() - 0.5) * 0.22
    orrery.add(rkGroup)
    orrery.add(orbitLine(GRAHAS[7].r, 0x334466, 0.10))
    const rahuSph = makeSphere(GRAHAS[7].sz, GRAHAS[7].hex, GRAHAS[7].gl, GRAHAS[7].gsz)
    rahuSph.position.set( GRAHAS[7].r, 0, 0); rkGroup.add(rahuSph)
    const ketuSph = makeSphere(GRAHAS[8].sz, GRAHAS[8].hex, GRAHAS[8].gl, GRAHAS[8].gsz)
    ketuSph.position.set(-GRAHAS[8].r, 0, 0); rkGroup.add(ketuSph)
    orbitGroups.push({ grp: rkGroup, spd: GRAHAS[7].spd })

    /* Planets 0–6 */
    for (let i = 0; i < 7; i++) {
      const g = GRAHAS[i]
      if (g.r > 0) orrery.add(orbitLine(g.r, g.orCol, 0.09))
      const og = new THREE.Group()
      og.rotation.y = Math.random() * PI2
      og.rotation.z = i > 0 ? (Math.random() - 0.5) * 0.20 : 0
      orrery.add(og)
      const sph = makeSphere(g.sz, g.hex, g.gl, g.gsz)
      sph.position.set(g.r, 0, 0)
      og.add(sph)

      /* Saturn ring */
      if (i === 6) {
        const rGeo = new THREE.RingGeometry(g.sz*1.5, g.sz*2.75, 64)
        const rMat = new THREE.MeshBasicMaterial({ color:0xCCBB99, side:THREE.DoubleSide, transparent:true, opacity:0.48, depthWrite:false })
        const rMesh = new THREE.Mesh(rGeo, rMat)
        rMesh.rotation.x = Math.PI / 2.6
        sph.add(rMesh)
        disposables.push(rGeo, rMat)
      }
      /* Jupiter atmospheric layer */
      if (i === 5) {
        const jGeo = new THREE.SphereGeometry(g.sz*1.02, 24, 8)
        const jMat = new THREE.MeshBasicMaterial({ color:0xEEAA22, transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false })
        sph.add(new THREE.Mesh(jGeo, jMat))
        disposables.push(jGeo, jMat)
      }

      orbitGroups.push({ grp: og, spd: g.spd })
    }

    /* Orrery position/scale keyframes per section
       sec-1 (hero, left)       → orrery RIGHT:        x =  3.8
       sec-2 (features, right)  → orrery LEFT:         x = -3.6
       sec-3 (narrow left)      → orrery RIGHT LARGE:  x =  3.4, scl = 1.15
       sec-4 (CTA centered)     → orrery RECEDES:      z = -4.8, scl = 0.62  */
    const KF = [
      { x:  3.8, y: -0.4, z:  0.0, scl: 0.95 },
      { x: -3.6, y:  0.3, z: -1.2, scl: 0.90 },
      { x:  3.4, y:  0.6, z: -2.0, scl: 1.15 },
      { x:  0.0, y: -0.8, z: -4.8, scl: 0.62 },
    ]

    /* State */
    let mx = 0, my = 0, prevTime = performance.now(), idleTime = 0
    let animId

    const lerp = (a, b, t) => a + (b - a) * t
    const smooth = (t) => t * t * (3 - 2 * t)
    const getScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      return window.scrollY / max
    }

    /* Render loop */
    const animate = (now) => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min((now - prevTime) / 1000, 0.05)
      prevTime = now
      idleTime += dt

      const sp = getScroll()

      /* Lerp orrery through keyframes */
      const seg  = Math.min(sp * 3, 2.9999)
      const idx  = Math.floor(seg)
      const frac = smooth(seg - idx)
      const kfA  = KF[idx]
      const kfB  = KF[Math.min(idx + 1, 3)]
      const tX   = lerp(kfA.x, kfB.x, frac)
      const tY   = lerp(kfA.y, kfB.y, frac)
      const tZ   = lerp(kfA.z, kfB.z, frac)
      const tScl = lerp(kfA.scl, kfB.scl, frac)

      orrery.position.x  += (tX   - orrery.position.x)  * 0.055
      orrery.position.y  += (tY   - orrery.position.y)  * 0.055
      orrery.position.z  += (tZ   - orrery.position.z)  * 0.055
      orrery.scale.x     += (tScl - orrery.scale.x)     * 0.055
      orrery.scale.y      = orrery.scale.z = orrery.scale.x

      /* Ambient rotation */
      orrery.rotation.y += dt * 0.055

      /* Planet orbits */
      orbitGroups.forEach(o => { o.grp.rotation.y += o.spd })

      /* Camera mouse parallax */
      camera.position.x += (mx * 0.35 - camera.position.x) * 0.018
      camera.position.y += (-my * 0.22 - camera.position.y) * 0.018
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    /* Event listeners */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    const handleMouse = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouse)

    /* Cleanup on unmount */
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouse)
      disposables.forEach(d => d?.dispose?.())
      renderer.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function Landing() {
  const canvasRef = useRef(null)
  const navigate  = useNavigate()

  useOrrery(canvasRef)

  return (
    <div style={S.page}>
      {/* WebGL canvas — fixed, behind all content */}
      <canvas ref={canvasRef} style={S.canvas} />

      <div style={S.content}>

        {/* ── Section 1: Hero — col 1–8 left ── */}
        <section id="sec-hero" style={S.sec}>
          <div style={{ ...S.glass, gridColumn: '1 / span 8' }}>
            <div style={S.eyebrow}>
              <span style={S.eyebrowLine} />
              Vedic Astrology · Jyotisha · भाग्य
            </div>
            <h1 style={S.h1}>
              Know<br />
              Your<br />
              <span style={S.accent}>Destiny</span><br />
              Before<br />
              It Finds<br />
              You
            </h1>
            <p style={S.bodyT}>
              Five thousand years of Vedic wisdom encoded in computational light.
              Nine grahas, twelve rashis, twenty-seven nakshatras — your cosmic blueprint decoded.
            </p>
            <div style={S.btnRow}>
              <Link to="/chart/new" style={S.btnP}>Get Your Free Reading →</Link>
              <a href="#features" style={S.btnO}>Explore Features</a>
            </div>
            <div style={S.meta}>
              <span>01 / 04</span>
              <span style={S.metaSpan}>Navagraha Orrery</span>
              <span style={S.metaSpan}>Swiss Ephemeris</span>
            </div>
          </div>
          <div style={S.scrollHint}>
            <span>Scroll</span>
            <svg width="1" height="48" style={{ overflow:'visible' }}>
              <line x1="0" y1="0" x2="0" y2="48"
                stroke={G} strokeWidth="1"
                strokeDasharray="48"
                strokeDashoffset="48"
                style={{ animation:'scrollLine 2.5s ease-in-out infinite' }}
              />
            </svg>
          </div>
        </section>

        {/* ── Section 2: Features — col 6–12 right ── */}
        <section id="features" style={S.sec}>
          {/* Header card */}
          <div style={{ ...S.glass, gridColumn: '6 / span 7', textAlign: 'right', justifySelf: 'end' }}>
            <div style={{ ...S.eyebrow, justifyContent: 'flex-end' }}>
              What We Offer
              <span style={S.eyebrowLine} />
            </div>
            <h2 style={S.h2}>
              Ancient<br />
              Wisdom.<br />
              <span style={S.accent}>Modern</span><br />
              Clarity.
            </h2>
            <p style={{ ...S.bodyT, marginLeft: 'auto' }}>
              Swiss Ephemeris, Lahiri Ayanamsa, sidereal positions. Not approximations —
              the exact sky the rishis mapped, accurate to arc-seconds.
            </p>
            <div style={{ ...S.statRow, marginTop: '2rem', paddingTop: '1.8rem' }}>
              <div><span style={S.statN}>27</span><span style={S.statL}>Nakshatras</span></div>
              <div style={S.statSep}><span style={S.statN}>12</span><span style={S.statL}>Rashis</span></div>
              <div style={S.statSep}><span style={S.statN}>9</span><span style={S.statL}>Grahas</span></div>
            </div>
            <div style={{ ...S.meta, justifyContent: 'flex-end' }}>
              <span>02 / 04</span>
              <span style={S.metaSpan}>Real-time compute</span>
            </div>
          </div>
          {/* Feature cards 2×2 */}
          <div style={{ ...S.featGrid, gridColumn: '6 / span 7', marginTop: 1 }}>
            {FEATURES.map(f => (
              <div key={f.name} style={S.featCard}
                onClick={() => navigate(f.to)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(18,8,38,0.96)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,5,20,0.90)' }}
              >
                <span style={S.featIcon}>{f.icon}</span>
                <div style={S.featName}>{f.name}</div>
                <p style={S.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Philosophy — col 1–5 narrow left ── */}
        <section style={S.sec}>
          <div style={{ ...S.glass, gridColumn: '1 / span 5' }}>
            <div style={S.eyebrow}>
              <span style={S.eyebrowLine} />
              Philosophy
            </div>
            <div style={{ width: 34, height: 1.5, background: G, marginBottom: '1.4rem' }} />
            <h2 style={S.h2}>
              The Cosmos<br />
              Is Mapped<br />
              <span style={S.accent}>In You.</span>
            </h2>
            <p style={{ ...S.bodyT, marginBottom: '1.2rem' }}>
              The ancient rishis understood that the macrocosm and the individual are one.
              Your birth chart is not a cage — it is a map of your tendencies, gifts, and dharma.
            </p>
            <p style={S.bodyT}>
              Every planet in TheBhagya is computed using Swiss Ephemeris with Lahiri Ayanamsa —
              the same standard used by professional Jyotishis worldwide.
            </p>
            <div style={S.tagRow}>
              {['Kundali', 'Dasha', 'Destiny Chat', 'Numerology', 'Lal Kitab'].map(t => (
                <span key={t} style={S.tag}>{t}</span>
              ))}
            </div>
            <div style={S.meta}>
              <span>03 / 04</span>
              <span style={S.metaSpan}>AI-powered</span>
            </div>
          </div>
        </section>

        {/* ── Section 4: CTA — col 3–10 centered ── */}
        <section style={{ ...S.sec, justifyItems: 'center' }}>
          <div style={{ ...S.glass, gridColumn: '3 / span 8', textAlign: 'center', justifySelf: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke={G} strokeWidth="0.5" opacity="0.26"/>
                <circle cx="26" cy="26" r="16" stroke={G} strokeWidth="0.5" opacity="0.18"/>
                <circle cx="26" cy="26" r="7"  stroke={G} strokeWidth="0.5" opacity="0.38"/>
                <path d="M26 14 L27.2 24.8 L38 26 L27.2 27.2 L26 38 L24.8 27.2 L14 26 L24.8 24.8 Z"
                      fill={G} opacity="0.76"/>
                <circle cx="26" cy="26" r="2.8" fill={G}/>
              </svg>
            </div>
            <div style={{ ...S.eyebrow, justifyContent: 'center' }}>
              Begin Your Journey
            </div>
            <h2 style={{ ...S.h2, fontSize: 'clamp(2.8rem,6vw,6.5rem)' }}>
              Your Stars<br />
              <span style={S.accent}>Are Aligned.</span>
            </h2>
            <p style={{ ...S.bodyT, margin: '0 auto 2rem', textAlign: 'center' }}>
              Join thousands seeking clarity through the ancient science of Jyotisha.
              Your free Kundali awaits — no credit card, no commitment.
            </p>
            <div style={{ ...S.btnRow, justifyContent: 'center' }}>
              <Link to="/chart/new" style={S.btnP}>Create Free Chart →</Link>
              <Link to="/login"     style={S.btnO}>Sign In</Link>
            </div>
            <div style={S.ftrRow}>
              {[
                { label: 'My Charts',    to: '/my-charts' },
                { label: 'Destiny Chat', to: '/destiny-chat' },
                { label: 'Numerology',   to: '/numerology' },
                { label: 'Pricing',      to: '/pricing' },
                { label: 'Sign In',      to: '/login' },
              ].map(lk => (
                <Link key={lk.label} to={lk.to} style={S.ftrA}>{lk.label}</Link>
              ))}
            </div>
            <div style={{ marginTop: '2rem', fontSize: '0.5rem', color: 'rgba(245,240,232,0.14)', letterSpacing: '3px', fontFamily: "'Cinzel', serif" }}>
              © 2025 THEBHAGYA · ALL RIGHTS RESERVED
            </div>
            <div style={{ ...S.meta, justifyContent: 'center', marginTop: '1.5rem' }}>
              <span>04 / 04</span>
            </div>
          </div>
        </section>

      </div>

      {/* Inline keyframe for scroll line animation */}
      <style>{`
        @keyframes scrollLine {
          0%   { stroke-dashoffset: 48; opacity: 0; }
          40%  { stroke-dashoffset: 0;  opacity: 1; }
          60%  { stroke-dashoffset: 0;  opacity: 1; }
          100% { stroke-dashoffset: -48; opacity: 0; }
        }
        @media (max-width: 880px) {
          #sec-hero > div,
          section > div[style*="grid-column"] {
            grid-column: 1 / -1 !important;
            text-align: left !important;
            justify-self: start !important;
          }
        }
      `}</style>
    </div>
  )
}
