'use client';

import { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import DustParticles from './DustParticles';
import GodRays from './GodRays';

// ──────────────────────────────────────────
// Camera Controller — orchestrates the cinematic camera
// ──────────────────────────────────────────
function CameraController({
  onSequenceComplete,
  isFormVisible,
}: {
  onSequenceComplete: () => void;
  isFormVisible: boolean;
}) {
  const { camera } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasCompleted = useRef(false);

  useEffect(() => {
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);

    const tl = gsap.timeline({
      onComplete: () => {
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onSequenceComplete();
        }
      },
    });

    // Sequence 0: Slow dolly forward (0-3s)
    tl.to(camera.position, {
      z: 8,
      duration: 3,
      ease: 'power1.inOut',
    });

    // Sequence 1: Slight upward pan during elephant arrival (3-8s)
    tl.to(camera.position, {
      z: 6,
      y: 0.3,
      duration: 5,
      ease: 'power2.inOut',
    });

    // Sequence 2-3: Push in closer (8-17s)
    tl.to(camera.position, {
      z: 5,
      y: 0.5,
      duration: 9,
      ease: 'power1.inOut',
    });

    // Sequence 4: Sacred pause zoom (17-20s)
    tl.to(camera.position, {
      z: 4.5,
      duration: 3,
      ease: 'power2.inOut',
    });

    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [camera, onSequenceComplete]);

  // Subtle depth of field when form is visible
  useEffect(() => {
    if (isFormVisible) {
      gsap.to(camera.position, {
        z: 5.5,
        duration: 2,
        ease: 'power2.inOut',
      });
    }
  }, [isFormVisible, camera]);

  // Subtle camera breathing
  useFrame(({ clock }) => {
    if (!isFormVisible) {
      camera.position.x = Math.sin(clock.elapsedTime * 0.3) * 0.05;
      camera.position.y += Math.sin(clock.elapsedTime * 0.5) * 0.001;
    }
  });

  return null;
}

// ──────────────────────────────────────────
// Ambient Lighting — warm golden atmosphere
// ──────────────────────────────────────────
function TempleAmbience({
  intensity,
}: {
  intensity: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = intensity * (0.8 + Math.sin(clock.elapsedTime * 2) * 0.2);
    }
    if (spotRef.current) {
      spotRef.current.intensity = intensity * 1.5 * (0.9 + Math.sin(clock.elapsedTime * 1.5) * 0.1);
    }
  });

  return (
    <>
      <ambientLight intensity={intensity * 0.15} color="#E89C3D" />
      <pointLight
        ref={lightRef}
        position={[0, -2, 3]}
        color="#D4AF37"
        intensity={intensity * 0.8}
        distance={15}
        decay={2}
      />
      <spotLight
        ref={spotRef}
        position={[0, 5, 5]}
        color="#E89C3D"
        intensity={intensity * 1.2}
        angle={0.6}
        penumbra={0.8}
        distance={20}
        castShadow={false}
      />
      {/* Rim lights for elephants */}
      <pointLight position={[-5, 1, 2]} color="#8D5C2D" intensity={intensity * 0.3} distance={10} />
      <pointLight position={[5, 1, 2]} color="#8D5C2D" intensity={intensity * 0.3} distance={10} />
    </>
  );
}

// ──────────────────────────────────────────
// Main Scene Component
// ──────────────────────────────────────────
export default function CinematicScene({
  onSequenceComplete,
  isFormVisible,
  reducedMotion,
}: {
  onSequenceComplete: () => void;
  isFormVisible: boolean;
  reducedMotion: boolean;
}) {
  const [lightIntensity, setLightIntensity] = useState(0.1);

  useEffect(() => {
    if (reducedMotion) {
      setLightIntensity(1);
      return;
    }

    // Ramp up light intensity over the cinematic sequence
    gsap.to(
      { val: 0.1 },
      {
        val: 1,
        duration: 8,
        ease: 'power2.inOut',
        onUpdate: function () {
          setLightIntensity(this.targets()[0].val);
        },
      }
    );
  }, [reducedMotion]);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        style={{ background: '#120D08' }}
      >
        <fog attach="fog" args={['#120D08', 8, 25]} />

        <Suspense fallback={null}>
          <CameraController
            onSequenceComplete={onSequenceComplete}
            isFormVisible={isFormVisible}
          />
          <TempleAmbience intensity={lightIntensity} />
          <DustParticles count={reducedMotion ? 100 : 400} />
          <GodRays intensity={lightIntensity} />
        </Suspense>
      </Canvas>
    </div>
  );
}
