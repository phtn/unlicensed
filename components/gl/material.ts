import {shaderMaterial} from '@react-three/drei'
import {extend} from '@react-three/fiber'
import * as THREE from 'three'

export const GrassMaterial2 = shaderMaterial(
  {
    bladeHeight: 1,
    ref: null,
    map: null,
    alphaMap: null,
    time: 0,
    windStrength: 0.3,
    windFrequency: 1.5,
    tipColor: new THREE.Color(0.35, 0.7, 0.25).convertSRGBToLinear(),
    bottomColor: new THREE.Color(0.05, 0.15, 0.05).convertSRGBToLinear(),
  },
  `precision mediump float;
  attribute vec3 offset;
  attribute vec4 orientation;
  attribute float halfRootAngleSin;
  attribute float halfRootAngleCos;
  attribute float stretch;
  uniform float time;
  uniform float bladeHeight;
  uniform float windStrength;
  uniform float windFrequency;
  varying vec2 vUv;
  varying float frc;
  varying vec3 vNormal;
  varying float vAO;
  varying float vWindEffect;

  // WEBGL-NOISE FROM https://github.com/stegu/webgl-noise
  vec3 mod289(vec3 x) {return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec2 mod289(vec2 x) {return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec3 permute(vec3 x) {return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
    return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
  }

  vec4 slerp(vec4 v0, vec4 v1, float t) {
    normalize(v0);
    normalize(v1);
    float dot_ = dot(v0, v1);
    if (dot_ < 0.0) {
      v1 = -v1;
      dot_ = -dot_;
    }
    const float DOT_THRESHOLD = 0.9995;
    if (dot_ > DOT_THRESHOLD) {
      vec4 result = t*(v1 - v0) + v0;
      normalize(result);
      return result;
    }
    float theta_0 = acos(dot_);
    float theta = theta_0*t;
    float sin_theta = sin(theta);
    float sin_theta_0 = sin(theta_0);
    float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
    float s1 = sin_theta / sin_theta_0;
    return (s0 * v0) + (s1 * v1);
  }

  void main() {
    frc = position.y / float(bladeHeight);

    // Multi-layered wind with different frequencies
    vec2 windCoord = vec2(offset.x, offset.z) * 0.02;
    float timeScale = time * windFrequency;

    // Primary wind wave (slow, broad)
    float windNoise1 = snoise(windCoord + vec2(timeScale * 0.3, timeScale * 0.2));

    // Secondary wind wave (faster, adds variation)
    float windNoise2 = snoise(windCoord * 2.5 + vec2(timeScale * 0.7, -timeScale * 0.5));

    // Wind gusts (very slow, large scale)
    float windGust = snoise(windCoord * 0.5 + vec2(timeScale * 0.1, 0.0));

    // Combine wind layers
    float windEffect = windNoise1 * 0.5 + windNoise2 * 0.3 + windGust * 0.2;
    windEffect = windEffect * 0.5 + 0.5; // Normalize to 0-1

    vWindEffect = windEffect;

    // Calculate blade direction with growth orientation
    vec4 direction = vec4(0.0, halfRootAngleSin, 0.0, halfRootAngleCos);

    // Smooth interpolation weighted by height
    float blendFactor = frc * frc; // Squared for more gradual blend
    direction = slerp(direction, orientation, blendFactor);

    // Natural blade curvature (tips droop slightly)
    float curvature = frc * frc * frc; // Cubic for natural curve
    vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
    vPosition = rotateVectorByQuaternion(vPosition, direction);

    // Apply wind with exponential falloff (stronger at tips)
    float windInfluence = frc * frc * windStrength;
    float windAngle = (windEffect - 0.5) * windInfluence * 0.8;

    // Wind direction varies slightly across the field
    float windDirVariation = snoise(windCoord * 3.0) * 0.3;
    vec3 windAxis = normalize(vec3(
      sin(windDirVariation),
      0.0,
      cos(windDirVariation)
    ));

    // Create wind rotation quaternion
    float halfWindAngle = windAngle * 0.5;
    vec4 windRotation = vec4(
      windAxis * sin(halfWindAngle),
      cos(halfWindAngle)
    );
    vPosition = rotateVectorByQuaternion(vPosition, normalize(windRotation));

    // Add subtle secondary sway perpendicular to main wind
    float secondarySway = snoise(windCoord * 4.0 + vec2(timeScale * 1.3, timeScale * 0.8)) * 0.1;
    float secondaryAngle = secondarySway * windInfluence * frc;
    vec4 secondaryRotation = vec4(
      -windAxis.z * sin(secondaryAngle * 0.5),
      0.0,
      windAxis.x * sin(secondaryAngle * 0.33),
      cos(secondaryAngle * 0.5)
    );
    vPosition = rotateVectorByQuaternion(vPosition, normalize(secondaryRotation));

    // Calculate ambient occlusion (darker at base)
    vAO = mix(0.4, 1.0, frc * frc);

    // Calculate normal for lighting (simplified)
    vNormal = normalize(vec3(vPosition.x - offset.x, 1.0, vPosition.z - offset.z));

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
  }`,
  `precision mediump float;
  uniform sampler2D map;
  uniform sampler2D alphaMap;
  uniform vec3 tipColor;
  uniform vec3 bottomColor;
  varying vec2 vUv;
  varying float frc;
  varying vec3 vNormal;
  varying float vAO;
  varying float vWindEffect;

  void main() {
    float alpha = texture2D(alphaMap, vUv).r;
    if(alpha < 0.15) discard;

    vec4 col = texture2D(map, vUv);

    // Improved color gradients
    vec3 grassColor = mix(bottomColor, tipColor, frc);

    // Add color variation based on wind (subtle movement highlights)
    float windHighlight = vWindEffect * 0.15;
    grassColor += vec3(windHighlight * 0.1, windHighlight * 0.2, windHighlight * 0.05);

    // Mix with texture
    col.rgb = mix(grassColor, col.rgb * grassColor, 0.7);

    // Apply ambient occlusion
    col.rgb *= vAO;

    // Subsurface scattering approximation
    // Grass is more translucent at tips
    float subsurface = frc * 0.23;
    vec3 subsurfaceColor = tipColor * 1.5;
    col.rgb = mix(col.rgb, subsurfaceColor, subsurface * vWindEffect);

    // Add slight rim lighting effect at edges
    float rimLight = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0) * frc * 0.2;
    col.rgb += vec3(rimLight * 0.3, rimLight * 0.5, rimLight * 0.2);

    // Subtle saturation boost for more vibrant grass
    float luminance = dot(col.rgb, vec3(0.299, 0.587, 0.114));
    col.rgb = mix(vec3(luminance), col.rgb, 1.15);

    gl_FragColor = vec4(col.rgb, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`,
  (self) => {
    self!.side = THREE.DoubleSide
  },
)

extend({GrassMaterial2})

// export { GrassMaterial2 }
