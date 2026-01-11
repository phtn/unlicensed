'use client'

import {Physics, usePlane, useSphere} from '@react-three/cannon'
import {ContactShadows, Environment, Lightformer} from '@react-three/drei'
import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {Suspense, useEffect, useState} from 'react'

// Helper function to darken a hex color
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function Ball({
  position,
  color,
  startDelay,
  speed,
}: {
  position: [number, number, number]
  color: string
  startDelay: number
  speed: number
}) {
  const [ref, api] = useSphere(() => {
    console.log('[v0] Initializing ball at', position)
    return {
      mass: 3,
      position,
      args: [0.5],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ],
    }
  })

  const [hovered, setHovered] = useState(false)

  // Apply initial velocity to move balls towards center in z-axis with random delay and speed
  useEffect(() => {
    const timer = setTimeout(() => {
      // Set velocity directly in z direction (negative z moves towards camera/center)
      // Use stronger impulse to ensure they move quickly
      api.applyImpulse([0, 0, -speed], [0, 0, 0])
    }, startDelay)
    return () => clearTimeout(timer)
  }, [api, startDelay, speed])

  return (
    <mesh
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        // Apply impulse in z direction and a little bit in x direction
        const xImpulse = (Math.random() - 0.5) * 1.5 // Random x between -0.75 and 0.75
        api.applyImpulse([xImpulse, 0, -2], [0, 0, 0])
      }}
      castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? darkenColor(color, 80) : color}
        roughness={0.15}
        metalness={0.4}
        envMapIntensity={1.2}
      />
    </mesh>
  )
}

function MouseTracker() {
  const {viewport, mouse} = useThree()
  const [, api] = useSphere(() => ({type: 'Kinematic', args: [0.0002]}))

  useFrame(() => {
    const x = (mouse.x * viewport.width) / 2
    const y = (mouse.y * viewport.height) / 2
    api.position.set(x, y, 2)
  })

  return null
}

function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -4, 0],
  }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial transparent opacity={0.01} />
    </mesh>
  )
}

function Borders() {
  const {viewport} = useThree()
  usePlane(() => ({
    position: [-viewport.width / 2, 0, 0],
    rotation: [0, Math.PI / 2, 0],
  }))
  usePlane(() => ({
    position: [viewport.width / 2, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
  }))
  usePlane(() => ({
    position: [0, viewport.height / 2, 0],
    rotation: [Math.PI / 2, 0, 0],
  }))
  usePlane(() => ({
    position: [0, -viewport.height / 2, 0],
    rotation: [-Math.PI / 2, 0, 0],
  }))
  return null
}

export const OrbScene = () => {
  // Generate random values once using useState lazy initializer
  const balls = useState(() => [
    // {color: '#ff4d4d', position: [-2, 2, 0] as [number, number, number]},
    // {color: '#4dff4d', position: [0, 3, 0] as [number, number, number]},
    // {color: '#4d4dff', position: [2, 2, 0] as [number, number, number]},
    // {color: '#ffff4d', position: [-1, 0, 0] as [number, number, number]},
    // {color: '#ff4dff', position: [1, 1, 0] as [number, number, number]},
    // {color: '#4dffff', position: [0, -2, 0] as [number, number, number]},
    {
      color: '#fc81fe',
      position: [-3, -4, 10] as [number, number, number],
      startDelay: Math.random() * 2000,
      speed: 3 + Math.random() * 5, // Random speed between 3-8
    },
    {
      color: '#800080',
      position: [3, -4, 10] as [number, number, number],
      startDelay: Math.random() * 2000,
      speed: 3 + Math.random() * 5, // Random speed between 3-8
    },
  ])[0]

  return (
    <div className='absolute inset-0 z-100 pointer-events-none'>
      <Suspense
        fallback={
          <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
            ...
          </div>
        }>
        <Canvas shadows camera={{position: [0, 0, 10], fov: 35}}>
          {/*<color attach='background' args={['#f0f4f8']} />*/}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Physics gravity={[0, -9.81, 0]} iterations={10}>
            <MouseTracker />
            <Borders />
            <Floor />
            {balls.map((ball, i) => (
              <Ball
                key={i}
                position={ball.position}
                color={ball.color}
                startDelay={ball.startDelay}
                speed={ball.speed}
              />
            ))}
          </Physics>

          {/*<Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Text
              position={[0, 0, -2]}
              fontSize={4}
              color='#2d3748'
              anchorX='center'
              anchorY='middle'
              fillOpacity={0.1}>
              ZUSTAND
            </Text>
          </Float>*/}

          <ContactShadows
            position={[0, -4, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            far={4.5}
          />

          {/* Procedural environment - no external HDR files needed */}
          <Environment resolution={256}>
            {/* Main warm light from above-right (sunset sun) */}
            <Lightformer
              intensity={2}
              rotation-x={Math.PI / 2}
              position={[0, 4, -5]}
              scale={[10, 1, 1]}
              color='#ff9f43'
            />
            {/* Cool fill from left */}
            <Lightformer
              intensity={0.5}
              rotation-y={Math.PI / 2}
              position={[-5, 1, 0]}
              scale={[20, 1, 1]}
              color='#7c5ce5'
            />
            {/* Warm accent from right */}
            <Lightformer
              intensity={0.8}
              rotation-y={-Math.PI / 2}
              position={[5, 0, 0]}
              scale={[20, 1, 1]}
              color='#ff6b9d'
            />
            {/* Soft ground bounce */}
            <Lightformer
              intensity={0.3}
              rotation-x={-Math.PI / 2}
              position={[0, -4, 0]}
              scale={[10, 10, 1]}
              color='#ffecd2'
            />
          </Environment>
        </Canvas>
      </Suspense>
    </div>
  )
}
