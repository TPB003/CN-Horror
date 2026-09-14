import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const route = [
  [-6, 5], [-4.8, 3.4], [-3.5, 2], [-2, 0.9], [-0.5, 0], [1.1, -0.8],
  [2.1, -2.2], [1.2, -3.7], [2.9, -5], [4.7, -4.1], [5.5, -2.2], [4.2, -0.3],
] as const;

const palette = ['#8e211e', '#a93d32', '#6d7778', '#d2c7ae', '#9b8770'];

function streetLevel(x: number, z: number) {
  return Math.max(-0.02, (z + 8.5) * 0.047 + Math.sin(x * 0.83 + z * 0.61) * 0.045);
}

function addHouse(scene: THREE.Scene, x: number, z: number, w: number, d: number, h: number, index: number, baseY: number, facingRoad: number) {
  const house = new THREE.Group();
  house.position.set(x, baseY, z);
  house.rotation.y = facingRoad;
  scene.add(house);
  const stone = new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? '#59615f' : '#6c706b', roughness: 0.96 });
  const upper = new THREE.MeshStandardMaterial({ color: index % 2 ? '#85857e' : '#908a7e', roughness: 0.91 });
  const dark = new THREE.MeshStandardMaterial({ color: '#111617', roughness: 0.76 });
  const mortar = new THREE.MeshStandardMaterial({ color: '#92928a', roughness: 1 });
  const glass = new THREE.MeshStandardMaterial({ color: '#bd8a4c', emissive: '#a86227', emissiveIntensity: index % 5 === 0 ? 0.7 : 0.12, roughness: 0.38 });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.22, d + 0.12), new THREE.MeshStandardMaterial({ color: '#323838', roughness: 1 }));
  foundation.position.set(0, 0.02, 0);
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  house.add(foundation);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
  wall.position.set(0, h / 2 + 0.13, 0);
  wall.castShadow = true;
  wall.receiveShadow = true;
  house.add(wall);

  if (index % 4 === 0) {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-w / 2, 0);
    gableShape.lineTo(w / 2, 0);
    gableShape.lineTo(0, 0.48);
    gableShape.closePath();
    for (const front of [-1, 1]) {
      const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), upper);
      gable.position.set(0, h + 0.13, front * (d / 2 + 0.018));
      gable.castShadow = true;
      house.add(gable);
    }
    const roofPlane = new THREE.BufferGeometry();
    const ridgeY = h + 0.61;
    const eaveY = h + 0.19;
    const a = new THREE.Vector3(-w / 2 - 0.08, eaveY, -d / 2 - 0.08);
    const b = new THREE.Vector3(0, ridgeY, -d / 2 - 0.08);
    const c = new THREE.Vector3(0, ridgeY, d / 2 + 0.08);
    const d0 = new THREE.Vector3(-w / 2 - 0.08, eaveY, d / 2 + 0.08);
    const e = new THREE.Vector3(0, ridgeY, -d / 2 - 0.08);
    const f = new THREE.Vector3(w / 2 + 0.08, eaveY, -d / 2 - 0.08);
    const g = new THREE.Vector3(w / 2 + 0.08, eaveY, d / 2 + 0.08);
    const h0 = new THREE.Vector3(0, ridgeY, d / 2 + 0.08);
    roofPlane.setFromPoints([a, d0, c, a, c, b, e, h0, g, e, g, f]);
    roofPlane.computeVertexNormals();
    const roof = new THREE.Mesh(roofPlane, new THREE.MeshStandardMaterial({ color: '#262c2d', roughness: 0.86, side: THREE.DoubleSide }));
    roof.castShadow = true;
    house.add(roof);
  } else {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.18, d + 0.16), upper);
    roof.position.set(0, h + 0.23, 0);
    roof.rotation.z = (index % 3 - 1) * 0.025;
    roof.castShadow = true;
    house.add(roof);
  }

  const frontZ = d / 2 + 0.012;
  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, h * 0.58, 0.035), dark);
  door.position.set(-w * 0.22, h * 0.29 + 0.17, frontZ);
  house.add(door);
  const windowX = w * 0.2;
  const window = new THREE.Mesh(new THREE.BoxGeometry(w * 0.23, h * 0.22, 0.04), dark);
  window.position.set(windowX, h * 0.64 + 0.08, frontZ);
  house.add(window);
  const pane = new THREE.Mesh(new THREE.BoxGeometry(w * 0.13, h * 0.13, 0.018), glass);
  pane.position.set(windowX, h * 0.64 + 0.08, frontZ + 0.025);
  house.add(pane);
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.025, h * 0.22, 0.045), mortar);
  mullion.position.set(windowX, h * 0.64 + 0.08, frontZ + 0.04);
  house.add(mullion);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.28, 0.075, 0.09), upper);
  lintel.position.set(windowX, h * 0.79 + 0.08, frontZ + 0.022);
  house.add(lintel);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, 0.055, 0.08), upper);
  doorFrame.position.set(-w * 0.22, h * 0.58 + 0.15, frontZ + 0.035);
  house.add(doorFrame);

  if (index % 5 === 1) {
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, 0.07, 0.34), dark);
    balcony.position.set(w * 0.18, h * 0.93 + 0.08, frontZ + 0.13);
    house.add(balcony);
    for (let rail = -1; rail <= 1; rail += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.035), mortar);
      post.position.set(w * 0.18 + rail * w * 0.16, h * 1.02 + 0.08, frontZ + 0.27);
      house.add(post);
    }
  }

  const threshold = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, 0.08, 0.38), mortar);
  threshold.position.set(-w * 0.22, 0.13, frontZ + 0.15);
  house.add(threshold);

  if (index % 4 === 0) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 0.22, 0.07), new THREE.MeshStandardMaterial({ color: '#26211d' }));
    sign.position.set(0, h * 0.77 + 0.08, frontZ + 0.06);
    house.add(sign);
  }
}

export default function VillageCanvas({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onSelect);
  const activeId = useRef(selectedId);
  callback.current = onSelect;
  activeId.current = selectedId;

  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101516');
    scene.fog = new THREE.FogExp2('#101516', 0.038);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(12, 15, 16);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch {
      element.classList.add('model-unavailable');
      element.innerHTML = '<div class="model-fallback"><span>⌖</span><b>街区模型暂不可用</b><small>请使用下方路线清单进入各站</small></div>';
      return () => { element.classList.remove('model-unavailable'); element.replaceChildren(); };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.1));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#bbc5c0', '#141718', 1.55));
    const moon = new THREE.DirectionalLight('#acb9b7', 2.1);
    moon.position.set(-8, 14, 5);
    scene.add(moon);
    const seaFill = new THREE.PointLight('#315159', 12, 26, 2);
    seaFill.position.set(4, 5, -9);
    scene.add(seaFill);

    const groundGeometry = new THREE.PlaneGeometry(36, 34, 36, 34);
    const groundVertices = groundGeometry.attributes.position;
    for (let i = 0; i < groundVertices.count; i += 1) {
      const x = groundVertices.getX(i);
      const z = -groundVertices.getY(i);
      groundVertices.setZ(i, streetLevel(x, z) - 0.14);
    }
    groundGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ color: '#282d2d', roughness: 1, flatShading: true }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    scene.add(ground);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 9),
      new THREE.MeshStandardMaterial({ color: '#101e22', roughness: 0.31, metalness: 0.12, transparent: true, opacity: 0.87 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(7.2, -0.07, -9.4);
    scene.add(water);

    // The playable route follows a compact, sloped old-street block rather than a generic canal-town grid.
    const routeMaterial = new THREE.MeshStandardMaterial({ color: '#444846', roughness: 0.96 });
    route.slice(0, -1).forEach(([x1, z1], index) => {
      const [x2, z2] = route[index + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const paving = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, length + 0.2), routeMaterial);
      paving.position.set((x1 + x2) / 2, streetLevel((x1 + x2) / 2, (z1 + z2) / 2) - 0.04, (z1 + z2) / 2);
      paving.rotation.y = Math.atan2(dx, dz);
      paving.receiveShadow = true;
      scene.add(paving);

      // A few transverse stone risers break the long sloped route into old-street stair landings.
      for (const t of [0.18, 0.5, 0.82]) {
        const stepX = x1 + dx * t;
        const stepZ = z1 + dz * t;
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.055, 0.07), new THREE.MeshStandardMaterial({ color: '#777a73', roughness: 1 }));
        step.position.set(stepX, streetLevel(stepX, stepZ) + 0.018, stepZ);
        step.rotation.y = Math.atan2(dx, dz);
        step.receiveShadow = true;
        scene.add(step);
      }
    });

    let houseIndex = 0;
    route.slice(0, -1).forEach(([x1, z1], segmentIndex) => {
      const [x2, z2] = route[segmentIndex + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const normalX = -dz / length;
      const normalZ = dx / length;
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      // The houses hug both edges of the stepped harbor lane and turn with each bend.
      for (const side of [-1, 1]) {
        const jitter = ((segmentIndex % 3) - 1) * 0.16;
        const x = midX + normalX * side * (2.05 + jitter);
        const z = midZ + normalZ * side * (2.05 + jitter);
        const facingRoad = Math.atan2(-normalX * side, -normalZ * side);
        const height = 1.65 + (houseIndex % 4) * 0.34;
        const width = 1.55 + (houseIndex % 3) * 0.18;
        const depth = 1.75 + (houseIndex % 2) * 0.2;
        addHouse(scene, x, z, width, depth, height, houseIndex, streetLevel(x, z), facingRoad);
        houseIndex += 1;
      }
    });

    const quay = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.8, 10), new THREE.MeshStandardMaterial({ color: '#62635e', roughness: 1 }));
    quay.position.set(4.4, 0.28, -7.4);
    scene.add(quay);

    const markers: THREE.Mesh[] = [];
    const markerMaterial = new THREE.MeshStandardMaterial({ color: '#ddb677', emissive: '#a75b22', emissiveIntensity: 0.56, roughness: 0.25 });
    route.forEach(([x, z], index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.028, 7, 28), new THREE.MeshBasicMaterial({ color: '#c5a875', transparent: true, opacity: 0.66 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, streetLevel(x, z) + 0.2, z);
      scene.add(ring);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), markerMaterial);
      marker.position.set(x, streetLevel(x, z) + 0.43, z);
      marker.userData.chapterId = String(index + 1).padStart(2, '0');
      marker.userData.baseY = marker.position.y;
      markers.push(marker);
      scene.add(marker);
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.13), new THREE.MeshStandardMaterial({ color: index === 3 || index === 4 ? palette[0] : '#ad814c', emissive: '#7d411b', emissiveIntensity: 0.33 }));
      lantern.position.set(x + 0.48, streetLevel(x + 0.48, z + 0.25) + 0.47, z + 0.25);
      scene.add(lantern);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.45, -0.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 9;
    controls.maxDistance = 28;
    controls.maxPolarAngle = 1.47;
    controls.minPolarAngle = 0.2;
    controls.enablePan = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markers)[0]?.object;
      if (hit?.userData.chapterId) callback.current(String(hit.userData.chapterId));
    };
    renderer.domElement.addEventListener('click', onClick);

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
    const render = (time: number) => {
      animation = requestAnimationFrame(render);
      if (time - lastFrame < 33) return;
      lastFrame = time;
      controls.update();
      if (!reduceMotion) frame += 0.014;
      markers.forEach((marker) => {
        const isSelected = marker.userData.chapterId === activeId.current;
        marker.position.y = Number(marker.userData.baseY) + (reduceMotion ? (isSelected ? 0.05 : 0.025) : isSelected ? 0.05 + Math.sin(frame * 2) * 0.08 : 0.025 + Math.sin(frame + marker.position.x) * 0.022);
        (marker.material as THREE.MeshStandardMaterial).emissiveIntensity = isSelected ? (reduceMotion ? 0.8 : 1.2) : 0.5;
      });
      renderer.render(scene, camera);
    };
    render(34);

    return () => {
      cancelAnimationFrame(animation);
      resize.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, []);

  return <div className="village-canvas" ref={host} aria-label="可旋转缩放的连云老街三维路线模型" />;
}
