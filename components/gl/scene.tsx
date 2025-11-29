'use client'

import {OrbitControls} from '@react-three/drei'
import {Canvas, useThree} from '@react-three/fiber'
import {Leva} from 'leva'
import {ReactNode, useEffect} from 'react'
import {useCatalogStore} from './store'

interface SceneWrapperProps {
  children: ReactNode
}

function CameraHandler() {
  const setCameraPosition = useCatalogStore((state) => state.setCameraPosition)
  const {camera, controls} = useThree()

  useEffect(() => {
    if (!controls) return

    const callback = () => {
      setCameraPosition([
        Number(camera.position.x.toFixed(2)),
        Number(camera.position.y.toFixed(2)),
        Number(camera.position.z.toFixed(2)),
      ])
    }
    return () => {
      removeEventListener('change', callback)
    }
  }, [controls, camera, setCameraPosition])

  return null
}

export function SceneWrapper({children}: SceneWrapperProps) {
  return (
    <div className='h-full w-full relative'>
      <Leva hidden />
      <Canvas
        camera={{position: [60, 40, 20], fov: 18}}
        gl={{antialias: true}}
        dpr={[1, 8]}>
        <OrbitControls
          makeDefault
          autoRotate
          enableDamping
          autoRotateSpeed={0.002}
        />
        {children}
        <CameraHandler />
      </Canvas>
    </div>
  )
}
