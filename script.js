document.getElementById('ano').textContent = new Date().getFullYear();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const hasThree = typeof THREE !== 'undefined';
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
let scrollP = 0;
let warpAt = -1; // momento em que o salto para a velocidade da luz começou

/* ---------- barra de progresso ---------- */
const bar = document.getElementById('progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollP = max > 0 ? scrollY / max : 0;
  bar.style.transform = 'scaleX(' + scrollP + ')';
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- cursor customizado ---------- */
const cursor = document.getElementById('cursor');
if (matchMedia('(hover:hover)').matches) {
  addEventListener('mousemove', (e) => { mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = (e.clientY / innerHeight - 0.5) * 2; });
}
if (matchMedia('(hover:hover)').matches && !reduce) {
  document.body.classList.add('has-cursor');
  let cx = 0, cy = 0, px = 0, py = 0;
  addEventListener('mousemove', (e) => {
    px = e.clientX; py = e.clientY;
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    cursor.classList.add('on');
  });
  (function loop() {
    cx += (px - cx) * 0.18; cy += (py - cy) * 0.18;
    cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,.chips span,.card').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}

/* ---------- cena 3D: túnel de código ---------- */
const CODE = [
  "const agenda = await api.get('/agendamentos');",
  "public class Cliente extends Pessoa {",
  "SELECT * FROM servicos WHERE ativo = 1;",
  "app.post('/api/login', autenticar);",
  "if (horarioOcupado(barbeiro, hora)) return conflito();",
  "router.get('/barbearias/:slug', publico);",
  "@Override public void salvar(Produto p) {",
  "const comissao = valor * barbeiro.percentual;",
  "CREATE TABLE clientes (id INTEGER PRIMARY KEY);",
  "describe('agenda', () => { it('evita conflito') });",
  "git commit -m \"feat: clube de assinantes\"",
  "export function validarArquivo(file) {",
  "INSERT INTO atendimentos VALUES (?, ?, ?);",
  "while (aprendendo) { evoluir(); }",
  "fetch('/api/pagamentos/mercadopago')",
  "private final ProdutoDAO dao = new ProdutoDAO();",
  "res.status(201).json({ ok: true });",
  "const tenant = req.user.barbeariaId;",
  "npm test  ✓ 48 passing",
  "for (const s of sprints) kanban.mover(s);",
  "String sql = \"UPDATE estoque SET qtd = ?\";",
  "assertEquals(esperado, resultado);",
  "const ia = await claude.pergunta(ideia);",
  "UPDATE planos SET trial = 30 WHERE novo;",
  "<section class=\"hero\">Augusto</section>",
  "ScrollTrigger.create({ scrub: true });",
  "try { conn.commit(); } catch (e) { rollback(); }",
];
const KW = /\b(const|let|await|async|public|private|final|class|extends|return|if|while|for|of|new|try|catch|export|function|void|SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|CREATE|TABLE|INTEGER|PRIMARY|KEY|true)\b/;

function codeTexture(line) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = '500 44px "JetBrains Mono", Consolas, monospace';
  g.font = font;
  const w = Math.ceil(g.measureText(line).width) + 24;
  c.width = w; c.height = 64;
  g.font = font; g.textBaseline = 'middle';
  let x = 12;
  line.split(/(\s+|[(){};,.:=<>\[\]'"]+)/).forEach((tok) => {
    if (!tok) return;
    g.fillStyle = KW.test(tok) ? '#ff9f43' : /^['"]|['"]$/.test(tok) || /^\d/.test(tok) ? '#aad94c'
      : /^[(){};,.:=<>\[\]'"]+$/.test(tok) ? '#5d6b85' : /^[A-Z]/.test(tok) ? '#5ccfe6' : '#c9d6ff';
    g.fillText(tok, x, 34);
    x += g.measureText(tok).width;
  });
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return { tex, aspect: w / 64 };
}

function initScene() {
  const canvas = document.getElementById('scene');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { canvas.style.display = 'none'; return; }
  const mobile = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(0x05070c, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 6, 70);
  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);

  const textures = CODE.map(codeTexture);
  const COUNT = mobile ? 70 : 140, LEN = 120;
  const lines = [];
  for (let i = 0; i < COUNT; i++) {
    const t = textures[i % textures.length];
    const h = 0.42 + Math.random() * 0.25;
    const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, depthWrite: false, opacity: 0.28 + Math.random() * 0.4 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * t.aspect, h), mat);
    const a = Math.random() * Math.PI * 2, r = 6.5 + Math.random() * 6;
    m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.75, -Math.random() * LEN);
    m.userData.base = mat.opacity;
    m.userData.drift = (Math.random() - 0.5) * 0.25;
    scene.add(m); lines.push(m);
  }

  // luz no fim do túnel
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(140,190,255,1)'); grd.addColorStop(0.3, 'rgba(60,120,255,0.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  glow.scale.set(40, 40, 1); scene.add(glow);

  // partículas (bits) passando
  const N = mobile ? 400 : 900, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 12;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(a) * r; pos[i * 3 + 2] = -Math.random() * LEN;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const bits = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x7fb0ff, size: 0.05, transparent: true, opacity: 0.7 }));
  scene.add(bits);

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let travel = 0, lastP = scrollP, boost = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    // velocidade: avança devagar sozinho e acelera quando você rola
    boost += ((scrollP - lastP) * 900 - boost) * 0.08; lastP = scrollP;
    travel += reduce ? dt * 1.2 : dt * 3 + Math.max(-2, Math.min(boost, 6)) * dt * 6;
    // salto: acelera muito, abre o campo de visão e depois desacelera
    let w = 0;
    if (warpAt >= 0) {
      const k = (performance.now() - warpAt) / 1000;
      w = k < 0.45 ? (k / 0.45) ** 2 : k < 2.2 ? 1 - ((k - 0.45) / 1.75) ** 0.6 : 0;
      w = Math.max(0, w);
    }
    travel += dt * w * 140;
    const fov = 65 + w * 60;
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
    glow.scale.setScalar(40 + w * 160);

    camera.position.set(mouse.x * 1.2, -mouse.y * 0.8, -travel);
    camera.rotation.set(-mouse.y * 0.05, -mouse.x * 0.08, reduce ? 0 : Math.sin(t * 0.2) * 0.04 + scrollP * 0.6);
    glow.position.set(0, 0, camera.position.z - 75);
    bits.position.z = Math.floor(camera.position.z / LEN) * LEN;

    for (const m of lines) {
      if (m.position.z > camera.position.z + 2) m.position.z -= LEN;
      m.position.x += m.userData.drift * dt;
      m.lookAt(m.position.x * 0.2, m.position.y * 0.2, m.position.z + 30);
      // linha "acende" quando passa perto da câmera
      const d = camera.position.z - m.position.z;
      if (w > 0.05) { m.material.opacity = Math.min(1, m.userData.base + w); continue; }
      m.material.opacity = d < 3 ? m.userData.base * (d / 3) : d < 16 ? Math.min(0.85, m.userData.base + (16 - d) / 30) : m.userData.base;
    }
    canvas.style.opacity = 1 - Math.min(scrollY / innerHeight, 1) * 0.5;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
if (hasThree) (document.fonts ? document.fonts.ready : Promise.resolve()).then(initScene);

/* ---------- animações ---------- */
function split(el) {
  // quebra o título em letras, mas mantém cada palavra inteira (sem quebrar no meio)
  const word = (w) => '<span class="w">' + [...w].map((c) => '<span class="ch">' + c + '</span>').join('') + '</span>';
  const words = (txt) => txt.split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? ' ' : w ? word(w) : '')).join('');
  el.innerHTML = [...el.childNodes].map((n) => {
    if (n.nodeType === 3) return words(n.textContent);
    if (n.nodeName === 'BR') return '<br>';
    const tag = n.nodeName.toLowerCase();
    return '<' + tag + '>' + words(n.textContent) + '</' + tag + '>';
  }).join('');
}

function startAnimations() {
  const h1 = document.querySelector('h1');
  if (!hasGSAP || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  split(h1);

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.nav', { y: -60, opacity: 0, duration: 0.8 })
    .from('h1 .ch', { yPercent: 60, opacity: 0, filter: 'blur(8px)', duration: 1.4, stagger: 0.035, ease: 'power3.out' }, '-=0.3')
    .from('.eyebrow,.role,.hero .cta', { y: 30, opacity: 0, duration: 0.8, stagger: 0.12 }, '-=0.6')
    .from('.photo', { x: 80, opacity: 0, rotateY: -25, duration: 1.1 }, '-=1.2');

  // revela cada bloco ao rolar
  document.querySelectorAll('.reveal').forEach((sec) => {
    sec.classList.add('reveal-ready');
    const title = sec.querySelector('h2');
    const items = sec.querySelectorAll('.card, .chips span, h3.group');
    if (title) gsap.from(title, { x: -60, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: title, start: 'top 88%' } });
    if (items.length) gsap.from(items, { y: 50, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 72%' } });
  });

  // marquee acelera com o scroll
  const track = document.querySelector('.marquee-track');
  let last = scrollY;
  ScrollTrigger.create({ onUpdate: (self) => {
    const v = Math.min(Math.abs(self.getVelocity()) / 1500, 3);
    track.style.animationDuration = Math.max(28 - v * 9, 8) + 's';
  } });
  // hero some suavemente ao rolar
  gsap.to('.hero-text', { yPercent: -20, opacity: 0, filter: 'blur(6px)', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // card do editor inclina com o mouse
  const ed = document.querySelector('.photo');
  if (matchMedia('(hover:hover)').matches) {
    document.querySelector('.hero').addEventListener('mousemove', (e) => {
      const r = ed.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      ed.style.transform = 'perspective(900px) rotateY(' + x * 10 + 'deg) rotateX(' + -y * 10 + 'deg)';
    });
    document.querySelector('.hero').addEventListener('mouseleave', () => { ed.style.transform = ''; });
  }
}

/* ---------- foto: de caracteres de código para a foto real ---------- */
function fitAscii() {
  const pre = document.getElementById('ascii'), box = pre.parentElement;
  const rows = pre.textContent.split('\n'), cols = rows[0].length;
  pre.style.fontSize = (box.clientWidth / (cols * 0.6)) + 'px';
  pre.style.lineHeight = (box.clientHeight / rows.length) + 'px';
}
addEventListener('resize', fitAscii);
fitAscii();

function decodePhoto() {
  const pre = document.getElementById('ascii'), photo = document.getElementById('photo');
  const status = document.getElementById('photoStatus');
  const cells = [...pre.querySelectorAll('i')].map((el) => ({ el, ch: el.textContent, lock: Math.random() }));
  const GLYPHS = '01{}[]<>/\\=;:+*#$&%@!?';
  const t0 = performance.now(), DUR = 1600;
  (function step() {
    const p = Math.min(1, (performance.now() - t0) / DUR);
    for (const c of cells) {
      if (c.done) continue;
      if (c.lock < p) { c.el.textContent = c.ch; c.done = true; }
      else c.el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    status.textContent = 'decodificando… ' + Math.round(p * 100) + '%';
    if (p < 1) requestAnimationFrame(step);
    else setTimeout(() => { photo.classList.add('revealed'); status.textContent = '✓ carregado'; }, 350);
  })();
}

/* ---------- intro: terminal → glitch → salto ---------- */
const intro = document.getElementById('intro');
const log = document.getElementById('introLog');
const flash = document.getElementById('flash');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let skipped = false, launched = false;

const SCRIPT = [
  { cmd: 'ssh visitante@augusto.dev' },
  { out: 'conectando a curitibanos-sc.br:22 ...', ok: true },
  { out: 'autenticando visitante ...', ok: 'acesso concedido' },
  { cmd: './portfolio --modo=absurdo' },
  { out: 'carregando módulos: java · javascript · node.js · sql · ia', ok: true },
  { bar: 'compilando augusto.exe' },
  { out: '⚠  AVISO: nível de ambição acima do limite seguro', cls: 'warn' },
  { out: 'iniciando salto para o código em 3… 2… 1…', cls: 'hot' },
];

function line(html, cls) {
  const el = document.createElement('div');
  if (cls) el.className = cls;
  el.innerHTML = html;
  log.appendChild(el);
  return el;
}

async function runTerminal() {
  for (const step of SCRIPT) {
    if (skipped) return;
    if (step.cmd) {
      const el = line('<b>visitante@augusto</b>:<i>~</i>$ <span></span><u class="caret"></u>');
      const span = el.querySelector('span');
      await wait(120);
      for (const c of step.cmd) { if (skipped) return; span.textContent += c; await wait(14 + Math.random() * 22); }
      el.querySelector('.caret').remove();
      await wait(90);
    } else if (step.bar) {
      const el = line(step.bar + ' <span class="bar"></span>');
      const bar = el.querySelector('.bar');
      for (let i = 0; i <= 24; i++) {
        if (skipped) return;
        bar.textContent = '[' + '█'.repeat(i) + '░'.repeat(24 - i) + '] ' + Math.round((i / 24) * 100) + '%';
        await wait(14 + Math.random() * 26);
      }
    } else {
      const el = line(step.out, step.cls);
      if (step.ok) { await wait(150); el.innerHTML += ' <em>' + (step.ok === true ? 'ok' : step.ok) + '</em>'; }
      await wait(step.cls === 'hot' ? 520 : 90);
    }
  }
}

async function launch() {
  if (launched) return;
  launched = true;
  intro.classList.add('glitch');
  await wait(skipped ? 150 : 550);
  warpAt = performance.now();
  intro.classList.add('out');
  await wait(450);
  flash.classList.add('on');
  await wait(120);
  intro.remove();
  document.body.classList.remove('intro-on');
  startAnimations();
  setTimeout(decodePhoto, 250);
  setTimeout(() => flash.classList.remove('on'), 60);
}

function skip() { if (!skipped) { skipped = true; launch(); } }
document.getElementById('introSkip').addEventListener('click', skip);
addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); });

let seen = false;
try { seen = sessionStorage.getItem('intro-vista') === '1'; sessionStorage.setItem('intro-vista', '1'); } catch (e) {}
document.body.classList.add('intro-on');
if (seen) { skipped = true; launch(); }
else runTerminal().then(() => { if (!skipped) launch(); });

/* ---------- títulos que se decodificam ao aparecer ---------- */
(function decodeTitles() {
  const GLYPHS = '01<>/{}[]=+*#$%&;:_';
  const titles = [...document.querySelectorAll('section h2')];
  titles.forEach((h2) => {
    // pega só o texto do título (sem o "01 /")
    const node = [...h2.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const span = document.createElement('span');
    span.className = 'decode';
    span.textContent = node.textContent.trim();
    span.dataset.final = span.textContent;
    span.setAttribute('aria-label', span.textContent);
    h2.replaceChild(document.createTextNode(' '), node);
    h2.appendChild(span);
  });

  function run(span) {
    const final = span.dataset.final, t0 = performance.now(), DUR = reduce ? 500 : 1100;
    span.classList.add('running');
    (function step() {
      const p = Math.min(1, (performance.now() - t0) / DUR);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        // revela da esquerda para a direita; o resto fica embaralhado
        out += c === ' ' || i / final.length < p * 1.15 - 0.15 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      span.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else { span.textContent = final; span.classList.remove('running'); }
    })();
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      run(e.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  document.querySelectorAll('h2 .decode').forEach((s) => {
    s.textContent = s.dataset.final.replace(/\S/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    io.observe(s);
  });
})();

/* ---------- cards de projeto 3D + botões magnéticos ---------- */
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  document.querySelectorAll('.project').forEach((card) => {
    let raf = 0;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.transform = 'perspective(900px) rotateX(' + (0.5 - y) * 14 + 'deg) rotateY(' + (x - 0.5) * 16 + 'deg) translateZ(10px)';
      });
    });
    card.addEventListener('mouseenter', () => card.classList.add('tilting'));
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.classList.remove('tilting');
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.btn, .btn-mini').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = 'translate(' + dx * 0.25 + 'px,' + dy * 0.35 + 'px)';
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}
