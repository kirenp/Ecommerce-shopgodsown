'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shader for soft golden dust particles
const dustVertexShader = `
  attribute float aSize;
  attribute float aOffset;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    vec3 pos = position;

    // Gentle floating motion
    pos.y += sin(uTime * 0.5 + aOffset * 6.28) * 0.3;
    pos.x += cos(uTime * 0.3 + aOffset * 3.14) * 0.15;
    pos.z += sin(uTime * 0.4 + aOffset * 4.0) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation
    gl_PointSize = aSize * (120.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Fade based on distance
    vAlpha = smoothstep(20.0, 5.0, -mvPosition.z) * (0.3 + 0.7 * sin(uTime * 0.8 + aOffset * 10.0) * 0.5 + 0.5);
  }
`;

const dustFragmentShader = `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    // Soft circle
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
    gl_FragColor = vec4(uColor, alpha * 0.35);
  }
`;

interface DustParticlesProps {
  count?: number;
}

export default function DustParticles({ count = 400 }: DustParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread particles across a wide area
      positions[i * 3] = (Math.random() - 0.5) * 20;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z

      sizes[i] = Math.random() * 1.5 + 0.5;
      offsets[i] = Math.random();
    }

    return { positions, sizes, offsets };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#D4AF37') },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aOffset"
          count={count}
          array={offsets}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
