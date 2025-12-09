'use client'

import {OrbitControls} from '@react-three/drei'
import {Canvas} from '@react-three/fiber'
import {Leva} from 'leva'
import {ReactNode} from 'react'

interface SceneWrapperProps {
  children: ReactNode
}

export function SceneWrapper({children}: SceneWrapperProps) {
  return (
    <div className='w-full hidden dark:flex absolute pointer-events-none md:h-74 h-48'>
      <Leva hidden />
      <Canvas
        camera={{position: [40, 26, 24], fov: 18}}
        gl={{antialias: true}}
        dpr={[1, 8]}>
        <OrbitControls
          getAzimuthalAngle={(angle: number) => console.log(angle)}
          minDistance={40}
          maxDistance={40}
          maxAzimuthAngle={6}
          minAzimuthAngle={-6}
          autoRotateSpeed={0.005}
          minPolarAngle={-5}
          maxPolarAngle={5}
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
          autoRotate
        />
        {children}
      </Canvas>
    </div>
  )
}
