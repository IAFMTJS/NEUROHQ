"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PenguinScene } from "./PenguinScene";
import type { UIState } from "@/lib/ui-state";

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  uiState?: UIState;
};

export function Brain3DCanvas({ energyPct, focusPct, loadPct, uiState = "idle" }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 2.4,
      }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={1.8} />
      <hemisphereLight args={["#00E5FF", "#1a2a40", 1.1]} />
      <pointLight position={[2, 2, 2]} color="#00E5FF" intensity={0.8} />
      <pointLight position={[-1, 1, 1]} color="#00FFC6" intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={2} color="#e6f1ff" />
      <directionalLight position={[-2, 4, 2]} intensity={1.2} color="#e6f1ff" />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={4}
      />
      <PenguinScene
        energyPct={energyPct}
        focusPct={focusPct}
        loadPct={loadPct}
        uiState={uiState}
      />
    </Canvas>
  );
}
