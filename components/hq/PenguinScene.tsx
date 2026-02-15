"use client";

import { Suspense, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";
import { getPenguinModel, MODEL_PATHS } from "@/lib/model-mapping";
import type { UIState } from "@/lib/ui-state";

function preloadModels() {
  Object.values(MODEL_PATHS).forEach((path) => useGLTF.preload(path));
}

type PenguinModelProps = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  uiState: UIState;
};

function PenguinModel({ energyPct, focusPct, loadPct, uiState }: PenguinModelProps) {
  const mood = getPenguinModel(energyPct, focusPct, loadPct);
  const path = MODEL_PATHS[mood];
  const { scene } = useGLTF(path);
  const groupRef = useRef<Group>(null);
  const stateTimeRef = useRef(0);
  const prevStateRef = useRef<UIState>(uiState);

  const clonedScene = scene.clone(true);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (prevStateRef.current !== uiState) {
      prevStateRef.current = uiState;
      stateTimeRef.current = 0;
    }
    stateTimeRef.current += delta;

    const t = stateTimeRef.current;
    const idleSway = Math.sin(t * 0.8) * 0.03;
    const idleBob = Math.sin(t * 0.5) * 0.02;

    if (uiState === "reward") {
      const bounce = t < 0.4 ? Math.sin((t / 0.4) * Math.PI) * 0.15 : 0;
      group.position.y = 0.15 + bounce;
      group.rotation.z = 0;
      group.rotation.y = Math.PI / 6;
    } else if (uiState === "error") {
      const shake = t < 0.3 ? (Math.sin(t * 40) * 0.03) : 0;
      group.rotation.z = shake;
      group.position.y = 0.15;
      group.rotation.y = Math.PI / 6;
    } else if (uiState === "focus") {
      group.rotation.y = Math.PI / 6 + 0.08;
      group.position.y = 0.15 + 0.02;
      group.rotation.z = 0;
    } else {
      group.rotation.y = Math.PI / 6 + idleSway;
      group.position.y = 0.15 + idleBob;
      group.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} rotation={[0, Math.PI / 6, 0]}>
      <primitive object={clonedScene} scale={0.95} position={[0, 0, 0]} />
    </group>
  );
}

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  uiState?: UIState;
};

export function PenguinScene({ energyPct, focusPct, loadPct, uiState = "idle" }: Props) {
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
        uiState={uiState}
      />
    </Suspense>
  );
}
