"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars, Line, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const DOMAINS = [
  { label: "HR", color: "#8b5cf6", angle: 0 },
  { label: "IT", color: "#38bdf8", angle: (Math.PI * 2) / 3 },
  { label: "Finance", color: "#22d3ee", angle: (Math.PI * 4) / 3 },
];

const NODE_TARGETS: Record<string, string> = {
  HR: "knowledge",
  IT: "architecture",
  Finance: "trust",
};

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // cinematic power-up: core boots from dark to full energy over ~2.4s
    const boot = 1 - Math.pow(1 - Math.min(1, t / 2.4), 3);
    if (ref.current) {
      ref.current.rotation.y = t * 0.12;
      const s = (1 + Math.sin(t * 0.9) * 0.025) * (0.08 + 0.92 * boot);
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55 * boot;
    }
    if (light.current) light.current.intensity = 14 * boot;
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.85, 12]} />
        <MeshDistortMaterial
          color="#1d3a9e"
          emissive="#3b6bff"
          emissiveIntensity={0.55}
          roughness={0.18}
          metalness={0.6}
          distort={0.32}
          speed={1.1}
        />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial color="#4c7dff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <pointLight ref={light} color="#5b8cff" intensity={0} distance={14} />
      <CorePulse />
      <CorePulse offset={2.1} />
    </group>
  );
}

/** Energy shockwave that expands outward from the core every few seconds. */
function CorePulse({ offset = 0 }: { offset?: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + offset;
    if (!ring.current) return;
    const k = (t % 4.2) / 4.2;
    ring.current.scale.setScalar(1.1 + k * 6);
    (ring.current.material as THREE.MeshBasicMaterial).opacity =
      0.26 * (1 - k) * Math.min(1, t / 3.5);
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.4, 0.3, 0]}>
      <torusGeometry args={[1, 0.014, 8, 64]} />
      <meshBasicMaterial color="#5b8cff" transparent opacity={0} toneMapped={false} />
    </mesh>
  );
}

function Shell() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (a.current) { a.current.rotation.x = t * 0.15; a.current.rotation.y = -t * 0.2; }
    if (b.current) { b.current.rotation.y = t * 0.1; b.current.rotation.z = t * 0.07; }
    if (r1.current) { r1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.3; r1.current.rotation.z = t * 0.5; }
    if (r2.current) { r2.current.rotation.y = t * 0.35; r2.current.rotation.x = 0.9; }
    if (r3.current) { r3.current.rotation.x = -t * 0.28; r3.current.rotation.y = 0.6; }
  });
  return (
    <group>
      <mesh ref={a}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#7aa2ff" wireframe transparent opacity={0.22} />
      </mesh>
      <mesh ref={b}>
        <dodecahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial color="#a78bfa" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh ref={r1}>
        <torusGeometry args={[1.7, 0.012, 8, 64]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[2.05, 0.008, 8, 64]} />
        <meshBasicMaterial color="#8b5cf6" toneMapped={false} />
      </mesh>
      <mesh ref={r3}>
        <torusGeometry args={[2.4, 0.006, 8, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}

function OrbitRing({ radius, tilt }: { radius: number; tilt: number }) {
  const points = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      p.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return p;
  }, [radius]);
  return (
    <group rotation={[tilt, 0, tilt * 0.6]}>
      <Line points={points} color="#5b8cff" transparent opacity={0.16} lineWidth={1} />
    </group>
  );
}

function DomainNode({
  label,
  color,
  angle,
  radius,
  onSelect,
}: {
  label: string;
  color: string;
  angle: number;
  radius: number;
  onSelect?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.16 + angle;
    if (group.current) {
      group.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.4) * 0.5, Math.sin(t) * radius);
    }
  });

  const linkPoints = useMemo<[number, number, number][]>(() => [[0, 0, 0], [0, 0, 0]], []);
  const lineRef = useRef<any>(null);
  useFrame(({ clock }) => {
    if (group.current && lineRef.current) {
      const p = group.current.position;
      lineRef.current.geometry.setPositions([0, 0, 0, p.x, p.y, p.z]);
      const t = clock.getElapsedTime();
      // alive: data links breathe and flicker instead of sitting at a flat opacity
      const flicker =
        0.3 + 0.13 * Math.sin(t * 3 + angle * 7) * Math.sin(t * 1.7 + angle * 3);
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = hovered ? 0.85 : flicker;
    }
  });

  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const p = group.current.position;
    const t = clock.getElapsedTime();
    pulses.current.forEach((m, i) => {
      if (!m) return;
      const k = ((t * 0.45 + i / 3 + angle) % 1);
      m.position.set(p.x * k, p.y * k, p.z * k);
      m.scale.setScalar(0.6 + Math.sin(k * Math.PI) * 0.8);
    });
  });

  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { pulses.current[i] = el; }}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      <Line
        ref={lineRef}
        points={linkPoints}
        color={color}
        transparent
        opacity={hovered ? 0.85 : 0.35}
        lineWidth={hovered ? 2 : 1}
      />
      <group ref={group}>
        <Float speed={1.4} floatIntensity={0.5} rotationIntensity={0.3}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = "auto";
            }}
            scale={hovered ? 1.25 : 1}
          >
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 2.6 : 1.4}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
          <Text position={[0, -0.4, 0]} fontSize={0.15} color="rgba(255,255,255,0.7)" letterSpacing={0.2}>{label.toUpperCase()}</Text>
        </Float>
      </group>
    </>
  );
}

function DataParticles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#9ec5ff" transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() * 0.08;
    const radius = 7.2;
    const desiredX = Math.sin(t) * radius + pointer.x * 0.8;
    const desiredZ = Math.cos(t) * radius;
    const desiredY = 1.2 + pointer.y * -0.6;
    camera.position.x += (desiredX - camera.position.x) * Math.min(1, delta * 1.4);
    camera.position.y += (desiredY - camera.position.y) * Math.min(1, delta * 1.4);
    camera.position.z += (desiredZ - camera.position.z) * Math.min(1, delta * 1.4);
    camera.lookAt(target);
  });
  return null;
}

export default function CoreScene() {
  return (
    <Canvas style={{ touchAction: "auto" }}
      dpr={[1, 1.2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 5.5, 27], fov: 46 }}
    >
      <color attach="background" args={["#080c18"]} />
      <fog attach="fog" args={["#080c18", 9, 20]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#9db8ff" />
      <Stars radius={60} depth={40} count={800} factor={3} saturation={0} fade speed={0.4} />
      <Core />
      <Shell />
      <OrbitRing radius={3.2} tilt={0.35} />
      <OrbitRing radius={4.4} tilt={-0.22} />
      {DOMAINS.map((d) => (
        <DomainNode
          key={d.label}
          {...d}
          radius={3.4}
          onSelect={() =>
            document
              .getElementById(NODE_TARGETS[d.label] ?? "knowledge")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      ))}
      <DataParticles />
      <Rig />
      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.45} luminanceSmoothing={0.35} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
