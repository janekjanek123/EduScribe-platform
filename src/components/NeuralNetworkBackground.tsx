'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
}

interface Connection {
  from: Node
  to: Node
  opacity: number
}

const NeuralNetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // EduScribe color palette
  const colors = [
    '#2CD3E1', // Cyan
    '#8AD4FF', // Light blue
    '#FFA500', // Orange
    '#A020F0', // Purple
    '#00FFC2'  // Green
  ]

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Create nodes
    const nodeCount = Math.min(50, Math.floor((dimensions.width * dimensions.height) / 15000))
    const nodes: Node[] = []

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.3
      })
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.fillStyle = '#1F2235'
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Update nodes
      nodes.forEach(node => {
        // Mouse interaction - subtle attraction
        const dx = mouseRef.current.x - node.x
        const dy = mouseRef.current.y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150 * 0.001
          node.vx += dx * force
          node.vy += dy * force
        }

        // Update position
        node.x += node.vx
        node.y += node.vy

        // Boundary bounce
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1

        // Keep in bounds
        node.x = Math.max(0, Math.min(dimensions.width, node.x))
        node.y = Math.max(0, Math.min(dimensions.height, node.y))

        // Damping
        node.vx *= 0.999
        node.vy *= 0.999

        // Oscillating opacity
        node.opacity = Math.sin(Date.now() * 0.001 + node.x * 0.01) * 0.3 + 0.5
      })

      // Draw connections
      const connections: Connection[] = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            connections.push({
              from: nodes[i],
              to: nodes[j],
              opacity: (120 - distance) / 120 * 0.25
            })
          }
        }
      }

      // Draw connections
      connections.forEach(connection => {
        ctx.beginPath()
        ctx.moveTo(connection.from.x, connection.from.y)
        ctx.lineTo(connection.to.x, connection.to.y)
        ctx.strokeStyle = `rgba(44, 211, 225, ${connection.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        
        // Convert hex to rgba
        const hex = node.color.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.opacity})`
        ctx.fill()

        // Glow effect
        ctx.shadowColor = node.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        background: '#1F2235'
      }}
    />
  )
}

export default NeuralNetworkBackground 