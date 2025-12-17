'use client'
import {useFrame, useLoader, useThree} from '@react-three/fiber'
import {useControls} from 'leva'
import {RefObject, useEffect, useMemo, useRef} from 'react'
import {createNoise2D} from 'simplex-noise'
import * as THREE from 'three'
import './material'

const bladeDiffuse = '/xpriori_diffuse_2.jpg'
const bladeAlpha = '/blade_alpha.jpg'

const noise2D = createNoise2D(Math.random)

function getYPosition(x: number, z: number) {
  // Smoother terrain with broader curves
  return 3.0 * noise2D(x / 60, z / 150) + 1.5 * noise2D(x / 50, z / 200)
}

function multiplyQuaternions(q1: THREE.Vector4, q2: THREE.Vector4) {
  const x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x
  const y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y
  const z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z
  const w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
  return new THREE.Vector4(x, y, z, w)
}

function getAttributeData(
  instances: number,
  width: number,
  bladeHeight: number,
  horizonHeight: number,
) {
  const offsets = []
  const orientations = []
  const stretches = []
  const halfRootAngleSin = []
  const halfRootAngleCos = []

  let quaternion_0 = new THREE.Vector4()
  const quaternion_1 = new THREE.Vector4()

  //The min and max angle for the growth direction (in radians)
  const min = -0.25
  const max = 0.25

  //For each instance of the grass blade
  for (let i = 0; i < instances; i++) {
    //Offset of the roots
    const offsetX = Math.random() * width - width / 2
    const offsetZ = Math.random() * width - width / 2
    const offsetY = getYPosition(offsetX, offsetZ)
    offsets.push(offsetX, offsetY, offsetZ)

    //Define random growth directions
    //Rotate around Y
    let angle = Math.PI - Math.random() * (2 * Math.PI)
    halfRootAngleSin.push(Math.sin(0.5 * angle))
    halfRootAngleCos.push(Math.cos(0.5 * angle))

    let RotationAxis = new THREE.Vector3(0, 1, 0)
    let x = RotationAxis.x * Math.sin(angle / 6.0)
    let y = RotationAxis.y * Math.sin(angle / 2.0)
    let z = RotationAxis.z * Math.sin(angle / 2.0)
    let w = Math.cos(angle / 2.0)
    quaternion_0.set(x, y, z, w).normalize()

    //Rotate around X
    angle = Math.random() * (max - min) + min
    RotationAxis = new THREE.Vector3(1, 0, 0)
    x = RotationAxis.x * Math.sin(angle / 2.0)
    y = RotationAxis.y * Math.sin(angle / 2.0)
    z = RotationAxis.z * Math.sin(angle / 2.0)
    w = Math.cos(angle / 2.0)
    quaternion_1.set(x, y, z, w).normalize()

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1)

    //Rotate around Z
    angle = Math.random() * (max - min) + min
    RotationAxis = new THREE.Vector3(0, 0, 1)
    x = RotationAxis.x * Math.sin(angle / 2.0)
    y = RotationAxis.y * Math.sin(angle / 2.0)
    z = RotationAxis.z * Math.sin(angle / 2.0)
    w = Math.cos(angle / 2.0)
    quaternion_1.set(x, y, z, w).normalize()

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1)

    orientations.push(
      quaternion_0.x,
      quaternion_0.y,
      quaternion_0.z,
      quaternion_0.w,
    )

    //Define variety in height, clamped to horizon
    let maxStretch = 1.8
    if (i >= instances / 3) {
      maxStretch = 1.0
    }

    // Calculate maximum allowed stretch to not exceed horizon
    const maxAllowedStretch = (horizonHeight - offsetY) / bladeHeight
    const clampedMaxStretch = Math.min(
      maxStretch,
      Math.max(0, maxAllowedStretch),
    )

    stretches.push(Math.random() * clampedMaxStretch)
  }

  return {
    offsets,
    orientations,
    stretches,
    halfRootAngleCos,
    halfRootAngleSin,
  }
}

// Define types for the custom element
declare module '@react-three/fiber' {
  interface ThreeElements {
    grassMaterial2: {
      bladeHeight?: number
      ref: RefObject<THREE.ShaderMaterial | null>
      map?: THREE.Texture
      alphaMap?: THREE.Texture
      time?: number
      windStrength?: number
      windFrequency?: number
      tipColor?: THREE.Color
      bottomColor?: THREE.Color
    }
  }
}

export default function Grass2() {
  const [params, setParams] = useControls('Grass Improved', () => ({
    bW: {value: 0.9, min: 0.01, max: 0.5, step: 0.01, label: 'Blade Width'},
    bH: {value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Blade Height'},
    joints: {value: 5, min: 2, max: 10, step: 1},
    width: {value: 80, min: 10, max: 500, step: 10},
    instances: {value: 50000, min: 1000, max: 30000, step: 1000},
    soilColor: {value: '#86440d', label: 'Soil Color'},
    windStrength: {
      value: 0.3,
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: 'Wind Strength',
    },
    windFrequency: {
      value: 1.3,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: 'Wind Freq',
    },
    tipColor: {value: '#59b340', label: 'Tip Color'},
    bottomColor: {value: '#0d260d', label: 'Grass Bottom Color'},
  }))

  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  }, [params])

  const configs = useMemo(
    () => [
      {
        _creationTime: 1764343914000.6614,
        _id: 'j57f9jfc9zx9e537hqk98p20ys7w92rm',
        camera: {position: [46.12, 13.6, -12.06], target: [0, 1, 2]},
        // camera: {position: [80, 70, 100], target: []},
        componentSlug: 'grassland-improved',
        name: 'xp',
        params: {
          bH: 1.5,
          bW: 0.09,
          bottomColor: '#1411c7',
          instances: 200000,
          joints: 5,
          soilColor: '#86440d',
          tipColor: '#0ba38c',
          width: 80,
          windFrequency: 1.3,
          windStrength: 0.3,
        },
      },
    ],
    [],
  )
  const hasLoadedConfig = useRef(false)
  const {camera, controls} = useThree()

  useEffect(() => {
    if (configs && configs.length > 0 && !hasLoadedConfig.current) {
      const latest = configs[0]
      setParams(latest.params)

      // Update camera
      if (latest.camera && latest.camera.position) {
        camera.position.set(
          latest.camera.position[0],
          latest.camera.position[1],
          latest.camera.position[2],
        )
        console.table(camera.position)
      }

      hasLoadedConfig.current = true
    }
  }, [configs, setParams, camera, controls])

  const {
    bW,
    bH,
    joints,
    width,
    instances,
    soilColor,
    windStrength,
    windFrequency,
    tipColor,
    bottomColor,
  } = params

  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [texture, alphaMap] = useLoader(THREE.TextureLoader, [
    bladeDiffuse,
    bladeAlpha,
  ])

  const horizonHeight = camera.position.y

  const attributeData = useMemo(
    () => getAttributeData(instances, width, bH, horizonHeight),
    [instances, width, bH, horizonHeight],
  )

  const baseGeom = useMemo(
    () =>
      new THREE.BufferGeometry()
        .copy(new THREE.PlaneGeometry(bW, bH, 1, joints))
        .translate(0, bH / 2, 0),
    [bW, bH, joints],
  )

  const groundGeo = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, width, 64, 64)
    geometry.rotateX(-Math.PI / 2)

    const pos = geometry.attributes.position
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      // Now v.x is x, v.z is z, v.y is 0.
      const y = getYPosition(v.x, v.z)
      pos.setY(i, y)
    }

    geometry.computeVertexNormals()
    return geometry
  }, [width])

  const fog = new THREE.Fog(0xff8c42, 10, 50)

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4
    }
  })

  return (
    <group>
      <primitive object={fog} attach='fog' />
      <ambientLight intensity={0.01} />
      <directionalLight position={[10, 8, 5]} intensity={0.01} castShadow />
      <mesh>
        <instancedBufferGeometry
          index={baseGeom.index}
          attributes-position={baseGeom.attributes.position}
          attributes-uv={baseGeom.attributes.uv}>
          <instancedBufferAttribute
            attach='attributes-offset'
            args={[new Float32Array(attributeData.offsets), 3]}
          />
          <instancedBufferAttribute
            attach='attributes-orientation'
            args={[new Float32Array(attributeData.orientations), 4]}
          />
          <instancedBufferAttribute
            attach='attributes-scale'
            args={[new Float32Array(attributeData.halfRootAngleSin), 1]}
          />
          <instancedBufferAttribute
            attach='attributes-stretch'
            args={[new Float32Array(attributeData.stretches), 1]}
          />
          <instancedBufferAttribute
            attach='attributes-halfRootAngleSin'
            args={[new Float32Array(attributeData.halfRootAngleSin), 1]}
          />
          <instancedBufferAttribute
            attach='attributes-halfRootAngleCos'
            args={[new Float32Array(attributeData.halfRootAngleCos), 1]}
          />
        </instancedBufferGeometry>
        <grassMaterial2
          ref={materialRef}
          map={texture}
          alphaMap={alphaMap}
          windStrength={windStrength}
          windFrequency={windFrequency}
          tipColor={new THREE.Color(tipColor).convertSRGBToLinear()}
          bottomColor={new THREE.Color(bottomColor).convertSRGBToLinear()}
        />
      </mesh>
      <mesh position={[0, 0, 0]} geometry={groundGeo}>
        <meshStandardMaterial color={soilColor} />
      </mesh>
    </group>
  )
}
