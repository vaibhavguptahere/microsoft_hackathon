"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const CLUSTERS = [
  { label: "HR", color: new THREE.Color("#8b5cf6"), center: new THREE.Vector3(-3.4, 0.4, 0) },
  { label: "IT", color: new THREE.Color("#38bdf8"), center: new THREE.Vector3(3.2, -0.3, -1.2) },
  { label: "Finance", color: new THREE.Color("#22d3ee"), center: new THREE.Vector3(0.2, 1.4, 2.4) },
];

function Cluster({ center, color, count = 900 }: { center: THREE.Vector3; color: THREE.Color; count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * 2.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = center.x + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = center.y + r * Math.cos(phi) * 0.55;
      pos[i * 3 + 2] = center.z + r * Math.sin(phi) * Math.sin(theta);
      const c = color.clone().lerp(new THREE.Color("#ffffff"), Math.random() * 0.55);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [center, color, count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

export default function GalaxyScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.5, 10], fov: 48 }}>
      <color attach="background" args={["#070b16"]} />
      <fog attach="fog" args={["#070b16", 10, 26]} />
      {CLUSTERS.map((c) => (
        <Cluster key={c.label} center={c.center} color={c.color} />
      ))}
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={6}
        maxDistance={16}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.7}
      />
      <EffectComposer>
        <Bloom intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
