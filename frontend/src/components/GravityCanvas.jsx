import { useEffect, useRef } from 'react'

/**
 * GravityCanvas — gold Vedic yantra gravity mesh
 * Tracks window mouse so it works even when content sits on top.
 * pointerEvents: none — never blocks clicks.
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
        const dx = mouse.x - this.originX, dy = mouse.y - this.originY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < cfg.radius) {
          const power = (cfg.radius - dist) / cfg.radius
          const angle = Math.atan2(dy, dx)
          const f = cfg.force * 14
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

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath()
        for (let c = 0; c < cols; c++) {
          const p = getPoint(c, r)
          c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        }
        const hue = 38 - (r / rows) * 10
        ctx.strokeStyle = `hsla(${hue},72%,52%,${gl * 0.35})`
        ctx.lineWidth = 0.6; ctx.stroke()
      }

      // Vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath()
        for (let r = 0; r < rows; r++) {
          const p = getPoint(c, r)
          r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        }
        const hue = 38 - (c / cols) * 10
        ctx.strokeStyle = `hsla(${hue},72%,52%,${gl * 0.35})`
        ctx.lineWidth = 0.6; ctx.stroke()
      }

      // Node glow on displaced points
      for (const p of points) {
        const dx = p.x - p.originX, dy = p.y - p.originY
        const disp = Math.sqrt(dx*dx + dy*dy)
        const intensity = Math.min(disp / 48, 1)
        if (intensity > 0.08) {
          const hue = 38 - (p.row / rows) * 10
          const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16 * intensity)
          ng.addColorStop(0, `hsla(${hue},85%,68%,${gl * intensity * 0.70})`)
          ng.addColorStop(1, 'transparent')
          ctx.fillStyle = ng
          ctx.beginPath(); ctx.arc(p.x, p.y, 16 * intensity, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = `hsla(${hue},90%,80%,${gl * intensity})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 + intensity * 2, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Cursor glow
      if (mouse.active) {
        const r = cfg.radius
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r * 0.5)
        mg.addColorStop(0, `rgba(223,168,79,${gl * 0.20})`)
        mg.addColorStop(0.5, `rgba(139,111,232,${gl * 0.07})`)
        mg.addColorStop(1, 'transparent')
        ctx.fillStyle = mg
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r * 0.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = `rgba(255,220,140,${gl * 0.65})`
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill()
      }
    }

    function animate() {
      animId = requestAnimationFrame(animate)
      const expectedCols = Math.ceil(canvas.width / cfg.density) + 1
      if (cols !== expectedCols) initGrid()
      for (const p of points) p.update()
      draw()
    }

    // Use WINDOW events — works even when content overlaps the canvas
    const onMove  = e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true }
    const onLeave = () => { mouse.active = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)

    resize()
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
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
        opacity, pointerEvents: 'none', // never blocks clicks
      }}
    />
  )
}
