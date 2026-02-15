"use client";

import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { getPenguinModel, MODEL_PATHS } from "@/lib/model-mapping";

function preloadModels() {
  Object.values(MODEL_PATHS).forEach((path) => useGLTF.preload(path));
}

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
};

function PenguinModel({ energyPct, focusPct, loadPct }: Props) {
  const mood = getPenguinModel(energyPct, focusPct, loadPct);
  const path = MODEL_PATHS[mood];
  const { scene } = useGLTF(path);

  // Clone to avoid mutation of shared scene
  const clonedScene = scene.clone(true);

  return (
    <group position={[0, 0.15, 0]} rotation={[0, Math.PI / 6, 0]}>
      <primitive object={clonedScene} scale={0.95} position={[0, 0, 0]} />
    </group>
  );
}

export function PenguinScene({ energyPct, focusPct, loadPct }: Props) {
  useEffect(() => {
    preloadModels();
  }, []);

  return (
    <Suspense
      fallback={
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#888" wireframe />
        </mesh>
      }
    >
      <PenguinModel
        energyPct={energyPct}
        focusPct={focusPct}
        loadPct={loadPct}
      />
    </Suspense>
  );
}
