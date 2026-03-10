'use client'

import {Center, ContactShadows, Float, Html, useGLTF} from '@react-three/drei'
import {Canvas, useFrame} from '@react-three/fiber'
import {motion, useReducedMotion} from 'motion/react'
import {Suspense, useMemo, useRef} from 'react'
import type {Group, MeshStandardMaterial, PointLight, SpotLight} from 'three'

function IdleModel({reduceMotion}: {reduceMotion: boolean}) {
  const {scene} = useGLTF('/three/model/base.glb')
  const groupRef = useRef<Group>(null)
  const model = useMemo(() => {
    const cloned = scene.clone(true)

    cloned.traverse((child) => {
      if (!('material' in child) || !child.material) return

      const material = child.material as MeshStandardMaterial
      if ('roughness' in material) material.roughness = 0.16
      if ('metalness' in material) material.metalness = 0.04
      if ('envMapIntensity' in material) material.envMapIntensity = 1.45
    })

    return cloned
  }, [scene])

  useFrame((state) => {
    if (!groupRef.current || reduceMotion) return

    const elapsed = state.clock.elapsedTime
    groupRef.current.rotation.x = Math.sin(elapsed * 0.55) * 0.02
    groupRef.current.rotation.y = Math.sin(elapsed * 0.32) * 0.18
    groupRef.current.rotation.z = Math.sin(elapsed * 0.42) * 0.018
    groupRef.current.position.x = Math.sin(elapsed * 0.38) * 0.11
    groupRef.current.position.y = Math.sin(elapsed * 0.8) * 0.06
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float
        speed={reduceMotion ? 0 : 0.9}
        rotationIntensity={0}
        floatIntensity={reduceMotion ? 0 : 0.12}>
        <Center>
          <primitive object={model} scale={1.72} />
        </Center>
      </Float>
    </group>
  )
}

function GlareRig({reduceMotion}: {reduceMotion: boolean}) {
  const glareSpotRef = useRef<SpotLight>(null)
  const rimLightRef = useRef<PointLight>(null)

  useFrame((state) => {
    if (reduceMotion) return

    const elapsed = state.clock.elapsedTime
    const glarePulse = (Math.sin(elapsed * 0.8) + 1) / 2
    const flashPulse = Math.max(0, Math.sin(elapsed * 0.42)) ** 8

    if (glareSpotRef.current) {
      glareSpotRef.current.position.x = 1.4 + Math.sin(elapsed * 0.52) * 1.8
      glareSpotRef.current.position.y = 5.2 + Math.cos(elapsed * 0.43) * 0.7
      glareSpotRef.current.intensity = 4.6 + glarePulse * 1.8 + flashPulse * 18
    }

    if (rimLightRef.current) {
      rimLightRef.current.position.x = 2.6 + Math.cos(elapsed * 0.6) * 1.2
      rimLightRef.current.position.y = 1.4 + Math.sin(elapsed * 0.8) * 0.3
      rimLightRef.current.intensity = 1.5 + glarePulse * 0.6 + flashPulse * 4.5
    }
  })

  return (
    <>
      <spotLight
        ref={glareSpotRef}
        position={[1.4, 5.2, 6.5]}
        intensity={4.6}
        angle={0.22}
        penumbra={0.85}
        color='#ffffff'
      />
      <pointLight
        ref={rimLightRef}
        position={[2.6, 1.4, 4.8]}
        intensity={1.5}
        color='#fff1f8'
      />
    </>
  )
}

function SceneLoader() {
  return (
    <Html center>
      <div className='rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/45 backdrop-blur-sm dark:border-white/10 dark:bg-black/40 dark:text-white/45'>
        Loading scene
      </div>
    </Html>
  )
}

export function CartEmptyScene() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={
        reduceMotion ? {opacity: 0} : {opacity: 0, y: 28, filter: 'blur(12px)'}
      }
      animate={{opacity: 1, y: 0, filter: 'blur(0px)'}}
      transition={{duration: 0.7, ease: 'easeOut'}}
      className='relative h-[30.01rem] w-full sm:h-[36.01rem] lg:h-[42.01rem]'>
      <Canvas
        dpr={[1, 1.5]}
        gl={{antialias: true, alpha: true}}
        camera={{position: [0, 0, 10.6], fov: 24}}>
        <ambientLight intensity={1.95} />
        <directionalLight position={[4, 5, 4]} intensity={3.8} color='#fff7fb' />
        <directionalLight
          position={[-5, 2.5, 4]}
          intensity={2.2}
          color='#ffe1ef'
        />
        <GlareRig reduceMotion={reduceMotion ?? false} />

        <Suspense fallback={<SceneLoader />}>
          <IdleModel reduceMotion={reduceMotion ?? false} />
        </Suspense>

        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.22}
          scale={5}
          blur={2.6}
          far={3.2}
        />
      </Canvas>
    </motion.div>
  )
}

useGLTF.preload('/three/model/base.glb')
