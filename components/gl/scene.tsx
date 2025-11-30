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
    <div className='h-full w-full relative pointer-events-none min-h-96'>
      <Leva hidden />
      <Canvas
        camera={{position: [40, 27, 28], fov: 18}}
        gl={{antialias: true}}
        dpr={[1, 8]}>
        <OrbitControls
          minDistance={40}
          maxDistance={40}
          maxAzimuthAngle={6}
          minAzimuthAngle={-6}
          autoRotateSpeed={0.002}
          minPolarAngle={-10}
          maxPolarAngle={10}
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
