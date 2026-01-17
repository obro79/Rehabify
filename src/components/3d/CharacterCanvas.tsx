"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PresentationControls } from "@react-three/drei";
import { CharacterModel } from "./CharacterModel";
import { CharacterPose } from "@/types/character";

interface CharacterCanvasProps {
  pose: CharacterPose;
  interactive?: boolean;
  autoRotate?: boolean;
}

// Loading placeholder while model loads
function LoadingPlaceholder() {
  return (
    <mesh>
      <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
      <meshStandardMaterial color="#9CAF88" opacity={0.5} transparent />
    </mesh>
  );
}

export function CharacterCanvas({
  pose,
  interactive = false,
  autoRotate = false,
}: CharacterCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ background: "transparent" }}
    >
      {/* Soft ambient lighting */}
      <ambientLight intensity={0.5} />

      {/* Main directional light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
      />

      {/* Fill light from the other side */}
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.3}
      />

      <Suspense fallback={<LoadingPlaceholder />}>
        {interactive ? (
          <>
            <CharacterModel pose={pose} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={autoRotate}
              autoRotateSpeed={1}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
            />
          </>
        ) : (
          <PresentationControls
            global
            rotation={[0, -Math.PI / 8, 0]}
            polar={[-Math.PI / 8, Math.PI / 8]}
            azimuth={[-Math.PI / 8, Math.PI / 8]}
          >
            <CharacterModel pose={pose} />
          </PresentationControls>
        )}
      </Suspense>
    </Canvas>
  );
}
