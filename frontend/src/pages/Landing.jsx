import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ── Design tokens (forced-dark marketing surface) ─────────────────────── */
const BG    = '#07060F'
const GOLD  = '#DFA84F'
const GOLDL = '#F2CB84'
const VIO   = '#8B6FE8'
const FG    = '#F3EDDF'
const MUT   = 'rgba(243,237,223,0.55)'
const DIM   = 'rgba(243,237,223,0.30)'
const LINE  = 'rgba(223,168,79,0.16)'
const LINE2 = 'rgba(223,168,79,0.09)'

/* ══════════════════════════════════════════════════════════════════════════
   WebGL Navagraha Orrery + Kaal Chakra (Sudarshana wheel)
══════════════════════════════════════════════════════════════════════════ */
function useOrrery(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof THREE === 'undefined') return

    const PI2 = Math.PI * 2
    const MOB = window.innerWidth < 880

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 0, 10)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !MOB })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const disposables = []

    /* ── Circular glow sprite texture ── */
    const makeGlowTex = (sz = 128) => {
      const c = document.createElement('canvas')
      c.width = c.height = sz
      const ctx = c.getContext('2d')
      const g = ctx.createRadialGradient(sz/2,sz/2,0, sz/2,sz/2,sz/2)
      g.addColorStop(0,    'rgba(255,255,255,1.00)')
      g.addColorStop(0.08, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.30, 'rgba(255,255,255,0.25)')
      g.addColorStop(0.65, 'rgba(255,255,255,0.05)')
      g.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz)
      return new THREE.CanvasTexture(c)
    }

    /* ── Circular star texture ── */
    const makeStarTex = () => {
      const sz = 32, c = document.createElement('canvas')
      c.width = c.height = sz
      const ctx = c.getContext('2d')
      const g = ctx.createRadialGradient(sz/2,sz/2,0, sz/2,sz/2,sz/2)
      g.addColorStop(0,   'rgba(255,255,255,1.00)')
      g.addColorStop(0.15,'rgba(255,255,255,0.85)')
      g.addColorStop(0.45,'rgba(255,255,255,0.15)')
      g.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz)
      return new THREE.CanvasTexture(c)
    }

    const GLOW_TEX = makeGlowTex()
    const STAR_TEX = makeStarTex()
    disposables.push(GLOW_TEX, STAR_TEX)

    /* ── Starfield ── */
    const STAR_N  = MOB ? 3000 : 6500
    const sPosArr = new Float32Array(STAR_N * 3)
    const sColArr = new Float32Array(STAR_N * 3)
    for (let i = 0; i < STAR_N; i++) {
      const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * PI2
      const r   = 22 + Math.random() * 40
      sPosArr[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      sPosArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      sPosArr[i*3+2] = r * Math.cos(phi)
      const br   = 0.30 + Math.random() * 0.70
      const roll = Math.random()
      if (roll > 0.82) {        // warm gold stars
        sColArr[i*3] = br * 0.98; sColArr[i*3+1] = br * 0.82; sColArr[i*3+2] = br * 0.38
      } else if (roll > 0.70) { // violet stars
        sColArr[i*3] = br * 0.62; sColArr[i*3+1] = br * 0.52; sColArr[i*3+2] = br * 1.00
      } else {                  // white-blue
        sColArr[i*3] = br * (0.75 + Math.random()*0.25); sColArr[i*3+1] = br * (0.85 + Math.random()*0.15); sColArr[i*3+2] = br
      }
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPosArr, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(sColArr, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.12, sizeAttenuation: true, vertexColors: true,
      map: STAR_TEX, alphaTest: 0.001,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
    scene.add(new THREE.Points(starGeo, starMat))
    disposables.push(starGeo, starMat)

    /* ── Kaal Chakra ── */
    function makeKaalChakra() {
      const grp = new THREE.Group()

      function neonRing(r, colorHex, brightOp, glowOp, segs = 256) {
        const addLine = (radius, op) => {
          const pts = []
          for (let i = 0; i <= segs; i++) {
            const a = (i/segs)*PI2
            pts.push(new THREE.Vector3(Math.cos(a)*radius, 0, Math.sin(a)*radius))
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts)
          const mat = new THREE.LineBasicMaterial({ color: colorHex, opacity: op, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
          grp.add(new THREE.Line(geo, mat))
          disposables.push(geo, mat)
        }
        addLine(r,         brightOp)
        addLine(r * 1.012, glowOp)
        addLine(r * 0.988, glowOp)
        addLine(r * 1.030, glowOp * 0.35)
      }

      function addSpokes(n, r0, r1, colorHex, op) {
        const pts = []
        for (let i = 0; i < n; i++) {
          const a = (i/n)*PI2
          pts.push(new THREE.Vector3(Math.cos(a)*r0, 0, Math.sin(a)*r0))
          pts.push(new THREE.Vector3(Math.cos(a)*r1, 0, Math.sin(a)*r1))
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: colorHex, opacity: op, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
        grp.add(new THREE.LineSegments(geo, mat))
        disposables.push(geo, mat)
      }

      function addFlames(n, rimR, tipLen, colorHex, op) {
        const pts = []
        for (let i = 0; i < n; i++) {
          const a  = ((i + 0.5) / n) * PI2
          const aL = a - 0.04, aR = a + 0.04
          const cx = Math.cos(a)*(rimR + tipLen), cy = Math.sin(a)*(rimR + tipLen)
          const lx = Math.cos(aL)*rimR, ly = Math.sin(aL)*rimR
          const rx = Math.cos(aR)*rimR, ry = Math.sin(aR)*rimR
          pts.push(new THREE.Vector3(lx, 0, ly), new THREE.Vector3(cx, 0, cy))
          pts.push(new THREE.Vector3(rx, 0, ry), new THREE.Vector3(cx, 0, cy))
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: colorHex, opacity: op, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
        grp.add(new THREE.LineSegments(geo, mat))
        disposables.push(geo, mat)
      }

      function addGlowSprites(positions, colorRGB, sz, op) {
        positions.forEach(pos => {
          const m = new THREE.SpriteMaterial({ map: GLOW_TEX, color: new THREE.Color(...colorRGB), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op })
          const sp = new THREE.Sprite(m); sp.scale.set(sz, sz, 1); sp.position.copy(pos)
          grp.add(sp); disposables.push(m)
        })
      }

      neonRing(3.52, 0xFFE040, 0.75, 0.18)
      neonRing(3.18, 0xFFCC33, 0.40, 0.10)
      neonRing(2.28, 0xEEAA22, 0.28, 0.07)
      neonRing(1.36, 0xDD9911, 0.20, 0.05)
      neonRing(0.44, 0xFFE566, 0.70, 0.20)
      neonRing(0.22, 0xFFEE77, 0.55, 0.15)

      addSpokes(16, 0.44, 3.52, 0xFFCC33, 0.28)
      const pts16 = []
      for (let i = 0; i < 16; i++) {
        const a = ((i + 0.5)/16)*PI2
        pts16.push(new THREE.Vector3(Math.cos(a)*0.44, 0, Math.sin(a)*0.44))
        pts16.push(new THREE.Vector3(Math.cos(a)*2.28, 0, Math.sin(a)*2.28))
      }
      const sec16Geo = new THREE.BufferGeometry().setFromPoints(pts16)
      const sec16Mat = new THREE.LineBasicMaterial({ color: 0xEEBB44, opacity: 0.14, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
      grp.add(new THREE.LineSegments(sec16Geo, sec16Mat))
      disposables.push(sec16Geo, sec16Mat)

      addFlames(16, 3.52, 0.22, 0xFFDD44, 0.55)

      const rimPts = []
      for (let i = 0; i < 16; i++) {
        const a = (i/16)*PI2
        rimPts.push(new THREE.Vector3(Math.cos(a)*3.52, 0, Math.sin(a)*3.52))
      }
      addGlowSprites(rimPts, [1.0, 0.88, 0.25], 0.42, 0.55)
      addGlowSprites([new THREE.Vector3(0,0,0)], [1.0, 0.92, 0.4], 1.40, 0.60)

      return grp
    }

    /* ── Orbit ring helper ── */
    function orbitLine(r, col = 0xDFA84F, op = 0.12, segs = 160) {
      const pts = []
      for (let i = 0; i <= segs; i++) {
        const a = (i/segs)*PI2
        pts.push(new THREE.Vector3(Math.cos(a)*r, 0, Math.sin(a)*r))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color: col, opacity: op, transparent: true, depthWrite: false })
      disposables.push(geo, mat)
      return new THREE.Line(geo, mat)
    }

    /* ── Sphere planet ── */
    function makeSphere(sz, hexColor, glowRGB, glowSz) {
      const grp = new THREE.Group()
      const cGeo = new THREE.SphereGeometry(sz, MOB ? 18 : 28, MOB ? 12 : 20)
      const cMat = new THREE.MeshBasicMaterial({ color: hexColor })
      grp.add(new THREE.Mesh(cGeo, cMat))
      const hGeo = new THREE.SphereGeometry(sz * 2.2, 12, 8)
      const hMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
      grp.add(new THREE.Mesh(hGeo, hMat))
      const sprMat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: new THREE.Color(...glowRGB), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.88 })
      const spr = new THREE.Sprite(sprMat); spr.scale.set(glowSz, glowSz, 1)
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

    const chakra = makeKaalChakra()
    orrery.add(chakra)

    orrery.add(makeSphere(0.13, 0x3366AA, [0.20,0.38,0.82], 0.36))

    const ZR = 3.68
    orrery.add(orbitLine(ZR, 0xDFA84F, 0.18, 256))
    for (let z = 0; z < 12; z++) {
      const a = (z/12)*PI2, am = ((z+0.5)/12)*PI2
      const mkT = (r0, r1, ang, op) => {
        const pts = [new THREE.Vector3(Math.cos(ang)*r0, 0, Math.sin(ang)*r0), new THREE.Vector3(Math.cos(ang)*r1, 0, Math.sin(ang)*r1)]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: 0xDFA84F, opacity: op, transparent: true })
        disposables.push(geo, mat)
        return new THREE.Line(geo, mat)
      }
      orrery.add(mkT(ZR, ZR+0.28, a, 0.50))
      orrery.add(mkT(ZR, ZR+0.12, am, 0.20))
    }

    const orbitGroups = []

    const rkGroup = new THREE.Group()
    rkGroup.rotation.y = Math.random()*PI2
    rkGroup.rotation.z = (Math.random()-0.5)*0.22
    orrery.add(rkGroup)
    orrery.add(orbitLine(GRAHAS[7].r, 0x334466, 0.08))
    const rahuSph = makeSphere(GRAHAS[7].sz, GRAHAS[7].hex, GRAHAS[7].gl, GRAHAS[7].gsz)
    rahuSph.position.set(GRAHAS[7].r, 0, 0); rkGroup.add(rahuSph)
    const ketuSph = makeSphere(GRAHAS[8].sz, GRAHAS[8].hex, GRAHAS[8].gl, GRAHAS[8].gsz)
    ketuSph.position.set(-GRAHAS[8].r, 0, 0); rkGroup.add(ketuSph)
    orbitGroups.push({ grp: rkGroup, spd: GRAHAS[7].spd })

    for (let i = 0; i < 7; i++) {
      const g = GRAHAS[i]
      if (g.r > 0) orrery.add(orbitLine(g.r, g.orC, 0.08))
      const og = new THREE.Group()
      og.rotation.y = Math.random()*PI2
      og.rotation.z = i > 0 ? (Math.random()-0.5)*0.18 : 0
      orrery.add(og)
      const sph = makeSphere(g.sz, g.hex, g.gl, g.gsz)
      sph.position.set(g.r, 0, 0)
      og.add(sph)
      if (i === 6) {
        const rGeo = new THREE.RingGeometry(g.sz*1.5, g.sz*2.75, 64)
        const rMat = new THREE.MeshBasicMaterial({ color: 0xCCBB99, side: THREE.DoubleSide, transparent: true, opacity: 0.46, depthWrite: false })
        const rMesh = new THREE.Mesh(rGeo, rMat); rMesh.rotation.x = Math.PI/2.6
        sph.add(rMesh); disposables.push(rGeo, rMat)
      }
      if (i === 5) {
        const jGeo = new THREE.SphereGeometry(g.sz*1.02, 24, 8)
        const jMat = new THREE.MeshBasicMaterial({ color: 0xEEAA22, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
        sph.add(new THREE.Mesh(jGeo, jMat)); disposables.push(jGeo, jMat)
      }
      orbitGroups.push({ grp: og, spd: g.spd })
    }

    /* ── Scroll keyframes ── */
    const KF = [
      { x:  3.8, y: -0.4, z:  0.0, scl: 0.95 },
      { x: -3.6, y:  0.3, z: -1.2, scl: 0.90 },
      { x:  3.4, y:  0.6, z: -2.0, scl: 1.15 },
      { x:  0.0, y: -0.8, z: -4.8, scl: 0.62 },
    ]

    let mx = 0, my = 0, prevTime = performance.now(), animId
    const lerp = (a, b, t) => a + (b-a)*t
    const smooth = t => t*t*(3-2*t)
    const getScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      return window.scrollY / max
    }

    const animate = (now) => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min((now - prevTime)/1000, 0.05)
      prevTime = now

      const sp  = getScroll()
      const seg = Math.min(sp * 3, 2.9999)
      const idx = Math.floor(seg)
      const fr  = smooth(seg - idx)
      const kA  = KF[idx], kB = KF[Math.min(idx+1, 3)]

      orrery.position.x += (lerp(kA.x, kB.x, fr) - orrery.position.x) * 0.058
      orrery.position.y += (lerp(kA.y, kB.y, fr) - orrery.position.y) * 0.058
      orrery.position.z += (lerp(kA.z, kB.z, fr) - orrery.position.z) * 0.058
      const tS = lerp(kA.scl, kB.scl, fr)
      orrery.scale.x += (tS - orrery.scale.x) * 0.058
      orrery.scale.y = orrery.scale.z = orrery.scale.x

      orrery.rotation.y += dt * 0.050
      chakra.rotation.y  -= dt * 0.025

      orbitGroups.forEach(o => { o.grp.rotation.y += o.spd })

      camera.position.x += (mx * 0.42 - camera.position.x) * 0.020
      camera.position.y += (-my * 0.26 - camera.position.y) * 0.020
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

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

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      disposables.forEach(d => d?.dispose?.())
      renderer.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ── Scroll reveal ─────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target) }
      })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── Data ──────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '☽', name: 'Kundali Engine', big: true,
    desc: 'Swiss Ephemeris precision. Natal chart, Vimshottari dasha, ashtakavarga — every graha computed to the arc-second, exactly as the rishis mapped the sky.',
    tag: 'FLAGSHIP', to: '/chart/new' },
  { icon: '✦', name: 'Destiny Chat', big: true,
    desc: 'An AI Jyotish that answers from your specific placements — dashas, transits, yogas. Not generic horoscopes; readings cited from your own chart.',
    tag: 'AI-NATIVE', to: '/destiny-chat' },
  { icon: '📅', name: 'Panchang', desc: 'Tithi, Nakshatra, Vara, Yoga & Karana — the five Vedic almanac limbs with Rahu Kaal and Abhijit Muhurat.', to: '/panchang' },
  { icon: '💎', name: 'Gemstones', desc: 'Personalised Ratna Shastra — primary stone for your Lagna lord and dasha stone for your current Mahadasha.', to: '/gemstones' },
  { icon: '☉', name: 'Varshphal', desc: 'Annual Horoscope — solar return chart with Varsha Lagna, Muntha, Varsha Pati and full planetary positions for the year.', to: '/varshphal' },
  { icon: '🪐', name: 'Gochar Report', desc: 'Live planetary transits on your natal chart — house analysis, Vedic aspects, tight conjunctions, Sade Sati &amp; Jupiter Peyarchi flags.', to: '/transit' },
  { icon: '🃏', name: 'Tarot Reading', desc: 'Full 78-card deck — Major &amp; Minor Arcana. Single card, 3-card, Celtic Cross, Love, Career &amp; Yes/No spreads with upright and reversed meanings.', to: '/tarot' },
  { icon: '🏠', name: 'Vastu Shastra', desc: 'Interactive Vastu Purusha Mandala — assign rooms to all 9 zones, get direction scores, dosha detection with remedies, and colour recommendations.', to: '/vastu' },
  { icon: '♈', name: 'Daily Horoscope', desc: 'Transit-based Rashifal with love, career and money ratings for all 12 rashis.', to: '/horoscope' },
  { icon: '♄', name: 'Sade Sati', desc: 'Saturn’s 7.5-year transit over your Moon — past cycles, current phase, remedies.', to: '/sade-sati' },
  { icon: '♂', name: 'Dosha Check', desc: 'Mangal & Kaal Sarp dosha with severity, cancellations and remedies.', to: '/doshas' },
  { icon: '♥', name: 'Kundli Match', desc: 'Ashtakoot 36-guna compatibility with full koota breakdown and dosha detection.', to: '/kundli-matching' },
  { icon: '∑', name: 'Numerology', desc: 'Pythagorean & Chaldean — life path, destiny, soul urge, personal year.', to: '/numerology' },
  { icon: '📕', name: 'Lal Kitab', desc: 'Pucca Ghar planets, house map, and a personalised karmic remedy plan.', to: '/lal-kitab' },
]

const TESTIMONIALS = [
  { quote: 'The dasha timeline is the most accurate I have seen. It flagged a career shift 8 months out — it happened exactly on schedule.', name: 'Vikram P.', nak: 'Hasta Moon', init: 'VP' },
  { quote: 'I have tried AstroSage and two others. Bhagya is the only one that gets the nakshatra placements right every time.', name: 'Nandita R.', nak: 'Chitra Moon', init: 'NR' },
  { quote: 'The Lal Kitab house readings are detailed and the remedies are actionable — not vague like most apps give you.', name: 'Arjun S.', nak: 'Punarvasu Moon', init: 'AS' },
  { quote: 'Destiny Chat cited my actual house placements in every answer. It did not feel like a generic horoscope at all.', name: 'Kavya M.', nak: 'Anuradha Moon', init: 'KM' },
  { quote: 'Free tier gives more than paid readings elsewhere. The ashtakavarga alone is worth it.', name: 'Tarun B.', nak: 'Vishakha Moon', init: 'TB' },
  { quote: 'Saturn transit reading was precise. The Sade Sati analysis explained the last three years of my life better than anything.', name: 'Swati G.', nak: 'Jyeshtha Moon', init: 'SG' },
  { quote: 'The nakshatra-level breakdown is something no other free tool offers. My Ardra placement finally makes sense.', name: 'Mehul D.', nak: 'Ardra Moon', init: 'MD' },
]

const STEPS = [
  { n: '01', title: 'Enter birth details', desc: 'Date, time and place of birth. That’s all the engine needs — no sign-up required for your first chart.' },
  { n: '02', title: 'Swiss Ephemeris computes', desc: 'Sidereal positions with Lahiri ayanamsa for all nine grahas, lagna, nakshatras and the full Vimshottari dasha tree.' },
  { n: '03', title: 'AI reads your chart', desc: 'Destiny Chat interprets yogas, dashas and transits from your actual placements — ask it anything, anytime.' },
]

const PLANS = [
  { name: 'Starter', price: '₹0',   per: '/month', desc: '3 charts a month, horoscope, doshas & matching', popular: false },
  { name: 'Pro',     price: '₹299', per: '/month', desc: 'Unlimited charts, Destiny Chat, numerology, PDF reports', popular: true },
  { name: 'Jyotish', price: '₹799', per: '/month', desc: 'Everything in Pro plus priority AI and deep-dive readings', popular: false },
]

/* ── Styles ────────────────────────────────────────────────────────────── */
const S = {
  root:   { background: BG, minHeight: '100vh', position: 'relative' },
  canvas: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', display: 'block' },
  content: { position: 'relative', zIndex: 1 },
  container: { maxWidth: 1280, margin: '0 auto', padding: '0 5vw' },

  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', fontWeight: 500,
    letterSpacing: '3.5px', textTransform: 'uppercase', color: GOLD,
  },
  rule: { width: 22, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD})`, flexShrink: 0 },

  h1: {
    fontFamily: "'Fraunces', serif", fontWeight: 600,
    fontSize: 'clamp(3rem, 6.4vw, 6.2rem)', lineHeight: 1.02, letterSpacing: '-0.03em',
    color: FG, margin: '1.4rem 0 1.6rem',
  },
  h2: {
    fontFamily: "'Fraunces', serif", fontWeight: 600,
    fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.08, letterSpacing: '-0.025em',
    color: FG, margin: '1.1rem 0 1.2rem',
  },
  gradText: {
    background: `linear-gradient(120deg, ${GOLDL} 0%, ${GOLD} 45%, ${VIO} 115%)`,
    WebkitBackgroundClip: 'text', backgroundClip: 'text',
    WebkitTextFillColor: 'transparent', color: 'transparent',
    fontStyle: 'italic',
  },
  body: { fontSize: '1rem', lineHeight: 1.8, color: MUT, maxWidth: 460 },

  btnP: {
    background: `linear-gradient(135deg, ${GOLDL} 0%, ${GOLD} 42%, #A8752B 100%)`,
    color: '#1C1205', padding: '0.95rem 2.3rem', border: 'none', cursor: 'pointer',
    fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.3px',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    borderRadius: 999,
    boxShadow: `0 0 0 1px rgba(242,203,132,0.35) inset, 0 10px 36px rgba(223,168,79,0.35)`,
    transition: 'transform 0.18s ease, box-shadow 0.25s ease, filter 0.2s',
  },
  btnO: {
    background: 'rgba(223,168,79,0.05)', color: FG, padding: '0.95rem 2.3rem',
    border: `1px solid rgba(223,168,79,0.4)`, cursor: 'pointer',
    fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: 999,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    transition: 'background 0.2s, border-color 0.2s, transform 0.18s ease',
  },

  glass: {
    background: 'rgba(12,10,26,0.66)',
    backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    border: `1px solid ${LINE}`, borderRadius: 24,
  },
}

/* ══════════════════════════════════════════════════════════════════════════
   Landing
══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const canvasRef = useRef(null)
  const navigate  = useNavigate()
  useOrrery(canvasRef)
  useReveal()

  /* Animated counters */
  useEffect(() => {
    const targets = [
      { id: 'sp-charts',  end: 12847,  suffix: '+' },
      { id: 'sp-planets', end: 115623, suffix: '+' },
    ]
    const dur = 1800
    const t0 = performance.now()
    let raf
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      targets.forEach(({ id, end, suffix }) => {
        const el = document.getElementById(id)
        if (el) el.textContent = Math.round(ease * end).toLocaleString('en-IN') + suffix
      })
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={S.root} data-theme="dark">
      <canvas ref={canvasRef} style={S.canvas} />

      <div style={S.content}>
        <Navbar />

        {/* ══ HERO ══ */}
        <section style={{ ...S.container, minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <div className="bh-hero-copy" style={{ maxWidth: 640, padding: '6rem 0 7rem' }}>
            <div className="bh-fade-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              border: `1px solid ${LINE}`, borderRadius: 999, padding: '0.45rem 1.1rem',
              background: 'rgba(223,168,79,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            }}>
              <span className="bh-live-dot" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: GOLD }}>
                Vedic Astrology · Jyotisha · भाग्य
              </span>
            </div>

            <h1 className="bh-fade-up-1" style={S.h1}>
              Know your <span style={S.gradText}>destiny</span> before it finds you
            </h1>

            <p className="bh-fade-up-2" style={S.body}>
              Five thousand years of Vedic wisdom, encoded in computational light.
              Nine grahas, twelve rashis, twenty-seven nakshatras — your cosmic
              blueprint decoded by Swiss Ephemeris precision and AI.
            </p>

            <div className="bh-fade-up-3 bh-hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2.4rem' }}>
              <Link to="/chart/new" style={S.btnP}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.07)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
              >Get your free Kundali →</Link>
              <a href="#features" style={S.btnO}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(223,168,79,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(223,168,79,0.05)'; e.currentTarget.style.transform = 'none' }}
              >Explore features</a>
            </div>

            <div className="bh-fade-up-3" style={{
              display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '2.6rem',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem',
              letterSpacing: '2px', textTransform: 'uppercase', color: DIM, flexWrap: 'wrap',
            }}>
              <span>Swiss Ephemeris</span>
              <span style={{ width: 1, height: 12, background: LINE }} />
              <span>Lahiri Ayanamsa</span>
              <span style={{ width: 1, height: 12, background: LINE }} />
              <span>0.001° precision</span>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            opacity: 0.3, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem',
            letterSpacing: '4px', textTransform: 'uppercase', color: FG, pointerEvents: 'none',
          }} className="bh-scroll-hint">
            <span>Scroll</span>
            <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, transparent, ${GOLD})`, animation: 'scrollLine 2.5s ease-in-out infinite' }} />
          </div>
        </section>

        {/* ══ STATS STRIP ══ */}
        <section style={{ borderTop: `1px solid ${LINE2}`, borderBottom: `1px solid ${LINE2}`, background: 'rgba(12,10,26,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="bh-stats-grid reveal" style={{ ...S.container, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '2.4rem 5vw' }}>
            {[
              { id: 'sp-charts',  label: 'Charts computed',      pre: '12,847+',   live: true  },
              { id: 'sp-planets', label: 'Planets calculated',   pre: '1,15,623+', live: false },
              { id: 'sp-naks',    label: 'Nakshatras mapped',    pre: '27',        live: false },
              { id: 'sp-acc',     label: 'Arc-second precision', pre: '0.001°',    live: false },
            ].map((st, i) => (
              <div key={st.id} style={{ textAlign: 'center', padding: '0 1.5rem', ...(i > 0 && { borderLeft: `1px solid ${LINE2}` }) }}>
                <span id={st.id} style={{
                  fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem,3.4vw,3rem)', fontWeight: 600,
                  color: GOLD, lineHeight: 1, display: 'block', marginBottom: '0.55rem', letterSpacing: '-0.02em',
                }}>{st.pre}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.56rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: DIM }}>
                  {st.live && <span className="bh-live-dot" />}
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FEATURES — BENTO ══ */}
        <section id="features" style={{ ...S.container, padding: '7rem 5vw 5rem' }}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 3.5rem' }}>
            <div style={{ ...S.eyebrow, justifyContent: 'center' }}>
              <span style={S.rule} />What we offer<span style={{ ...S.rule, transform: 'scaleX(-1)' }} />
            </div>
            <h2 style={S.h2}>Ancient wisdom. <span style={S.gradText}>Modern clarity.</span></h2>
            <p style={{ ...S.body, margin: '0 auto', textAlign: 'center' }}>
              Not approximations — the exact sky the rishis mapped, computed in
              real time and interpreted by AI trained on classical Jyotisha.
            </p>
          </div>

          <div className="bh-bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
            {FEATURES.map((f, i) => (
              <div key={f.name}
                className={`bh-bento-card reveal ${f.big ? 'bh-bento-big' : ''}`}
                style={{
                  gridColumn: f.big ? 'span 3' : 'span 2',
                  ...S.glass,
                  borderRadius: 20,
                  padding: f.big ? '2.2rem 2.2rem 2rem' : '1.6rem',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s, box-shadow 0.25s',
                  transitionDelay: `${(i % 3) * 0.05}s`,
                }}
                onClick={() => navigate(f.to)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'rgba(242,203,132,0.45)'
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(223,168,79,0.10)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.borderColor = LINE
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {f.big && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, width: 220, height: 220,
                    background: `radial-gradient(circle at top right, ${i === 0 ? 'rgba(223,168,79,0.14)' : 'rgba(139,111,232,0.14)'}, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                  <span style={{
                    width: f.big ? 46 : 38, height: f.big ? 46 : 38, borderRadius: 12,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: f.big ? '1.35rem' : '1.05rem',
                    background: 'linear-gradient(145deg, rgba(242,203,132,0.16), rgba(139,111,232,0.10))',
                    border: `1px solid ${LINE}`, color: GOLDL,
                  }}>{f.icon}</span>
                  {f.tag && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.56rem', letterSpacing: '2px',
                      color: i === 0 ? GOLD : VIO, border: `1px solid ${i === 0 ? LINE : 'rgba(139,111,232,0.3)'}`,
                      borderRadius: 999, padding: '0.25rem 0.7rem',
                      background: i === 0 ? 'rgba(223,168,79,0.07)' : 'rgba(139,111,232,0.08)',
                    }}>{f.tag}</span>
                  )}
                </div>
                <div style={{
                  fontFamily: "'Fraunces', serif", fontSize: f.big ? '1.5rem' : '1.08rem', fontWeight: 600,
                  color: FG, marginBottom: '0.45rem', letterSpacing: '-0.01em',
                }}>{f.name}</div>
                <p style={{ fontSize: f.big ? '0.9rem' : '0.82rem', color: MUT, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                <div style={{
                  marginTop: '1rem', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD,
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>Open <span style={{ fontSize: '0.75rem' }}>→</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section style={{ ...S.container, padding: '4rem 5vw 6rem' }}>
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <div style={S.eyebrow}><span style={S.rule} />How it works</div>
            <h2 style={S.h2}>Three steps to <span style={S.gradText}>your sky.</span></h2>
          </div>
          <div className="bh-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {STEPS.map((st, i) => (
              <div key={st.n} className="reveal" style={{
                ...S.glass, borderRadius: 20, padding: '1.9rem',
                position: 'relative', transitionDelay: `${i * 0.08}s`,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '3px',
                  color: GOLD, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: '50%', border: `1px solid ${LINE}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(223,168,79,0.07)',
                  }}>{st.n}</span>
                  {i < 2 && <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${LINE}, transparent)` }} />}
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 600, color: FG, marginBottom: '0.5rem' }}>{st.title}</div>
                <p style={{ fontSize: '0.86rem', color: MUT, lineHeight: 1.75, margin: 0 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ TESTIMONIALS MARQUEE ══ */}
        <section style={{ borderTop: `1px solid ${LINE2}`, borderBottom: `1px solid ${LINE2}`, background: 'rgba(223,168,79,0.015)', padding: '3.5rem 0 3rem', overflow: 'hidden' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '2.2rem' }}>
            <div style={{ ...S.eyebrow, justifyContent: 'center' }}>
              <span style={S.rule} />Trusted by seekers worldwide<span style={{ ...S.rule, transform: 'scaleX(-1)' }} />
            </div>
          </div>
          <div style={{
            overflow: 'hidden', position: 'relative',
            maskImage: 'linear-gradient(to right, transparent, black 90px, black calc(100% - 90px), transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 90px, black calc(100% - 90px), transparent)',
          }}>
            <div className="bh-marquee">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} style={{
                  ...S.glass, borderRadius: 18, padding: '1.4rem 1.6rem', width: 320, flexShrink: 0,
                }}>
                  <div style={{ color: GOLD, fontSize: '0.62rem', letterSpacing: '2px', marginBottom: '0.7rem' }}>✦ ✦ ✦ ✦ ✦</div>
                  <p style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(243,237,223,0.78)', margin: '0 0 1rem' }}>
                    “{t.quote}”
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(242,203,132,0.25), rgba(139,111,232,0.2))',
                      border: `1px solid ${LINE}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: GOLDL, fontWeight: 600,
                    }}>{t.init}</div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(243,237,223,0.7)', fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: 'rgba(223,168,79,0.6)', letterSpacing: '1px' }}>{t.nak}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '2.2rem 5vw 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.56rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: DIM }}>Alternative to</span>
            {['AstroTalk', 'AstroSage', 'AstroVed', 'GaneshaSpeaks'].map(n => (
              <span key={n} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '1.5px',
                textTransform: 'uppercase', color: 'rgba(243,237,223,0.35)',
                border: `1px solid ${LINE2}`, borderRadius: 999, padding: '0.35rem 0.9rem',
              }}>{n}</span>
            ))}
          </div>
        </section>

        {/* ══ PHILOSOPHY ══ */}
        <section id="about" style={{ ...S.container, padding: '7rem 5vw' }}>
          <div className="bh-philo" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
            <div className="reveal">
              <div style={S.eyebrow}><span style={S.rule} />Philosophy</div>
              <h2 style={S.h2}>The cosmos is <span style={S.gradText}>mapped in you.</span></h2>
              <p style={{ ...S.body, marginBottom: '1.1rem' }}>
                The ancient rishis understood that the macrocosm and the individual are one.
                Your birth chart is a map of your tendencies, gifts and dharma — not a cage.
              </p>
              <p style={S.body}>
                Every planet in Bhagya is computed with Swiss Ephemeris and Lahiri Ayanamsa —
                the professional standard used by Jyotishis worldwide. No approximations, no shortcuts.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {['Kundali', 'Dasha', 'Destiny Chat', 'Numerology', 'Lal Kitab'].map(t => (
                  <span key={t} className="bh-chip">{t}</span>
                ))}
              </div>
            </div>
            <div className="reveal" style={{ ...S.glass, borderRadius: 24, padding: '2.6rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(circle at 50% 0%, rgba(223,168,79,0.10), transparent 65%)`,
                pointerEvents: 'none',
              }} />
              <svg width="88" height="88" viewBox="0 0 52 52" fill="none" style={{ margin: '0 auto 1.4rem', display: 'block', animation: 'bh-float 6s ease-in-out infinite' }}>
                <circle cx="26" cy="26" r="25" stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
                <circle cx="26" cy="26" r="16" stroke={GOLD} strokeWidth="0.5" opacity="0.2" />
                <circle cx="26" cy="26" r="7"  stroke={GOLD} strokeWidth="0.5" opacity="0.4" />
                <path d="M26 14 L27.2 24.8 L38 26 L27.2 27.2 L26 38 L24.8 27.2 L14 26 L24.8 24.8 Z" fill={GOLD} opacity="0.8" />
                <circle cx="26" cy="26" r="2.8" fill={GOLD} />
              </svg>
              <p style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '1.25rem', lineHeight: 1.55, color: 'rgba(243,237,223,0.85)', margin: 0 }}>
                “यथा पिण्डे तथा ब्रह्माण्डे”
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: DIM, marginTop: '0.9rem' }}>
                As is the microcosm, so is the macrocosm
              </p>
            </div>
          </div>
        </section>

        {/* ══ PRICING TEASER ══ */}
        <section style={{ ...S.container, padding: '0 5vw 7rem' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '2.6rem' }}>
            <div style={{ ...S.eyebrow, justifyContent: 'center' }}>
              <span style={S.rule} />Simple pricing<span style={{ ...S.rule, transform: 'scaleX(-1)' }} />
            </div>
            <h2 style={S.h2}>Start free. <span style={S.gradText}>Go deeper</span> when ready.</h2>
          </div>
          <div className="bh-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: 980, margin: '0 auto' }}>
            {PLANS.map((p, i) => (
              <div key={p.name} className="reveal" style={{
                ...S.glass, borderRadius: 20, padding: '1.8rem',
                position: 'relative', transitionDelay: `${i * 0.07}s`,
                ...(p.popular && { border: `1px solid rgba(242,203,132,0.45)`, boxShadow: '0 0 44px rgba(223,168,79,0.12)' }),
              }}>
                {p.popular && (
                  <span style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.56rem', letterSpacing: '2px',
                    background: `linear-gradient(135deg, ${GOLDL}, ${GOLD})`, color: '#1C1205', fontWeight: 600,
                    borderRadius: 999, padding: '0.28rem 0.9rem',
                  }}>MOST POPULAR</span>
                )}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: p.popular ? GOLD : MUT, marginBottom: '0.8rem' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.7rem' }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: '2.4rem', fontWeight: 600, color: FG, letterSpacing: '-0.02em' }}>{p.price}</span>
                  <span style={{ fontSize: '0.78rem', color: DIM }}>{p.per}</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: MUT, lineHeight: 1.7, margin: '0 0 1.4rem' }}>{p.desc}</p>
                <Link to="/pricing" style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', letterSpacing: '2px',
                  textTransform: 'uppercase', color: GOLD, textDecoration: 'none',
                }}>View details →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FINAL CTA ══ */}
        <section style={{ ...S.container, padding: '0 5vw 7rem' }}>
          <div className="reveal" style={{
            ...S.glass, borderRadius: 28, padding: 'clamp(2.5rem, 6vw, 4.5rem)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
            border: `1px solid rgba(242,203,132,0.28)`,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse 60% 80% at 50% 110%, rgba(223,168,79,0.16), transparent 70%), radial-gradient(ellipse 40% 50% at 85% -10%, rgba(139,111,232,0.12), transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ ...S.eyebrow, justifyContent: 'center', position: 'relative' }}>
              <span style={S.rule} />Begin your journey<span style={{ ...S.rule, transform: 'scaleX(-1)' }} />
            </div>
            <h2 style={{ ...S.h2, fontSize: 'clamp(2.4rem, 5vw, 4.4rem)', position: 'relative' }}>
              Your stars <span style={S.gradText}>are aligned.</span>
            </h2>
            <p style={{ ...S.body, margin: '0 auto 2.4rem', textAlign: 'center', position: 'relative' }}>
              Join thousands seeking clarity through the ancient science of Jyotisha.
              Your free Kundali awaits — no credit card, no commitment.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <Link to="/chart/new" style={S.btnP}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.07)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
              >Create free chart →</Link>
              <Link to="/login" style={S.btnO}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(223,168,79,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(223,168,79,0.05)' }}
              >Sign in</Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* ── Landing-scoped CSS ── */}
      <style>{`
        .bh-marquee {
          display: flex; gap: 1.1rem; width: max-content;
          animation: bh-scroll 40s linear infinite;
          padding: 0 1rem;
        }
        .bh-marquee:hover { animation-play-state: paused; }
        @keyframes bh-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollLine {
          0%   { opacity: 0; transform: scaleY(0); transform-origin: top }
          45%  { opacity: 1; transform: scaleY(1); transform-origin: top }
          55%  { opacity: 1; transform: scaleY(1); transform-origin: bottom }
          100% { opacity: 0; transform: scaleY(0); transform-origin: bottom }
        }

        @media (max-width: 1024px) {
          .bh-bento { grid-template-columns: repeat(2, 1fr) !important; }
          .bh-bento-card { grid-column: span 1 !important; }
          .bh-bento-big { grid-column: span 2 !important; }
          .bh-philo { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .bh-hero-copy { padding: 4.5rem 0 6rem !important; }
          .bh-stats-grid { grid-template-columns: 1fr 1fr !important; row-gap: 1.6rem; }
          .bh-stats-grid > div { border-left: none !important; padding: 0 0.5rem !important; }
          .bh-steps { grid-template-columns: 1fr !important; }
          .bh-plans { grid-template-columns: 1fr !important; }
          .bh-bento { grid-template-columns: 1fr !important; }
          .bh-bento-card, .bh-bento-big { grid-column: span 1 !important; }
          .bh-scroll-hint { display: none !important; }
          .bh-hero-cta a { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
