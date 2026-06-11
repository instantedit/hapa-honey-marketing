/* ============================================================
   Hapa Honey — Hero WebGL background
   A slow, organic honey-gradient flow rendered with a fragment
   shader (fbm domain warp) in the brand palette. Falls back
   silently to a CSS gradient if WebGL is unavailable.
   ============================================================ */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") {
    if (canvas) canvas.style.background =
      "radial-gradient(120% 120% at 30% 20%, #3a2b20 0%, #14110d 70%)";
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch (e) {
    canvas.style.background = "linear-gradient(160deg,#3a2b20,#14110d 70%)";
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time: { value: 0 },
    u_res: { value: new THREE.Vector2(1, 1) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    // brand palette
    u_ink: { value: new THREE.Color("#0b0908") },
    u_cocoa: { value: new THREE.Color("#3a2b20") },
    u_honey: { value: new THREE.Color("#b3844b") },
    u_honeyBright: { value: new THREE.Color("#e0b25e") },
    u_olive: { value: new THREE.Color("#847a3e") },
  };

  const vert = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `;

  const frag = `
    precision highp float;
    varying vec2 vUv;
    uniform float u_time;
    uniform vec2 u_res;
    uniform vec2 u_mouse;
    uniform vec3 u_ink, u_cocoa, u_honey, u_honeyBright, u_olive;

    // -- simplex-ish value noise --
    vec2 hash(vec2 p){
      p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(dot(hash(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),
                     dot(hash(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
                 mix(dot(hash(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),
                     dot(hash(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = vUv;
      vec2 p = uv;
      p.x *= u_res.x / u_res.y;

      float t = u_time * 0.045;

      // domain warp
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
      vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + 0.15*t),
                    fbm(p + 3.0*q + vec2(8.3, 2.8) - 0.12*t));
      float f = fbm(p + 2.4*r + t*0.3);

      // mouse-driven glow center
      vec2 m = u_mouse; m.x *= u_res.x/u_res.y;
      float glow = smoothstep(0.85, 0.0, distance(p, m));

      float v = clamp(f*1.8 + 0.45, 0.0, 1.0);

      vec3 col = mix(u_ink, u_cocoa, smoothstep(0.0, 0.5, v));
      col = mix(col, u_honey, smoothstep(0.35, 0.75, v + r.x*0.25));
      col = mix(col, u_olive, smoothstep(0.55, 0.85, length(q)) * 0.5);
      col = mix(col, u_honeyBright, smoothstep(0.7, 1.0, v) * (0.5 + 0.5*glow));

      // warm highlight ribbon
      col += u_honeyBright * pow(glow, 2.0) * 0.18;

      // vignette toward bottom for legibility
      col *= 1.0 - smoothstep(0.55, 1.15, uv.y) * 0.55;
      col *= 0.92 + 0.08*v;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.u_res.value.set(w, h);
  }
  window.addEventListener("resize", resize);
  resize();

  // smooth mouse follow
  const target = { x: 0.5, y: 0.5 };
  const cur = { x: 0.5, y: 0.5 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX / window.innerWidth;
    target.y = 1.0 - e.clientY / window.innerHeight;
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf, running = true;
  const clock = new THREE.Clock();

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    cur.x += (target.x - cur.x) * 0.04;
    cur.y += (target.y - cur.y) * 0.04;
    uniforms.u_mouse.value.set(cur.x, cur.y);
    uniforms.u_time.value = reduce ? 12.0 : clock.getElapsedTime();
    renderer.render(scene, camera);
    if (reduce) running = false; // render a single frame
  }
  loop();

  // pause when hero off-screen
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !running && !reduce) { running = true; loop(); }
        else if (!en.isIntersecting) { running = false; cancelAnimationFrame(raf); }
      });
    }, { threshold: 0 }).observe(hero);
  }
})();
