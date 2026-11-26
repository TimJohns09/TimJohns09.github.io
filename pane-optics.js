/* Sample the page's pixel wallpaper in screen coordinates. A single transparent
   layer draws the glass behind the real DOM, including the sticky reader. */
(() => {
  const panes = [...document.querySelectorAll('.report-list-item, .report-preview, .terminal')];
  const mobileWallpaper = matchMedia('(max-width: 879px), (hover: none) and (pointer: coarse)');
  const simple = matchMedia('(prefers-reduced-transparency: reduce), (forced-colors: active)');
  if (!panes.length || simple.matches) return;

  const layer = document.createElement('canvas');
  layer.className = 'optical-layer';
  layer.setAttribute('aria-hidden', 'true');
  const gl = layer.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return;

  const vertex = `
    attribute vec2 corner;
    uniform vec2 viewport, origin, size;
    varying vec2 local;
    void main() {
      local = corner * size;
      vec2 screen = (origin + local) / viewport;
      gl_Position = vec4(screen * vec2(2., -2.) + vec2(-1., 1.), 0., 1.);
    }`;
  const fragment = `
    precision highp float;
    varying vec2 local;
    uniform sampler2D pattern;
    uniform vec2 origin, size, tile, paperOffset;
    uniform float radius, lightTheme, isCard, selected;
    float ink(vec2 p) {
      vec3 rgb = texture2D(pattern, fract(p / tile)).rgb;
      return dot(rgb, vec3(.2126, .7152, .0722));
    }
    void main() {
      vec2 halfSize = size * .5;
      vec2 p = local - halfSize;
      vec2 q = abs(p) - halfSize + radius;
      float depth = radius - (length(max(q, 0.)) + min(max(q.x, q.y), 0.));
      if (depth < 0.) discard;
      vec2 outward = max(q, 0.);
      if (outward.x + outward.y < .001)
        outward = q.x > q.y ? vec2(1.,0.) : vec2(0.,1.);
      vec2 n = normalize(outward) * sign(p);
      float bevel = min(mix(42., 21., isCard), min(halfSize.x, halfSize.y) * .55);
      float t = clamp(depth / bevel, 0., 1.);
      float slope = 1. - smoothstep(0., 1., t);
      // Snell's law gives the lateral travel through a convex glass lip.
      float angle = slope * 1.19;
      float travel = tan(angle - asin(sin(angle) / 1.50)) * bevel * 1.8;
      vec2 norm = p / halfSize;
      // A slightly domed face magnifies the grid. Magnification grows
      // toward the shoulders, bending lines that intersect the long sides.
      vec2 dome = p * (.035 + .075 * dot(norm, norm) + .09 * slope);
      vec2 source = origin + paperOffset + local - n * travel - dome;
      float fringe = slope * 1.35;
      vec3 sampleInk = vec3(ink(source + n * fringe), ink(source), ink(source - n * fringe));
      float shoulder = 1. - smoothstep(.35, 1., t);
      vec3 base = mix(vec3(.079,.126,.107), vec3(.951,.969,.933), lightTheme);
      vec3 tint = mix(vec3(.70,.94,.81), vec3(.14,.33,.23), lightTheme);
      base += mix(.042, -.036, lightTheme) * selected * vec3(.62,1.,.67);
      vec3 transmission = clamp(sampleInk * mix(mix(.28,.20,isCard), 1.65, shoulder), 0., .93);
      vec3 color = mix(base, tint, transmission);
      float key = dot(n, normalize(vec2(-.57,-.82)));
      float rim = exp(-pow((depth - 1.8) / 1.35, 2.));
      float inner = exp(-pow((t - .42) / .16, 2.));
      color += (.045 * slope + rim * .29) * max(key, 0.);
      color += inner * .043 * max(-key, 0.);
      gl_FragColor = vec4(color, 1.);
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 1,1]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, 'corner');
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['viewport','origin','size','pattern','tile','paperOffset','radius',
    'lightTheme','isCard','selected'].map(name => [name, gl.getUniformLocation(program,name)]));
  const texture = gl.createTexture();
  const art = new Image();
  const mobileSurfaces = new Map();
  const mobileSamples = new WeakMap();
  let frame = 0;

  function resizeBuffer(width, height, ratio) {
    const w = Math.max(1, Math.round(width * ratio));
    const h = Math.max(1, Math.round(height * ratio));
    if (layer.width !== w || layer.height !== h) {
      layer.width = w;
      layer.height = h;
    }
    gl.viewport(0, 0, w, h);
  }

  function drawPane(pane, x, y, width, height) {
    const card = pane.classList.contains('report-list-item');
    const rim = parseFloat(getComputedStyle(pane).borderTopLeftRadius) || 0;
    gl.uniform2f(u.origin, x, y);
    gl.uniform2f(u.size, width, height);
    gl.uniform1f(u.radius, Math.min(rim, width / 2, height / 2));
    gl.uniform1f(u.isCard, card ? 1 : 0);
    gl.uniform1f(u.selected, pane.hasAttribute('aria-current') ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function clearMobileSurfaces() {
    for (const [pane, surface] of mobileSurfaces) {
      surface.canvas.remove();
      pane.classList.remove('optical-pane-ready');
      mobileSamples.delete(pane);
    }
    mobileSurfaces.clear();
  }

  function drawMobile(pane, rect, ratio, tile, theme) {
    let surface = mobileSurfaces.get(pane);
    if (!surface) {
      const canvas = document.createElement('canvas');
      canvas.className = 'pane-optical-surface';
      canvas.setAttribute('aria-hidden', 'true');
      const context = canvas.getContext('2d');
      if (!context) return;
      surface = { canvas, context };
      mobileSurfaces.set(pane, surface);
    }
    // The reader replaces its children when a different document opens.
    if (surface.canvas.parentElement !== pane) pane.prepend(surface.canvas);
    const x = rect.left + pane.clientLeft;
    const y = rect.top + pane.clientTop;
    const width = pane.clientWidth;
    const height = pane.clientHeight;
    if (!width || !height) return;
    const selected = pane.getAttribute('aria-current');
    const radius = getComputedStyle(pane).borderTopLeftRadius;
    const sample = [Math.round(x * 4), Math.round(y * 4), width, height, tile, ratio, theme, selected, radius].join('/');
    if (mobileSamples.get(pane) === sample) return;
    resizeBuffer(width, height, ratio);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.viewport, width, height);
    gl.uniform2f(u.paperOffset, x, y);
    drawPane(pane, 0, 0, width, height);
    surface.canvas.width = layer.width;
    surface.canvas.height = layer.height;
    surface.context.drawImage(layer, 0, 0);
    mobileSamples.set(pane, sample);
    pane.classList.add('optical-pane-ready');
  }

  function draw() {
    frame = 0;
    if (simple.matches || document.hidden || gl.isContextLost()) return;
    const mobile = mobileWallpaper.matches;
    const theme = document.documentElement.dataset.theme;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const tileWidth = mobile ? Math.max(520, Math.min(innerWidth * 1.15, 840))
      : Math.max(740, Math.min(innerWidth * .82, 1160));
    const tileHeight = tileWidth * (mobile ? 473 / 840 : art.naturalHeight / art.naturalWidth);
    gl.uniform2f(u.tile, tileWidth, tileHeight);
    gl.uniform1f(u.lightTheme, theme === 'light' ? 1 : 0);

    if (mobile) {
      document.documentElement.classList.remove('optics-ready');
      for (const pane of panes) {
        const rect = pane.getBoundingClientRect();
        if (!rect.width || rect.bottom < -120 || rect.top > innerHeight + 120) continue;
        drawMobile(pane, rect, Math.min(ratio, 1), tileWidth, theme);
      }
      return;
    }

    if (mobileSurfaces.size) clearMobileSurfaces();
    const width = layer.clientWidth, height = layer.clientHeight;
    if (!width || !height) return;
    resizeBuffer(width, height, ratio);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.viewport, width, height);
    gl.uniform2f(u.paperOffset, 0, 0);
    for (const pane of panes) {
      const rect = pane.getBoundingClientRect();
      if (!rect.width || rect.bottom <= 0 || rect.top >= height) continue;
      drawPane(pane, rect.left, rect.top, rect.width, rect.height);
    }
    document.documentElement.classList.add('optics-ready');
  }
  function schedule() {
    if (!frame && !simple.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }
  layer.addEventListener('webglcontextlost', () => {
    document.documentElement.classList.remove('optics-ready');
    clearMobileSurfaces();
    cancelAnimationFrame(frame);
    frame = 0;
  });
  art.onload = () => {
    if (gl.isContextLost()) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const axis of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, axis, gl.CLAMP_TO_EDGE);
    for (const filter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, filter, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, art);
    if (gl.getError() !== gl.NO_ERROR) return;
    document.body.prepend(layer);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    mobileWallpaper.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    simple.addEventListener('change', () => {
      document.documentElement.classList.remove('optics-ready');
      if (simple.matches) clearMobileSurfaces();
      schedule();
    });
    const changes = new MutationObserver(schedule);
    changes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    changes.observe(document.querySelector('#reports'), { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden','aria-current'] });
    if ('ResizeObserver' in window) {
      const sizes = new ResizeObserver(schedule);
      for (const el of [document.body, document.querySelector('.hero'), document.querySelector('.report-browser'), ...panes]) sizes.observe(el);
    }
    schedule();
  };
  art.src = 'assets/research-pattern-v2.webp';
})();
