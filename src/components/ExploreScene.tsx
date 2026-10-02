import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROUTE, streetLevel } from '../three/route';
import type { HotspotDef, HotspotKind } from '../data/exploration';

const KIND_COLORS: Record<HotspotKind, number> = {
  investigate: 0xc5a875, // warm gold
  pickup: 0x7fa88f,      // jade
  puzzle: 0xa93d32,      // cinnabar
};

interface ExploreSceneProps {
  stationId: string;
  stationIndex: number;
  title: string;
  hotspots: HotspotDef[];
  /** hotspot ids already consumed (picked up / one-shot used) */
  consumed: Set<string>;
  /** puzzle ids already solved — their puzzle hotspots render dimmed */
  solvedPuzzles: Set<string>;
  onHotspot: (hotspot: HotspotDef) => void;
  onClose: () => void;
}

export default function ExploreScene({ stationIndex, title, hotspots, consumed, solvedPuzzles, onHotspot, onClose }: ExploreSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onHotspot);
  const closeCallback = useRef(onClose);
  const hotspotButtons = useRef<Array<HTMLButtonElement | null>>([]);
  callback.current = onHotspot;
  closeCallback.current = onClose;
  // Keep latest hotspot/consumed state for the 3D loop without re-creating the scene.
  const live = useRef({ hotspots, consumed, solvedPuzzles });
  live.current = { hotspots, consumed, solvedPuzzles };

  const stationPoint = useMemo(() => {
    const [x, z] = ROUTE[Math.max(0, Math.min(ROUTE.length - 1, stationIndex))];
    return { x, z, y: streetLevel(x, z) };
  }, [stationIndex]);

  const focusHotspot = (index: number) => {
    const buttons = hotspotButtons.current;
    if (!buttons.length) return;
    buttons[(index + buttons.length) % buttons.length]?.focus();
  };

  const onHotspotKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); focusHotspot(index + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); focusHotspot(index - 1); }
    else if (event.key === 'Escape') { event.preventDefault(); closeCallback.current(); }
  };

  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101516');
    scene.fog = new THREE.FogExp2('#101516', 0.055);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const { x: sx, z: sz, y: sy } = stationPoint;
    // Camera pulls in close to the station: the scene itself is the gameplay.
    camera.position.set(sx + 4.2, sy + 3.4, sz + 5.2);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    } catch {
      element.classList.add('model-unavailable');
      return () => { element.classList.remove('model-unavailable'); };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#bbc5c0', '#141718', 1.5));
    const moon = new THREE.DirectionalLight('#acb9b7', 1.9);
    moon.position.set(sx - 6, 10, sz + 4);
    scene.add(moon);
    // Warm lantern glow at the station so hotspots read in the dark.
    const lampLight = new THREE.PointLight('#c98a3e', 14, 12, 2);
    lampLight.position.set(sx, sy + 2.2, sz);
    scene.add(lampLight);

    // Ground disc around the station.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(14, 40),
      new THREE.MeshStandardMaterial({ color: '#262b2b', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(sx, sy - 0.12, sz);
    ground.receiveShadow = true;
    scene.add(ground);

    // A few dim house silhouettes for old-street depth (kept simple; the
    // hotspots are the focus, not architecture).
    const houseMat = new THREE.MeshStandardMaterial({ color: '#3a3f3d', roughness: 0.95 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#22282a', roughness: 0.9 });
    const rng = (seed: number) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    };
    const rand = rng(stationIndex * 977 + 13);
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 + rand() * 0.5;
      const dist = 7.5 + rand() * 4;
      const hx = sx + Math.cos(angle) * dist;
      const hz = sz + Math.sin(angle) * dist;
      const w = 2.2 + rand() * 1.4;
      const h = 2 + rand() * 1.6;
      const d = 2.4 + rand() * 1.2;
      const house = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMat);
      house.position.set(hx, sy + h / 2 - 0.1, hz);
      house.rotation.y = angle + Math.PI / 2;
      scene.add(house);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.24, d + 0.3), roofMat);
      roof.position.set(hx, sy + h + 0.02, hz);
      roof.rotation.y = house.rotation.y;
      scene.add(roof);
      // A couple of lit windows for night-street life.
      if (rand() > 0.55) {
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.5, 0.06),
          new THREE.MeshStandardMaterial({ color: '#bd8a4c', emissive: '#a86227', emissiveIntensity: 0.55, roughness: 0.4 }),
        );
        win.position.set(hx, sy + h * 0.55, hz);
        win.rotation.y = house.rotation.y;
        win.translateZ(d / 2 + 0.04);
        scene.add(win);
      }
    }

    // Station lantern post — the visual anchor of "this is where you are".
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 8), new THREE.MeshStandardMaterial({ color: '#2c2620', roughness: 0.9 }));
    post.position.set(sx - 1.1, sy + 1.2, sz - 0.8);
    scene.add(post);
    const lampBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.44, 0.34),
      new THREE.MeshStandardMaterial({ color: '#8e211e', emissive: '#c25a2a', emissiveIntensity: 0.85, roughness: 0.5 }),
    );
    lampBox.position.set(sx - 1.1, sy + 2.55, sz - 0.8);
    scene.add(lampBox);

    // Hotspot markers.
    type Marker = { mesh: THREE.Mesh; ring: THREE.Mesh; def: HotspotDef };
    const markers: Marker[] = [];
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    const buildMarkers = () => {
      while (markerGroup.children.length) {
        const child = markerGroup.children.pop()!;
        markerGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const material = child.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      }
      markers.length = 0;
      for (const def of live.current.hotspots) {
        const isConsumed = live.current.consumed.has(def.id);
        const isSolved = def.puzzleId != null && live.current.solvedPuzzles.has(def.puzzleId);
        const dimmed = isConsumed || isSolved;
        const color = KIND_COLORS[def.kind];
        const [ox, oy, oz] = def.offset;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 16, 12),
          new THREE.MeshStandardMaterial({
            color, emissive: color, emissiveIntensity: dimmed ? 0.12 : 0.75,
            roughness: 0.3, transparent: true, opacity: dimmed ? 0.45 : 1,
          }),
        );
        mesh.position.set(sx + ox, sy + oy, sz + oz);
        mesh.userData.hotspotId = def.id;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.2, 0.02, 8, 28),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: dimmed ? 0.25 : 0.7 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(mesh.position);
        ring.position.y -= 0.16;
        markerGroup.add(mesh);
        markerGroup.add(ring);
        markers.push({ mesh, ring, def });
      }
    };
    buildMarkers();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(sx, sy + 0.7, sz);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 12;
    controls.maxPolarAngle = 1.5;
    controls.minPolarAngle = 0.25;
    controls.enablePan = false; // keep the player at this station; no wandering off
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: Marker | null = null;

    const pick = (clientX: number, clientY: number): Marker | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = markers.map((m) => m.mesh);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (!hit) return null;
      return markers.find((m) => m.mesh === hit.object) ?? null;
    };

    const setHovered = (marker: Marker | null) => {
      if (hovered === marker) return;
      if (hovered) {
        const mat = hovered.mesh.material as THREE.MeshStandardMaterial;
        const dimmed = live.current.consumed.has(hovered.def.id);
        mat.emissiveIntensity = dimmed ? 0.12 : 0.75;
        renderer.domElement.style.cursor = '';
      }
      hovered = marker;
      if (hovered) {
        (hovered.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;
        renderer.domElement.style.cursor = 'pointer';
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      // Distinguish tap from orbit-drag: only treat as a tap if the pointer
      // barely moved between down and up.
      const startX = event.clientX;
      const startY = event.clientY;
      const onUp = (up: PointerEvent) => {
        renderer.domElement.removeEventListener('pointerup', onUp);
        if (Math.hypot(up.clientX - startX, up.clientY - startY) > 9) return;
        const marker = pick(up.clientX, up.clientY);
        if (marker) callback.current(marker.def);
      };
      renderer.domElement.addEventListener('pointerup', onUp);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onPointerMove = (event: PointerEvent) => {
      if (coarsePointer) return; // no hover on touch
      setHovered(pick(event.clientX, event.clientY));
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const resize = new ResizeObserver(() => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
    resize.observe(element);

    let frame = 0;
    let lastFrame = 0;
    let animation = 0;
    let lastConsumedSize = -1;
    let lastSolvedSize = -1;
    const buttons = () => Array.from(element.querySelectorAll<HTMLButtonElement>('.explore-hotspot-button'));
    const projected = new THREE.Vector3();
    const render = (time: number) => {
      animation = requestAnimationFrame(render);
      if (time - lastFrame < 33) return;
      lastFrame = time;
      controls.update();
      if (!reduceMotion) frame += 0.016;
      // Rebuild markers when consumed/solved sets change (React state lives outside).
      if (live.current.consumed.size !== lastConsumedSize || live.current.solvedPuzzles.size !== lastSolvedSize) {
        lastConsumedSize = live.current.consumed.size;
        lastSolvedSize = live.current.solvedPuzzles.size;
        buildMarkers();
        if (hovered && !markers.includes(hovered)) setHovered(null);
      }
      const width = element.clientWidth;
      const height = element.clientHeight;
      markers.forEach((marker) => {
        const isActive = hovered === marker;
        const dimmed = live.current.consumed.has(marker.def.id)
          || (marker.def.puzzleId != null && live.current.solvedPuzzles.has(marker.def.puzzleId));
        if (!reduceMotion && !dimmed) {
          marker.mesh.position.y += Math.sin(frame * 2 + marker.mesh.position.x * 3) * 0.0016;
          const s = 1 + (isActive ? 0.35 : Math.sin(frame * 2.4) * 0.08);
          marker.mesh.scale.setScalar(s);
        } else {
          marker.mesh.scale.setScalar(isActive ? 1.35 : 1);
        }
        if (!reduceMotion && !dimmed) {
          (marker.ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(frame * 2.4) * 0.18;
        }
      });
      // Keep the keyboard/screen-reader buttons aligned with their 3D markers.
      // Positions are rounded and only written when they move ≥1px, so the
      // buttons stay stable enough to click (and don't jitter for users).
      const btns = buttons();
      markers.forEach((marker, index) => {
        const button = btns[index];
        if (!button || !width || !height) return;
        projected.copy(marker.mesh.position).project(camera);
        if (projected.z > 1) {
          if (button.style.display !== 'none') button.style.display = 'none';
        } else {
          const left = Math.round((projected.x * 0.5 + 0.5) * width);
          const top = Math.round((-projected.y * 0.5 + 0.5) * height);
          if (button.style.display === 'none') button.style.display = '';
          if (button.dataset.px !== `${left},${top}`) {
            button.dataset.px = `${left},${top}`;
            button.style.left = `${left}px`;
            button.style.top = `${top}px`;
          }
        }
      });
      renderer.render(scene, camera);
    };
    render(34);

    return () => {
      cancelAnimationFrame(animation);
      resize.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      controls.dispose();
      renderer.dispose();
      // Force-release the WebGL context: dispose() alone leaves the context
      // alive until GC, and repeated open/close hits the browser's context limit.
      const gl = renderer.getContext() as WebGLRenderingContext | null;
      const loseExt = gl?.getExtension('WEBGL_lose_context') as { loseContext(): void } | null;
      loseExt?.loseContext();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, [stationIndex, stationPoint]);

  return (
    <div className="explore-scene" ref={host} role="group" aria-label={`${title}的可探索三维现场`}>
      {hotspots.map((hotspot, index) => {
        const dimmed = consumed.has(hotspot.id)
          || (hotspot.puzzleId != null && solvedPuzzles.has(hotspot.puzzleId));
        return (
          <button
            key={hotspot.id}
            type="button"
            ref={(element) => { hotspotButtons.current[index] = element; }}
            className={`explore-hotspot-button kind-${hotspot.kind}${dimmed ? ' is-dimmed' : ''}`}
            aria-label={`${hotspot.kind === 'pickup' ? '拾取' : hotspot.kind === 'puzzle' ? '解谜' : '调查'}：${hotspot.label}${dimmed ? '（已处理）' : ''}`}
            title={hotspot.label}
            onClick={() => callback.current(hotspot)}
            onKeyDown={(event) => onHotspotKeyDown(event, index)}
          >
            <span aria-hidden="true" className="hotspot-dot" />
            <span className="hotspot-tag">{hotspot.label}</span>
          </button>
        );
      })}
      <span className="explore-hint" aria-hidden="true">拖动环视 · 点击发光处调查</span>
    </div>
  );
}
