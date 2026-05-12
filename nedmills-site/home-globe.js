/* ──────────────────────────────────────────────────────────
   Ned Mills · home — 3D rotating globe with orbiting photos
   Three.js wireframe globe + atmosphere + dotted continents
   + ~7 athlete photos billboarded around the sphere
   ────────────────────────────────────────────────────────── */
(function(){
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const parent = canvas.parentElement;
  let W = parent.clientWidth;
  let H = parent.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 100);
  camera.position.set(0, 0.4, 8.6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);

  /* ─────────── Globe group ─────────── */
  const globe = new THREE.Group();
  scene.add(globe);

  const R = 1.85;

  // 1. Solid inner sphere — dark, slightly warm
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x0E1014 });
  const inner = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 36), innerMat);
  globe.add(inner);

  // 2. Wireframe sphere — latitude/longitude grid in accent gold
  const wireGeo = new THREE.SphereGeometry(R, 28, 18);
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(wireGeo),
    new THREE.LineBasicMaterial({ color: 0xD6BC90, transparent: true, opacity: 0.16 })
  );
  globe.add(wire);

  // 3. Dotted "continents" — generated as Points sampled with a procedural pattern
  //    Creates land masses using noise that roughly hits N/S America, Eurasia, Africa, Australia.
  const dots = makeContinentDots(R * 1.005);
  globe.add(dots);

  // 4. Equator ring — thicker accent
  const eqGeo = new THREE.RingGeometry(R*1.001, R*1.005, 96);
  const eqMat = new THREE.MeshBasicMaterial({ color: 0xD6BC90, side: THREE.DoubleSide, transparent:true, opacity: 0.35 });
  const eq = new THREE.Mesh(eqGeo, eqMat);
  eq.rotation.x = Math.PI/2;
  globe.add(eq);

  // 5. Atmosphere halo — back-side sphere shader
  const atmoGeo = new THREE.SphereGeometry(R * 1.18, 48, 36);
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0xD6BC90) } },
    vertexShader: `
      varying vec3 vNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uColor;
      void main(){
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
        gl_FragColor = vec4(uColor, 1.0) * intensity * 0.55;
      }
    `
  });
  const atmo = new THREE.Mesh(atmoGeo, atmoMat);
  scene.add(atmo);

  /* ─────────── Location pins (where Ned has worked) ─────────── */
  // lat / lon → 3D
  function ll(lat, lon, r){
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }
  const PIN_LOCS = [
    [24.4539,  54.3773], // Abu Dhabi
    [51.5074,  -0.1278], // London
    [53.4084,  -2.9916], // Liverpool
    [48.8566,   2.3522], // Paris
    [25.276987, 55.296249], // Dubai
    [-33.8688, 151.2093], // Sydney
    [40.7128, -74.0060],  // New York
    [-23.5505,-46.6333],  // São Paulo
  ];
  const pinsGroup = new THREE.Group();
  globe.add(pinsGroup);
  for (const [lat, lon] of PIN_LOCS){
    const pos = ll(lat, lon, R * 1.012);
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xD6BC90 })
    );
    pin.position.copy(pos);
    pinsGroup.add(pin);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xD6BC90, transparent:true, opacity:0.18 })
    );
    halo.position.copy(pos);
    pinsGroup.add(halo);
  }

  /* ─────────── Orbiting photos (billboarded) ─────────── */
  const PHOTOS = [
    { src: 'assets/rugby-saracens.jpg',  tag: 'Rugby' },
    { src: 'assets/aljazira-blue.jpg',   tag: 'ProLeague' },
    { src: 'assets/aljazira-red.jpg',    tag: 'Football' },
    { src: 'assets/olympic-skate.jpg',   tag: 'Olympic' },
    { src: 'assets/u7therapy-gym.jpg',   tag: 'CrossFit' },
    { src: 'assets/aspetar-psg.jpg',     tag: 'Paris' },
    { src: 'assets/psg-stadium.jpg',     tag: 'Paris' },
    { src: 'assets/exeter-chiefs.jpg',   tag: 'Exeter' },
    { src: 'assets/basketball-patriots.jpg', tag: 'BBL' },
    { src: 'assets/crossfit-miami.jpg',  tag: 'Miami' },
    { src: 'assets/mancity-abudhabi.jpg',tag: 'Man City' },
    { src: 'assets/england-portrait.jpg',tag: 'England' },
    { src: 'assets/medic-pitch.jpg',     tag: 'Pitchside' },
    { src: 'assets/hero-medic.jpg',      tag: 'Medic' },
    { src: 'assets/hero-propath.jpg',    tag: 'ProPath' },
    { src: 'assets/coaching-brick.jpg',  tag: 'Coaching' },
    { src: 'assets/rehab-clinic.jpg',    tag: 'Clinic' },
    { src: 'assets/rehab-brace.jpg',     tag: 'Brace' },
    { src: 'assets/rehab-knee.jpg',      tag: 'Knee' },
    { src: 'assets/rehab-manual.jpg',    tag: 'Manual' },
    { src: 'assets/rehab-taping.jpg',    tag: 'Taping' },
    { src: 'assets/online-laptop.jpg',   tag: 'Remote' },
  ];

  const photoGroup = new THREE.Group();
  scene.add(photoGroup);

  // Orbit configurations: 3 rings at distinct tilts, photos spread evenly per ring
  // Inner / mid / outer — each photo gets a deterministic-but-varied spot
  const RING_COUNT = 3;
  const ringTilts  = [ -20, 28, 62 ].map(d => d * Math.PI/180);
  const ringYaws   = [   8, 42, 95 ].map(d => d * Math.PI/180);
  const ringRadii  = [ 2.85, 3.30, 3.78 ];
  const ringSpeeds = [ 0.12, -0.085, 0.06 ];

  const perRing = Math.ceil(PHOTOS.length / RING_COUNT);

  const orbits = PHOTOS.map((p, i) => {
    const ring = i % RING_COUNT;
    const idxInRing = Math.floor(i / RING_COUNT);
    const photosInThisRing = Math.min(perRing, Math.ceil((PHOTOS.length - ring) / RING_COUNT));
    return {
      ring,
      radius: ringRadii[ring] + (idxInRing % 2 === 0 ? 0 : 0.12),
      tilt:   ringTilts[ring],
      yaw:    ringYaws[ring],
      phase:  (idxInRing / photosInThisRing) * Math.PI * 2,
      speed:  ringSpeeds[ring],
      aspect: i % 3 === 0 ? 1.0 : (i % 3 === 1 ? 1.25 : 0.78), // landscape / portrait / square
    };
  });

  const loader = new THREE.TextureLoader();
  const photoMeshes = [];

  PHOTOS.forEach((p, i) => {
    const o = orbits[i];
    const tex = loader.load(p.src, (t) => {
      t.colorSpace = THREE.SRGBColorSpace || t.colorSpace;
      t.minFilter = THREE.LinearFilter;
      renderer.render(scene, camera);
    });

    // Group: orbit-tilt holder → photo card (so we can billboard the card)
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = o.tilt;
    orbitGroup.rotation.y = o.yaw;
    photoGroup.add(orbitGroup);

    const card = new THREE.Group();
    orbitGroup.add(card);

    // The photo plane — smaller because there are many
    const wPhoto = 0.62;
    const hPhoto = wPhoto * o.aspect;
    const planeGeo = new THREE.PlaneGeometry(wPhoto, hPhoto);
    const planeMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.96
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    card.add(plane);

    // Border frame
    const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(wPhoto + 0.04, hPhoto + 0.04));
    const frame = new THREE.LineSegments(
      frameGeo,
      new THREE.LineBasicMaterial({ color: 0xD6BC90, transparent: true, opacity: 0.85 })
    );
    card.add(frame);

    // Tether line back to a point on the globe surface
    const tetherMat = new THREE.LineBasicMaterial({
      color: 0xD6BC90, transparent: true, opacity: 0.18
    });
    const tetherGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const tether = new THREE.Line(tetherGeo, tetherMat);
    scene.add(tether);

    // Small tag label rendered into a tiny canvas texture
    const tagTex = makeLabelTexture(p.tag);
    const tagGeo = new THREE.PlaneGeometry(0.46, 0.13);
    const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.position.set(0, -hPhoto/2 - 0.12, 0.001);
    card.add(tagMesh);

    photoMeshes.push({ orbitGroup, card, o, tether });
  });

  /* ─────────── Stars / specks (background) ─────────── */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 220;
  const sp = new Float32Array(starCount * 3);
  for (let i=0; i<starCount; i++){
    const r = 18 + Math.random() * 10;
    const t = Math.random() * Math.PI * 2;
    const f = Math.acos(2*Math.random() - 1);
    sp[i*3]   = r * Math.sin(f) * Math.cos(t);
    sp[i*3+1] = r * Math.sin(f) * Math.sin(t);
    sp[i*3+2] = r * Math.cos(f);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xD6BC90, size: 0.04, transparent:true, opacity: 0.45, sizeAttenuation:true
    })
  );
  scene.add(stars);

  /* ─────────── Animate ─────────── */
  let lastT = performance.now();
  const cameraDir = new THREE.Vector3();

  function tick(now){
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    globe.rotation.y += 0.06 * dt;
    globe.rotation.x = Math.sin(now * 0.00009) * 0.05;
    stars.rotation.y -= 0.005 * dt;

    // Photos orbit + billboard
    camera.getWorldDirection(cameraDir);
    for (const pm of photoMeshes){
      pm.o.phase += pm.o.speed * dt;
      // position card on a ring inside the tilted orbitGroup
      const x = Math.cos(pm.o.phase) * pm.o.radius;
      const z = Math.sin(pm.o.phase) * pm.o.radius;
      pm.card.position.set(x, 0, z);

      // billboard the card to face the camera
      pm.card.getWorldPosition(_wp);
      // Convert camera world position into the card's parent space
      pm.orbitGroup.worldToLocal(_camLocal.copy(camera.position));
      pm.card.lookAt(_camLocal);

      // Update tether line: from globe surface (closest point) to card
      const cardWorld = _wp.clone();
      const dir = cardWorld.clone().normalize();
      const surface = dir.multiplyScalar(R * 1.01);
      const positions = pm.tether.geometry.attributes.position.array;
      positions[0] = surface.x; positions[1] = surface.y; positions[2] = surface.z;
      positions[3] = cardWorld.x; positions[4] = cardWorld.y; positions[5] = cardWorld.z;
      pm.tether.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  const _wp = new THREE.Vector3();
  const _camLocal = new THREE.Vector3();

  requestAnimationFrame(tick);

  /* ─────────── Resize ─────────── */
  const ro = new ResizeObserver(() => {
    W = parent.clientWidth; H = parent.clientHeight;
    if (W < 2 || H < 2) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
  });
  ro.observe(parent);

  /* ─────────── Helpers ─────────── */

  // Generate a Points geometry distributed on a sphere, denser over
  // approximate "land" longitude/latitude bands to suggest continents.
  function makeContinentDots(radius){
    const positions = [];
    const COUNT = 4200;
    for (let i=0; i<COUNT; i++){
      // uniform on sphere
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const lat = 90 - (phi * 180 / Math.PI);     // -90..90
      const lon = (theta * 180 / Math.PI) - 180;  // -180..180

      // Probability of being a "land dot" based on a rough mask
      const p = landProb(lat, lon);
      if (Math.random() > p) continue;

      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y =  radius * Math.cos(phi);
      const z =  radius * Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xD6BC90,
        size: 0.036,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      })
    );
  }

  // Rough continental mask using a few elliptical "blobs"
  function landProb(lat, lon){
    const blobs = [
      // [latC, lonC, latR, lonR, weight]
      // North America
      [ 45, -100,  25,  40, 1.0],
      [ 28,  -95,  10,  18, 0.7],
      [ 60, -110,  15,  30, 0.8],
      // South America
      [-15, -60,   25,  18, 1.0],
      [-30, -65,   10,  10, 0.7],
      // Europe
      [ 52,   12,  15,  22, 0.95],
      // Africa
      [  5,   18,  30,  20, 1.0],
      [-15,   25,  15,  18, 0.8],
      // Middle East
      [ 28,   45,  10,  12, 0.85],
      // Asia
      [ 45,   90,  20,  45, 1.0],
      [ 25,   85,  15,  25, 0.85],
      [ 35,  115,  15,  20, 0.95],
      [ 10,  108,  10,  15, 0.75],
      // Australia
      [-25,  135,  12,  18, 0.95],
      // Greenland
      [ 72,  -40,  10,  15, 0.6],
      // UK / Ireland
      [ 54,   -3,   5,   5, 0.95],
      // Japan
      [ 36,  138,   7,   7, 0.85],
      // Indonesia
      [  0,  120,   6,  18, 0.7],
      // New Zealand
      [-42,  173,   5,   5, 0.8],
    ];
    let p = 0;
    for (const [bLat, bLon, rLat, rLon, w] of blobs){
      let dLon = Math.abs(lon - bLon);
      if (dLon > 180) dLon = 360 - dLon;
      const dLat = lat - bLat;
      const e = (dLat*dLat)/(rLat*rLat) + (dLon*dLon)/(rLon*rLon);
      if (e < 1){
        p = Math.max(p, w * (1 - e));
      }
    }
    return p;
  }

  // Render a small text label to a canvas texture
  function makeLabelTexture(text){
    const c = document.createElement('canvas');
    const dpr = 2;
    c.width = 260 * dpr;
    c.height = 72 * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);

    // bg
    ctx.fillStyle = 'rgba(8,9,12,0.86)';
    ctx.fillRect(0, 0, 260, 72);
    // border
    ctx.strokeStyle = 'rgba(214,188,144,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 259, 71);
    // text
    ctx.fillStyle = '#D6BC90';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText(text.toUpperCase(), 130, 36);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
    return tex;
  }
})();
