"use client";

import Link from "next/link";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type MissionButtonProps = {
  href?: string;
  children: React.ReactNode;
  /** "pill" = neon pill (default on dashboard); "default" = minimal styling */
  variant?: "default" | "pill" | "ultra";
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

function ShaderCanvas({
  ultra,
  hoverUniformRef,
}: {
  ultra: boolean;
  hoverUniformRef: React.MutableRefObject<{ value: number } | null>;
}) {
  const mountRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = ultra ? 1.0 : 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      ultra ? 1.25 : 1.05,
      ultra ? 0.24 : 0.2,
      ultra ? 0.66 : 0.72,
    );
    composer.addPass(bloom);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uHover: { value: 0 },
    };
    hoverUniformRef.current = uniforms.uHover;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uHover;

        float roundedRectSDF(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= uResolution.x / max(uResolution.y, 1.0);

          float d = roundedRectSDF(p, vec2(0.80, 0.25), 0.24);
          float outerMask = smoothstep(0.012, -0.012, d);
          float coreMask = smoothstep(-0.028, -0.062, d);

          // Dark shell to enforce glow hierarchy.
          vec3 shell = mix(vec3(0.03, 0.06, 0.22), vec3(0.09, 0.18, 0.55), uv.x);

          // Border gets moderate light only.
          float border = smoothstep(0.018, 0.0, abs(d + 0.03));
          vec3 borderColor = mix(vec3(0.95, 0.26, 0.86), vec3(0.24, 0.88, 1.0), uv.x);

          // Core is the brightest emissive element.
          vec3 core = mix(vec3(1.0, 0.25, 0.92), vec3(0.10, 0.92, 1.0), uv.x);
          core += sin(uTime * 2.0 + p.x * 6.5) * 0.08;
          core += uHover * 0.30;
          core += step(0.995, hash(gl_FragCoord.xy + uTime * 35.0)) * 0.22;
          vec3 emissiveCore = core * (2.5 + uHover * 0.4);

          vec3 color = shell * outerMask;
          color = mix(color, emissiveCore, coreMask);
          color += borderColor * border * (0.85 + uHover * 0.65);

          // Sculpt light with gloss + vignette + edge darkening.
          color += vec3(0.12, 0.15, 0.2) * smoothstep(0.28, -0.02, p.y) * 0.35;
          color *= smoothstep(0.98, 0.35, length(p));
          color *= 0.94 - smoothstep(0.62, 1.08, length(p)) * 0.28;

          // Slight contrast lift after HDR composition.
          color = max(color - 0.015, vec3(0.0));
          color = pow(color, vec3(0.92));

          gl_FragColor = vec4(color, outerMask);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      composer.setSize(rect.width, rect.height);
      bloom.setSize(rect.width, rect.height);
      uniforms.uResolution.value.set(rect.width, rect.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const animate = (t: number) => {
      uniforms.uTime.value = t * 0.001;
      composer.render();
      rafRef.current = window.requestAnimationFrame(animate);
    };
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      hoverUniformRef.current = null;
      geometry.dispose();
      material.dispose();
      if (typeof composer.dispose === "function") composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [ultra, hoverUniformRef]);

  return <span className="mission-hdr-canvas" ref={mountRef} aria-hidden />;
}

export function MissionButton({
  href,
  children,
  variant = "pill",
  className = "",
  style,
  "aria-label": ariaLabel,
  ...rest
}: MissionButtonProps) {
  const usePill = variant === "pill" || variant === "ultra";
  const isUltra = variant === "ultra";
  const hoverUniformRef = useRef<{ value: number } | null>(null);

  const setHover = (hovered: boolean) => {
    if (hoverUniformRef.current) hoverUniformRef.current.value = hovered ? 1 : 0;
  };

  const innerClasses = [
    usePill
      ? ["mission-hdr-button", isUltra ? "mission-hdr-button-ultra" : ""].join(" ")
      : "w-full max-w-[324px] min-h-[84px] rounded-lg border border-[var(--hq-glass-border)] bg-[var(--hq-glass-bg)] text-[var(--text-primary)] font-semibold px-6 py-4 hover:bg-white/10 transition-colors",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = href ? (
    <Link
      href={href}
      className={innerClasses}
      style={style}
      aria-label={ariaLabel}
      onPointerEnter={usePill ? () => setHover(true) : undefined}
      onPointerLeave={usePill ? () => setHover(false) : undefined}
      {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {usePill && <ShaderCanvas ultra={isUltra} hoverUniformRef={hoverUniformRef} />}
      <span className={usePill ? "mission-hdr-label" : ""}>{children}</span>
    </Link>
  ) : (
    <button
      type="button"
      className={innerClasses}
      style={style}
      aria-label={ariaLabel}
      onPointerEnter={usePill ? () => setHover(true) : undefined}
      onPointerLeave={usePill ? () => setHover(false) : undefined}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {usePill && <ShaderCanvas ultra={isUltra} hoverUniformRef={hoverUniformRef} />}
      <span className={usePill ? "mission-hdr-label" : ""}>{children}</span>
    </button>
  );

  if (usePill) {
    return <div className="mission-hdr-wrap">{inner}</div>;
  }
  return inner;
}
