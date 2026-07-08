import { useEffect, useRef } from 'react'

/**
 * GravityCanvas — 2D canvas gravity-warp mesh
 * Re-skinned from Komposo "Gravity" in TheBhagya gold/amber palette.
 * Represents the cosmic Vedic grid (yantra mesh) reacting to presence.
 *
 * Props:
 *   density   — grid spacing in px        (default 32)
 *   force     — push strength multiplier  (default 5)
 *   radius    — influence radius in px    (default 160)
 *   glow      — glow intensity 0–100      (default 55)
 *   opacity   — overall canvas opacity    (default 1)
 */
export default function GravityCanvas({
  density = 32,
  force   = 5,
  radius  = 160,
  glow    = 55,
  opacity = 1,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const cfg = { density, force, radius, glow }
    const mouse = { x: -2000, y: -2000, active: false }
    let points = [], cols = 0, rows = 0, animId

    class Point {
      constructor(x, y, col, row) {
        this.originX = x; this.originY = y
        this.x = x;       this.y = y
        this.vx = 0;      this.vy = 0
        this.col = col;   this.row = row
      }
      update() {
        const dx   = mouse.x - this.originX
        const dy   = mouse.y - this.originY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < cfg.radius) {
          const power = (cfg.radius - dist) / cfg.radius
          const angle = Math.atan2(dy, dx)
          const f     = cfg.force * 14
          this.vx += Math.cos(angle) * power * f * 0.1
          this.vy += Math.sin(angle) * power * f * 0.1
        }
        this.vx += (this.originX - this.x) * 0.08
        this.vy += (this.originY - this.y) * 0.08
        this.vx *= 0.85; this.vy *= 0.85
        this.x  += this.vx; this.y  += this.vy
      }
    }

    function initGrid() {
      points = []
      const sp = cfg.density
      cols = Math.ceil(canvas.width  / sp) + 1
      rows = Math.ceil(canvas.height / sp) + 1
      const ox = (canvas.width  - (cols - 1) * sp) / 2
      const oy = (canvas.height - (rows - 1) * sp) / 2
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          points.push(new Point(ox + c * sp, oy + r * sp, c, r))
    }

    function getPoint(c, r) {
      if (c < 0 || c >= cols || r < 0 || r >= rows) return null
      return points[r * cols + c]
    }

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      initGrid()
    }

    function draw() {
      const gl = cfg.glow / 100

      // Background
      ctx.fillStyle = '#05050f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle radial vignette
      const rg = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width * 0.65,
      )
      rg.addColorStop(0, 'rgba(25,14,5,0.45)')
      rg.addColorStop(1, 'transparent')
      ctx.fillStyle = rg; ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Horizontal grid lines — gold hue
      for (let r = 0; r < rows; r++) {
        ctx.beginPath()
        for (let c = 0; c < cols; c++) {
          const p = getPoint(c, r)
          c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        }
        // Gold → amber hue across rows (35 → 25)
        const hue = 38 - (r / rows) * 12
        ctx.strokeStyle = `hsla(${hue}, 72%, 52%, ${gl * 0.38})`
        ctx.lineWidth = 0.7; ctx.stroke()
      }

      // Vertical grid lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath()
        for (let r = 0; r < rows; r++) {
          const p = getPoint(c, r)
          r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        }
        const hue = 38 - (c / cols) * 12
        ctx.strokeStyle = `hsla(${hue}, 72%, 52%, ${gl * 0.38})`
        ctx.lineWidth = 0.7; ctx.stroke()
      }

      // Node glow on displaced points
      for (const p of points) {
        const dx = p.x - p.originX, dy = p.y - p.originY
        const disp = Math.sqrt(dx*dx + dy*dy)
        const intensity = Math.min(disp / 48, 1)
        if (intensity > 0.08) {
          const hue = 38 - (p.row / rows) * 12
          const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18 * intensity)
          ng.addColorStop(0, `hsla(${hue}, 85%, 65%, ${gl * intensity * 0.72})`)
          ng.addColorStop(1, 'transparent')
          ctx.fillStyle = ng
          ctx.beginPath(); ctx.arc(p.x, p.y, 18 * intensity, 0, Math.PI * 2); ctx.fill()
          // Core dot
          ctx.fillStyle = `hsla(${hue}, 90%, 78%, ${gl * intensity})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 + intensity * 2, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Mouse glow
      if (mouse.active) {
        const r = cfg.radius
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(201,147,58,${gl * 0.14})`
        ctx.lineWidth = 1.5; ctx.stroke()

        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r * 0.55)
        mg.addColorStop(0, `rgba(201,147,58,${gl * 0.18})`)
        mg.addColorStop(0.5, `rgba(180,110,30,${gl * 0.08})`)
        mg.addColorStop(1, 'transparent')
        ctx.fillStyle = mg
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r * 0.55, 0, Math.PI * 2); ctx.fill()

        ctx.fillStyle = `rgba(255,220,140,${gl * 0.7})`
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3.5, 0, Math.PI * 2); ctx.fill()
      }
    }

    function animate() {
      animId = requestAnimationFrame(animate)
      const expectedCols = Math.ceil(canvas.width / cfg.density) + 1
      if (cols !== expectedCols) initGrid()
      for (const p of points) p.update()
      draw()
    }

    const onMove  = e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true }
    const onLeave = () => { mouse.active = false; mouse.x = -2000; mouse.y = -2000 }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseenter', () => { mouse.active = true })
    canvas.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)

    resize()
    animate()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [density, force, radius, glow])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, display: 'block',
        opacity,
        // Allow mouse events to pass through to the canvas itself
        pointerEvents: 'auto',
      }}
    />
  )
}
