import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'

/* ── Design tokens ──────────────────────────────────────────────────────── */
const BG   = '#05050f'
const GOLD = '#C9933A'
const FG   = '#F5F0E8'
const MUT  = 'rgba(245,240,232,0.50)'
const LINE = 'rgba(201,147,58,0.15)'

/* ── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  root: {
    background: BG, minHeight: '100vh',
    position: 'relative',
    // Lock root to dark — immune to app theme
  },
  canvas: {
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    zIndex: 0, pointerEvents: 'none', display: 'block',
  },

  /* ── Inline nav (mix-blend-mode: difference — works on any bg) ── */
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0,
    zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.6rem 5vw',
    mixBlendMode: 'difference',
    pointerEvents: 'none',
  },
  navBrand: {
    fontFamily: "'Cinzel', serif", fontWeight: 700,
    fontSize: '0.88rem', letterSpacing: '7px',
    color: '#fff', textDecoration: 'none', display: 'block',
    pointerEvents: 'auto',
  },
  navLinks: {
    display: 'flex', gap: '2.8rem', listStyle: 'none',
    pointerEvents: 'auto',
  },
  navA: {
    color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
    fontSize: '0.62rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    transition: 'color 0.2s',
  },

  /* ── Content above canvas ── */
  content: { position: 'relative', zIndex: 1 },

  /* ── 12-col section grid ── */
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

  /* ── Glass card ── */
  glass: {
    background: 'rgba(5,5,20,0.62)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    border: `1px solid ${LINE}`,
    padding: '2.8rem 3rem 3.2rem',
  },

  /* ── Typography ── */
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    fontSize: '0.60rem', letterSpacing: '4.5px', textTransform: 'uppercase',
    color: GOLD, marginBottom: '1.6rem', fontWeight: 600,
  },
  rule: { width: 20, height: 1, background: GOLD, flexShrink: 0 },

  h1: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(3.2rem,7.5vw,7.8rem)',
    lineHeight: 0.87, letterSpacing: '-0.02em',
    color: FG, marginBottom: '1.8rem',
    // Crystal-inspired glow on heading
    textShadow: `0 0 80px rgba(201,147,58,0.18), 0 0 20px rgba(201,147,58,0.08)`,
  },
  h2: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(2.4rem,5.5vw,5.6rem)',
    lineHeight: 0.9, letterSpacing: '-0.02em',
    color: FG, marginBottom: '1.6rem',
  },
  body: { fontSize: '0.88rem', lineHeight: 1.85, color: MUT, maxWidth: 420 },
  accent: { color: GOLD, textShadow: `0 0 40px rgba(201,147,58,0.35)` },
  meta: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    marginTop: '2.2rem', fontSize: '0.57rem', letterSpacing: '3px',
    textTransform: 'uppercase', color: 'rgba(245,240,232,0.22)',
  },
  metaSpan: { paddingLeft: '1rem', borderLeft: `1px solid ${LINE}` },

  /* ── Buttons ── */
  btnRow: {
    display: 'flex', gap: '1rem', flexWrap: 'wrap',
    marginTop: '2.2rem', pointerEvents: 'auto',
  },
  btnP: {
    background: `linear-gradient(135deg, ${GOLD}, #8B6020)`,
    color: '#FFF8EC', padding: '0.9rem 2.2rem', border: 'none',
    cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '2.5px',
    textTransform: 'uppercase', fontWeight: 600,
    textDecoration: 'none', display: 'inline-block',
    boxShadow: `0 0 32px rgba(201,147,58,0.25)`,
    transition: 'box-shadow 0.25s, transform 0.2s',
  },
  btnO: {
    background: 'transparent', color: FG, padding: '0.9rem 2.2rem',
    border: '1px solid rgba(201,147,58,0.38)', cursor: 'pointer',
    fontSize: '0.72rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    textDecoration: 'none', display: 'inline-block',
    transition: 'border-color 0.25s, background 0.25s',
  },

  /* ── Feature 2×2 grid ── */
  featGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
    background: LINE, border: `1px solid ${LINE}`, marginTop: 1,
  },
  featCard: {
    background: 'rgba(5,5,20,0.90)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    padding: '1.6rem', cursor: 'pointer', pointerEvents: 'auto',
    transition: 'background 0.2s',
  },
  featIcon: { fontSize: '1.6rem', marginBottom: '0.7rem', display: 'block' },
  featName: {
    fontFamily: "'Cinzel', serif", fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '2.5px', textTransform: 'uppercase', color: GOLD, marginBottom: '0.4rem',
  },
  featDesc: { fontSize: '0.76rem', color: 'rgba(245,240,232,0.44)', lineHeight: 1.68 },

  /* ── Stats ── */
  statRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    borderTop: `1px solid ${LINE}`, marginTop: '2rem', paddingTop: '1.8rem',
  },
  statSep: { borderLeft: `1px solid ${LINE}`, paddingLeft: '1rem' },
  statN: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2.3rem', fontWeight: 700, color: GOLD,
    lineHeight: 1, display: 'block', marginBottom: '0.2rem',
  },
  statL: {
    fontSize: '0.52rem', letterSpacing: '3px',
    textTransform: 'uppercase', color: 'rgba(245,240,232,0.28)',
  },

  /* ── Tags ── */
  tagRow: {
    display: 'flex', gap: '0.7rem', marginTop: '2rem',
    flexWrap: 'wrap', pointerEvents: 'auto',
  },
  tag: {
    fontSize: '0.60rem', letterSpacing: '2px', textTransform: 'uppercase',
    border: `1px solid ${LINE}`, padding: '0.5rem 0.9rem',
    color: 'rgba(245,240,232,0.42)', fontFamily: "'Cinzel', serif",
  },

  /* ── Footer links ── */
  ftrRow: {
    display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.2rem 2rem',
    borderTop: `1px solid ${LINE}`, paddingTop: '2rem', marginTop: '2.5rem',
    pointerEvents: 'auto',
  },
  ftrA: {
    fontSize: '0.57rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.22)', textDecoration: 'none',
  },

  /* ── Scroll line ── */
  scrollHint: {
    position: 'absolute', bottom: '2.2rem', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    opacity: 0.28, fontSize: '0.5rem', letterSpacing: '4px', textTransform: 'uppercase',
    pointerEvents: 'none', color: FG,
  },
}

/* ── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '☽', name: 'Kundali',      desc: 'Swiss Ephemeris precision. Natal chart, Vimshottari dasha, ashtakavarga — computed to the arc-second.', to: '/chart/new' },
  { icon: '✦', name: 'Destiny Chat', desc: 'AI Jyotish assistant answers from your specific chart placements. Dashas, transits, yogas — deeply personal.', to: '/destiny-chat' },
  { icon: '∑', name: 'Numerology',   desc: 'Pythagorean and Chaldean systems. Life path, destiny, soul urge, personal year, partner compatibility.', to: '/numerology' },
  { icon: '📖', name: 'Lal Kitab',   desc: 'Ancient Punjabi remedies. Pucca Ghar planets, house map, personalised karmic remedy plan.', to: '/chart/new' },
]

/* ══════════════════════════════════════════════════════════════════════════
   WebGL Navagraha Orrery hook
   Crystal / Neon inspired: deep glow, atmospheric depth, cursor magnetic pull
══════════════════════════════════════════════════════════════════════════ */
function useOrrery(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof THREE === 'undefined') return

    const PI2 = Math.PI * 2
    const MOB = window.innerWidth < 880

    /* ── Renderer ── */
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 0, 10)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !MOB })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const disposables = []

    /* ── Glow texture (shared across all planets) ── */
    const makeGlowTex = () => {
      const sz = 128, c = document.createElement('canvas')
      c.width = c.height = sz
      const ctx = c.getContext('2d')
      const g   = ctx.createRadialGradient(sz/2, sz/2, 0, sz/2, sz/2, sz/2)
      g.addColorStop(0,    'rgba(255,255,255,1.00)')
      g.addColorStop(0.08, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.30, 'rgba(255,255,255,0.25)')
      g.addColorStop(0.65, 'rgba(255,255,255,0.05)')
      g.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz)
      return new THREE.CanvasTexture(c)
    }
    const GLOW_TEX = makeGlowTex()
    disposables.push(GLOW_TEX)

    /* ── Starfield — atmospheric depth layer ── */
    const STAR_N  = MOB ? 3000 : 6500
    const sPosArr = new Float32Array(STAR_N * 3)
    const sColArr = new Float32Array(STAR_N * 3)
    for (let i = 0; i < STAR_N; i++) {
      const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * PI2
      const r   = 20 + Math.random() * 40
      sPosArr[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      sPosArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      sPosArr[i*3+2] = r * Math.cos(phi)
      const br   = 0.25 + Math.random() * 0.75
      const warm = Math.random() > 0.7 // occasional warm (gold-tinted) stars
      sColArr[i*3]   = br * (warm ? 0.95 : 0.72 + Math.random() * 0.28)
      sColArr[i*3+1] = br * (warm ? 0.82 : 0.80 + Math.random() * 0.20)
      sColArr[i*3+2] = br * (warm ? 0.45 : 1.00)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPosArr, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(sColArr, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.04, sizeAttenuation: true, vertexColors: true,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.62,
    })
    scene.add(new THREE.Points(starGeo, starMat))
    disposables.push(starGeo, starMat)

    /* ── Nebula cloud — very faint atmospheric volume ── */
    if (!MOB) {
      const nebN = 1200
      const nPos = new Float32Array(nebN * 3)
      const nCol = new Float32Array(nebN * 3)
      for (let i = 0; i < nebN; i++) {
        const a  = Math.random() * PI2
        const r  = 3 + Math.random() * 7
        const ys = (Math.random() - 0.5) * 3
        nPos[i*3]   = Math.cos(a) * r + (Math.random()-0.5) * 2
        nPos[i*3+1] = ys
        nPos[i*3+2] = Math.sin(a) * r * 0.4 + (Math.random()-0.5) * 1.5
        const br = 0.04 + Math.random() * 0.08
        nCol[i*3]   = br * 1.00; nCol[i*3+1] = br * 0.72; nCol[i*3+2] = br * 0.28
      }
      const nGeo = new THREE.BufferGeometry()
      nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3))
      nGeo.setAttribute('color',    new THREE.BufferAttribute(nCol, 3))
      const nMat = new THREE.PointsMaterial({
        size: MOB ? 0.18 : 0.24, sizeAttenuation: true, vertexColors: true,
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55,
      })
      scene.add(new THREE.Points(nGeo, nMat))
      disposables.push(nGeo, nMat)
    }

    /* ── Helper: orbit ring ── */
    function orbitLine(r, col = 0xC9933A, op = 0.14, segs = 160) {
      const pts = []
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * PI2
        pts.push(new THREE.Vector3(Math.cos(a)*r, 0, Math.sin(a)*r))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color: col, opacity: op, transparent: true, depthWrite: false })
      disposables.push(geo, mat)
      return new THREE.Line(geo, mat)
    }

    /* ── Helper: sphere planet (core + inner halo + outer glow sprite) ── */
    function makeSphere(sz, hexColor, glowRGB, glowSz) {
      const grp = new THREE.Group()
      const cGeo = new THREE.SphereGeometry(sz, MOB ? 18 : 28, MOB ? 12 : 20)
      const cMat = new THREE.MeshBasicMaterial({ color: hexColor })
      grp.add(new THREE.Mesh(cGeo, cMat))
      const hGeo = new THREE.SphereGeometry(sz * 2.2, 12, 8)
      const hMat = new THREE.MeshBasicMaterial({
        color: hexColor, transparent: true, opacity: 0.10,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      grp.add(new THREE.Mesh(hGeo, hMat))
      const sprMat = new THREE.SpriteMaterial({
        map: GLOW_TEX,
        color: new THREE.Color(glowRGB[0], glowRGB[1], glowRGB[2]),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.88,
      })
      const spr = new THREE.Sprite(sprMat)
      spr.scale.set(glowSz, glowSz, 1)
      grp.add(spr)
      disposables.push(cGeo, cMat, hGeo, hMat, sprMat)
      return grp
    }

    /* ── Graha data ── */
    const GRAHAS = [
      { hex:0xFF9933, gl:[1.0,0.60,0.10], r:0.00, spd:0,        sz:0.23, gsz:0.74, orC:0 },
      { hex:0xBBCCFF, gl:[0.70,0.80,1.00], r:0.62, spd:0.013,   sz:0.10, gsz:0.30, orC:0x8899EE },
      { hex:0x33EE77, gl:[0.15,0.95,0.45], r:0.96, spd:0.011,   sz:0.09, gsz:0.26, orC:0x33EE77 },
      { hex:0xFF77BB, gl:[1.00,0.45,0.75], r:1.24, spd:0.009,   sz:0.11, gsz:0.33, orC:0xFF77BB },
      { hex:0xFF3311, gl:[1.00,0.18,0.08], r:1.62, spd:0.0068,  sz:0.13, gsz:0.38, orC:0xFF3311 },
      { hex:0xFFCC33, gl:[1.00,0.80,0.18], r:2.18, spd:0.0044,  sz:0.18, gsz:0.56, orC:0xFFCC33 },
      { hex:0x99AABB, gl:[0.58,0.65,0.75], r:2.82, spd:0.0028,  sz:0.16, gsz:0.48, orC:0x99AABB },
      { hex:0x3344AA, gl:[0.18,0.25,0.72], r:1.90, spd:-0.0022, sz:0.09, gsz:0.24, orC:0x334466 },
      { hex:0xAA3322, gl:[0.72,0.18,0.12], r:1.90, spd:-0.0022, sz:0.09, gsz:0.24, orC:0 },
    ]

    /* ── Orrery root ── */
    const orrery = new THREE.Group()
    orrery.rotation.x = 0.22
    scene.add(orrery)

    // Earth geocentric center
    orrery.add(makeSphere(0.13, 0x3366AA, [0.20,0.38,0.82], 0.36))

    // Zodiac ring + 12 rashi ticks
    const ZR = 3.60
    orrery.add(orbitLine(ZR, 0xC9933A, 0.22, 256))
    for (let z = 0; z < 12; z++) {
      const a  = (z/12)*PI2, am = ((z+0.5)/12)*PI2
      const mkT = (r0, r1, ang, op) => {
        const pts = [
          new THREE.Vector3(Math.cos(ang)*r0, 0, Math.sin(ang)*r0),
          new THREE.Vector3(Math.cos(ang)*r1, 0, Math.sin(ang)*r1),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color:0xC9933A, opacity:op, transparent:true })
        disposables.push(geo, mat)
        return new THREE.Line(geo, mat)
      }
      orrery.add(mkT(ZR, ZR+0.24, a, 0.42))
      orrery.add(mkT(ZR, ZR+0.11, am, 0.18))
    }

    // Orbit groups (for per-frame rotation)
    const orbitGroups = []

    // Rahu + Ketu shared orbit
    const rkGroup = new THREE.Group()
    rkGroup.rotation.y = Math.random() * PI2
    rkGroup.rotation.z = (Math.random()-0.5)*0.22
    orrery.add(rkGroup)
    orrery.add(orbitLine(GRAHAS[7].r, 0x334466, 0.10))
    const rahuSph = makeSphere(GRAHAS[7].sz, GRAHAS[7].hex, GRAHAS[7].gl, GRAHAS[7].gsz)
    rahuSph.position.set( GRAHAS[7].r, 0, 0); rkGroup.add(rahuSph)
    const ketuSph = makeSphere(GRAHAS[8].sz, GRAHAS[8].hex, GRAHAS[8].gl, GRAHAS[8].gsz)
    ketuSph.position.set(-GRAHAS[8].r, 0, 0); rkGroup.add(ketuSph)
    orbitGroups.push({ grp: rkGroup, spd: GRAHAS[7].spd })

    // Planets 0–6
    for (let i = 0; i < 7; i++) {
      const g = GRAHAS[i]
      if (g.r > 0) orrery.add(orbitLine(g.r, g.orC, 0.09))
      const og = new THREE.Group()
      og.rotation.y = Math.random() * PI2
      og.rotation.z = i > 0 ? (Math.random()-0.5)*0.20 : 0
      orrery.add(og)
      const sph = makeSphere(g.sz, g.hex, g.gl, g.gsz)
      sph.position.set(g.r, 0, 0)
      og.add(sph)

      // Saturn ring
      if (i === 6) {
        const rGeo = new THREE.RingGeometry(g.sz*1.5, g.sz*2.75, 64)
        const rMat = new THREE.MeshBasicMaterial({ color:0xCCBB99, side:THREE.DoubleSide, transparent:true, opacity:0.48, depthWrite:false })
        const rMesh = new THREE.Mesh(rGeo, rMat)
        rMesh.rotation.x = Math.PI / 2.6
        sph.add(rMesh)
        disposables.push(rGeo, rMat)
      }
      // Jupiter atmospheric ring
      if (i === 5) {
        const jGeo = new THREE.SphereGeometry(g.sz*1.02, 24, 8)
        const jMat = new THREE.MeshBasicMaterial({ color:0xEEAA22, transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false })
        sph.add(new THREE.Mesh(jGeo, jMat))
        disposables.push(jGeo, jMat)
      }
      orbitGroups.push({ grp: og, spd: g.spd })
    }

    /* ── Keyframes: orrery shifts into negative space of each section
       sec-1 (hero, left col 1-8)    → RIGHT:         x =  3.8
       sec-2 (features, right col 6-12) → LEFT:       x = -3.6
       sec-3 (narrow left col 1-5)   → RIGHT LARGE:   x =  3.4, scl = 1.15
       sec-4 (CTA centered)          → RECEDES:       z = -4.8, scl = 0.62 ── */
    const KF = [
      { x:  3.8, y: -0.4, z:  0.0, scl: 0.95 },
      { x: -3.6, y:  0.3, z: -1.2, scl: 0.90 },
      { x:  3.4, y:  0.6, z: -2.0, scl: 1.15 },
      { x:  0.0, y: -0.8, z: -4.8, scl: 0.62 },
    ]

    /* ── Animation state ── */
    let mx = 0, my = 0, prevTime = performance.now(), animId

    const lerp = (a, b, t) => a + (b-a)*t
    const smooth = t => t*t*(3-2*t)
    const getScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      return window.scrollY / max
    }

    /* ── Render loop ── */
    const animate = (now) => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min((now - prevTime) / 1000, 0.05)
      prevTime = now

      const sp  = getScroll()
      const seg = Math.min(sp * 3, 2.9999)
      const idx = Math.floor(seg)
      const fr  = smooth(seg - idx)
      const kA  = KF[idx], kB = KF[Math.min(idx+1, 3)]

      // Lerp orrery position + scale (damped)
      orrery.position.x += (lerp(kA.x, kB.x, fr) - orrery.position.x) * 0.058
      orrery.position.y += (lerp(kA.y, kB.y, fr) - orrery.position.y) * 0.058
      orrery.position.z += (lerp(kA.z, kB.z, fr) - orrery.position.z) * 0.058
      const tS = lerp(kA.scl, kB.scl, fr)
      orrery.scale.x += (tS - orrery.scale.x) * 0.058
      orrery.scale.y = orrery.scale.z = orrery.scale.x

      // Ambient rotation
      orrery.rotation.y += dt * 0.055

      // Planet orbits
      orbitGroups.forEach(o => { o.grp.rotation.y += o.spd })

      // Crystal-inspired magnetic cursor pull —
      // camera floats toward cursor with gentle damping
      camera.position.x += (mx * 0.40 - camera.position.x) * 0.022
      camera.position.y += (-my * 0.25 - camera.position.y) * 0.022
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    /* ── Events ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouse)

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      disposables.forEach(d => d?.dispose?.())
      renderer.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ══════════════════════════════════════════════════════════════════════════
   Landing page component
══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const canvasRef = useRef(null)
  const navigate  = useNavigate()

  useOrrery(canvasRef)

  return (
    <div style={S.root}>
      {/* WebGL canvas — fixed, always dark */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* ── Inline nav: mix-blend-mode difference = theme-immune ── */}
      <nav style={S.nav}>
        <Link to="/" style={S.navBrand}>THEBHAGYA</Link>
        <ul style={S.navLinks}>
          <li><a href="#features" style={S.navA}>Features</a></li>
          <li><a href="#about"    style={S.navA}>Philosophy</a></li>
          <li><Link to="/pricing" style={S.navA}>Pricing</Link></li>
          <li><Link to="/login"   style={{ ...S.navA, color: 'rgba(255,255,255,0.75)' }}>Sign In</Link></li>
        </ul>
      </nav>

      {/* ── Page content ── */}
      <div style={S.content}>

        {/* ─ Sec 1: Hero — col 1–8 left ─ */}
        <section id="sec-hero" style={S.sec}>
          <div style={{ ...S.glass, gridColumn: '1 / span 8' }}>
            <div style={S.eyebrow}><span style={S.rule}/>Vedic Astrology · Jyotisha · भाग्य</div>
            <h1 style={S.h1}>
              Know<br />Your<br />
              <span style={S.accent}>Destiny</span><br />
              Before<br />It Finds<br />You
            </h1>
            <p style={S.body}>
              Five thousand years of Vedic wisdom encoded in computational light.
              Nine grahas, twelve rashis, twenty-seven nakshatras — your cosmic blueprint decoded.
            </p>
            <div style={S.btnRow}>
              <Link to="/chart/new" style={S.btnP}>Get Your Free Reading →</Link>
              <a href="#features"   style={S.btnO}>Explore Features</a>
            </div>
            <div style={S.meta}>
              <span>01 / 04</span>
              <span style={S.metaSpan}>Navagraha Orrery</span>
              <span style={S.metaSpan}>Swiss Ephemeris</span>
            </div>
          </div>
          <div style={S.scrollHint}>
            <span>Scroll</span>
            <div style={{
              width: 1, height: 48,
              background: `linear-gradient(to bottom, transparent, ${GOLD})`,
              animation: 'scrollLine 2.5s ease-in-out infinite',
            }} />
          </div>
        </section>

        {/* ─ Sec 2: Features — col 6–12 right ─ */}
        <section id="features" style={S.sec}>
          <div style={{ ...S.glass, gridColumn: '6 / span 7', justifySelf: 'end' }}>
            <div style={{ ...S.eyebrow, justifyContent: 'flex-end' }}>
              What We Offer <span style={S.rule}/>
            </div>
            <h2 style={{ ...S.h2, textAlign: 'right' }}>
              Ancient<br />Wisdom.<br />
              <span style={S.accent}>Modern</span><br />Clarity.
            </h2>
            <p style={{ ...S.body, marginLeft: 'auto', textAlign: 'right' }}>
              Swiss Ephemeris, Lahiri Ayanamsa, sidereal positions.
              Not approximations — the exact sky the rishis mapped, accurate to arc-seconds.
            </p>
            <div style={S.statRow}>
              <div><span style={S.statN}>27</span><span style={S.statL}>Nakshatras</span></div>
              <div style={S.statSep}><span style={S.statN}>12</span><span style={S.statL}>Rashis</span></div>
              <div style={S.statSep}><span style={S.statN}>9</span><span style={S.statL}>Grahas</span></div>
            </div>
            <div style={{ ...S.meta, justifyContent: 'flex-end' }}>
              <span>02 / 04</span><span style={S.metaSpan}>Real-time compute</span>
            </div>
          </div>
          <div style={{ ...S.featGrid, gridColumn: '6 / span 7' }}>
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

        {/* ─ Sec 3: Philosophy — col 1–5 narrow left ─ */}
        <section id="about" style={S.sec}>
          <div style={{ ...S.glass, gridColumn: '1 / span 5' }}>
            <div style={S.eyebrow}><span style={S.rule}/>Philosophy</div>
            <div style={{ width:34, height:1.5, background:GOLD, marginBottom:'1.4rem' }}/>
            <h2 style={S.h2}>
              The Cosmos<br />Is Mapped<br />
              <span style={S.accent}>In You.</span>
            </h2>
            <p style={{ ...S.body, marginBottom:'1.2rem' }}>
              The ancient rishis understood that the macrocosm and the individual are one.
              Your birth chart is a map of your tendencies, gifts, and dharma — not a cage.
            </p>
            <p style={S.body}>
              Every planet in TheBhagya is computed using Swiss Ephemeris with Lahiri Ayanamsa —
              the professional standard used by Jyotishis worldwide.
            </p>
            <div style={S.tagRow}>
              {['Kundali','Dasha','Destiny Chat','Numerology','Lal Kitab'].map(t => (
                <span key={t} style={S.tag}>{t}</span>
              ))}
            </div>
            <div style={S.meta}>
              <span>03 / 04</span><span style={S.metaSpan}>AI-powered</span>
            </div>
          </div>
        </section>

        {/* ─ Sec 4: CTA — centered col 3–10 ─ */}
        <section style={{ ...S.sec, justifyItems:'center' }}>
          <div style={{ ...S.glass, gridColumn:'3 / span 8', textAlign:'center', justifySelf:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'2rem' }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke={GOLD} strokeWidth="0.5" opacity="0.26"/>
                <circle cx="26" cy="26" r="16" stroke={GOLD} strokeWidth="0.5" opacity="0.18"/>
                <circle cx="26" cy="26" r="7"  stroke={GOLD} strokeWidth="0.5" opacity="0.38"/>
                <path d="M26 14 L27.2 24.8 L38 26 L27.2 27.2 L26 38 L24.8 27.2 L14 26 L24.8 24.8 Z"
                      fill={GOLD} opacity="0.76"/>
                <circle cx="26" cy="26" r="2.8" fill={GOLD}/>
              </svg>
            </div>
            <div style={{ ...S.eyebrow, justifyContent:'center' }}>Begin Your Journey</div>
            <h2 style={{ ...S.h2, fontSize:'clamp(2.8rem,6vw,6.5rem)' }}>
              Your Stars<br /><span style={S.accent}>Are Aligned.</span>
            </h2>
            <p style={{ ...S.body, margin:'0 auto 2rem', textAlign:'center' }}>
              Join thousands seeking clarity through the ancient science of Jyotisha.
              Your free Kundali awaits — no credit card, no commitment.
            </p>
            <div style={{ ...S.btnRow, justifyContent:'center' }}>
              <Link to="/chart/new" style={S.btnP}>Create Free Chart →</Link>
              <Link to="/login"     style={S.btnO}>Sign In</Link>
            </div>
            <div style={S.ftrRow}>
              {[
                {l:'My Charts',    t:'/my-charts'},
                {l:'Destiny Chat', t:'/destiny-chat'},
                {l:'Numerology',   t:'/numerology'},
                {l:'Pricing',      t:'/pricing'},
                {l:'Sign In',      t:'/login'},
              ].map(lk => (
                <Link key={lk.l} to={lk.t} style={S.ftrA}>{lk.l}</Link>
              ))}
            </div>
            <div style={{ marginTop:'2rem', fontSize:'0.5rem', color:'rgba(245,240,232,0.14)', letterSpacing:'3px', fontFamily:"'Cinzel',serif" }}>
              © 2025 THEBHAGYA · ALL RIGHTS RESERVED
            </div>
            <div style={{ ...S.meta, justifyContent:'center', marginTop:'1.5rem' }}>
              <span>04 / 04</span>
            </div>
          </div>
        </section>

      </div>

      {/* ── Keyframe CSS ── */}
      <style>{`
        @keyframes scrollLine {
          0%   { opacity:0; transform:scaleY(0); transform-origin:top; }
          45%  { opacity:1; transform:scaleY(1); transform-origin:top; }
          55%  { opacity:1; transform:scaleY(1); transform-origin:bottom; }
          100% { opacity:0; transform:scaleY(0); transform-origin:bottom; }
        }
        @media (max-width:880px) {
          #sec-hero > div,
          section > div[style] { grid-column:1/-1 !important; justify-self:start !important; }
          section > div[style*="feat"] { grid-column:1/-1 !important; }
        }
      `}</style>
    </div>
  )
}
