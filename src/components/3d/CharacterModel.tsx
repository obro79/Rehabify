"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { CharacterPose } from "@/types/character";
import * as THREE from "three";

interface CharacterModelProps {
  pose: CharacterPose;
}

// Color palette matching the UI design system
const MASCOT_COLORS = {
  // Shirt - main sage green from brand
  shirt: new THREE.Color("#7A8E72"),       // sage-500
  // Skin - warm peachy tone
  skin: new THREE.Color("#E8C4A8"),        // warm skin tone
  // Hair - brown
  hair: new THREE.Color("#5C4033"),        // warm brown
  // Pants - darker neutral
  pants: new THREE.Color("#4A5B45"),       // sage-800
  // Shoes - dark
  shoes: new THREE.Color("#3D4A3A"),       // sage-900
  // Eyes/details
  eyes: new THREE.Color("#3D4A3A"),        // dark
};

// Helper to determine body part from mesh name or bounding box
function getBodyPartColor(mesh: THREE.Mesh): THREE.Color {
  const name = mesh.name.toLowerCase();

  // Try to match by mesh name first
  if (name.includes("hair") || name.includes("head_hair")) {
    return MASCOT_COLORS.hair;
  }
  if (name.includes("shirt") || name.includes("torso") || name.includes("body") || name.includes("chest")) {
    return MASCOT_COLORS.shirt;
  }
  if (name.includes("pant") || name.includes("leg") || name.includes("trouser")) {
    return MASCOT_COLORS.pants;
  }
  if (name.includes("shoe") || name.includes("foot") || name.includes("feet")) {
    return MASCOT_COLORS.shoes;
  }
  if (name.includes("skin") || name.includes("face") || name.includes("hand") || name.includes("arm") || name.includes("head")) {
    return MASCOT_COLORS.skin;
  }
  if (name.includes("eye")) {
    return MASCOT_COLORS.eyes;
  }

  // Fallback: use bounding box to guess body part by vertical position
  mesh.geometry.computeBoundingBox();
  const bbox = mesh.geometry.boundingBox;
  if (bbox) {
    const centerY = (bbox.min.y + bbox.max.y) / 2;
    const height = bbox.max.y - bbox.min.y;

    // High up = head/hair area
    if (centerY > 1.5) {
      return height < 0.3 ? MASCOT_COLORS.hair : MASCOT_COLORS.skin;
    }
    // Mid-upper = torso/shirt
    if (centerY > 0.5) {
      return MASCOT_COLORS.shirt;
    }
    // Lower = pants/legs
    if (centerY > -0.5) {
      return MASCOT_COLORS.pants;
    }
    // Bottom = shoes
    return MASCOT_COLORS.shoes;
  }

  // Default to shirt color
  return MASCOT_COLORS.shirt;
}

// Pose-specific configurations
const POSE_CONFIG: Record<CharacterPose, {
  rotationY: number;
  rotationX: number;
  scale: number;
  bounceSpeed: number;
}> = {
  idle: { rotationY: 0, rotationX: 0, scale: 1, bounceSpeed: 1.5 },
  presenting: { rotationY: 0.4, rotationX: 0.1, scale: 1, bounceSpeed: 1.2 },
  thumbsUp: { rotationY: -0.3, rotationX: 0.05, scale: 1.05, bounceSpeed: 2 },
  thinking: { rotationY: -0.2, rotationX: -0.1, scale: 0.95, bounceSpeed: 0.8 },
  pointing: { rotationY: 0.5, rotationX: 0.1, scale: 1, bounceSpeed: 1 },
  celebrating: { rotationY: 0, rotationX: -0.1, scale: 1.1, bounceSpeed: 3 },
};

export function CharacterModel({ pose }: CharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/mascot.glb");
  const config = POSE_CONFIG[pose];

  // Clone and colorize the scene with body-part-specific colors
  const colorizedScene = useMemo(() => {
    const cloned = scene.clone();

    // Traverse and update materials based on body part
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Clone the material so we don't affect the original
        const material = (child.material as THREE.MeshStandardMaterial).clone();

        // Get appropriate color for this body part
        const color = getBodyPartColor(child);
        material.color = color;
        material.roughness = 0.5;
        material.metalness = 0.05;

        child.material = material;
      }
    });

    return cloned;
  }, [scene]);

  // Cleanup: dispose cloned materials and geometries on unmount
  useEffect(() => {
    return () => {
      colorizedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    };
  }, [colorizedScene]);

  // Subtle idle animation - gentle floating and pose-based rotation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;

      // Floating animation
      groupRef.current.position.y = Math.sin(time * config.bounceSpeed) * 0.05 - 1;

      // Pose rotation with subtle sway
      groupRef.current.rotation.y = config.rotationY + Math.sin(time * 0.5) * 0.05;
      groupRef.current.rotation.x = config.rotationX;

      // Scale for celebrating pose - only lerp if not converged
      const targetScale = config.scale;
      const currentScale = groupRef.current.scale.x;
      const scaleDiff = Math.abs(currentScale - targetScale);
      if (scaleDiff > 0.001) {
        groupRef.current.scale.setScalar(
          THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
        );
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <primitive
        object={colorizedScene}
        scale={1.5}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/mascot.glb");
