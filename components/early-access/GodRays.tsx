'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// God rays shader — volumetric light beams from below
const godRayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const godRayFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;

  void main() {
    vec2 center = vec2(0.5, 0.0);
    vec2 dir = vUv - center;
    float dist = length(dir);
    float angle = atan(dir.x, dir.y);

    // Create ray pattern
    float rays = 0.0;
    rays += sin(angle * 8.0 + uTime * 0.3) * 0.5 + 0.5;
    rays += sin(angle * 12.0 - uTime * 0.2) * 0.3 + 0.3;
    rays += sin(angle * 4.0 + uTime * 0.5) * 0.2 + 0.2;
    rays /= 3.0;

    // Fade from bottom
    float fade = smoothstep(1.2, 0.0, dist) * smoothstep(0.0, 0.3, vUv.y);
    float bottomGlow = smoothstep(0.3, 0.0, vUv.y) * 0.5;

    float alpha = (rays * fade + bottomGlow) * uIntensity * 0.35;

    // Golden color
    vec3 color = mix(
      vec3(0.553, 0.361, 0.176), // Bronze
      vec3(0.831, 0.686, 0.216), // Gold
      rays
    );

    gl_FragColor = vec4(color, alpha);
  }
`;

interface GodRaysProps {
  intensity?: number;
}

export default function GodRays({ intensity = 1 }: GodRaysProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uIntensity.value = intensity;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 2, -2]} scale={[12, 8, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={godRayVertexShader}
        fragmentShader={godRayFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
