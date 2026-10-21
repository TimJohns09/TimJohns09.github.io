/* A real lens pass over the site's own background artwork. One shared WebGL
   context renders visible surfaces; labels and interactive DOM stay untouched.
   The input is the backdrop + masthead, not a screenshot of arbitrary DOM. */
(() => {
  const options = new URLSearchParams(location.search);
  if (options.get('refraction') === 'off') return;
  const flat = options.get('refraction') === 'flat'; // Unwarped input for visual QA.
  const output = document.createElement('canvas');
  const gl = output.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return; // Keep the exported SVG material when GPU rendering is unavailable.

  const vertex = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
      gl_Position = vec4(position, 0.0, 1.0);
    }`;
  const fragment = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D background;
    uniform vec2 viewport;
    uniform vec2 origin;
    uniform vec2 size;
    uniform float radius;
    uniform float strength;
    uniform float shade;

    float roundedBox(vec2 p) {
      vec2 q = abs(p) - (size * 0.5 - vec2(radius));
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
    }
    vec3 sampleBackground(vec2 pixel) {
      return texture2D(background, clamp(pixel / viewport, vec2(0.0), vec2(1.0))).rgb;
    }
    void main() {
      vec2 p = uv * size;
      vec2 centered = p - size * 0.5;
      float distance = roundedBox(centered);
      vec2 gradient = vec2(
        roundedBox(centered + vec2(0.5, 0.0)) - roundedBox(centered - vec2(0.5, 0.0)),
        roundedBox(centered + vec2(0.0, 0.5)) - roundedBox(centered - vec2(0.0, 0.5))
      );
      vec2 normal = gradient / max(length(gradient), 0.001);
      float bevel = clamp(min(size.x, size.y) * 0.18, 18.0, 42.0);
      float edge = 1.0 - smoothstep(0.0, bevel, max(-distance, 0.0));
      // A convex bevel pulls samples inward, curving lines around rounded corners.
      // Mild magnification continues through the flat center of the lens.
      vec2 offset = -normal * strength * edge * (0.4 + 0.6 * edge)
                  - centered * (strength / 1100.0);
      vec2 source = origin + p + offset;
      vec2 dispersion = normal * edge * strength * 0.018;
      vec3 color = vec3(sampleBackground(source + dispersion).r,
                        sampleBackground(source).g,
                        sampleBackground(source - dispersion).b);
      float highlight = pow(max(dot(normal, normalize(vec2(-0.6, -0.8))), 0.0), 4.0);
      color = color * shade + highlight * edge * 0.055;
      gl_FragColor = vec4(color, 1.0);
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Glass lens shader could not compile.');
    }
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch { return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['background','viewport','origin','size','radius','strength','shade']
    .map(name => [name, gl.getUniformLocation(program, name)]));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(uniforms.background, 0);
  const limit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { alpha: false });
  if (!sourceContext) return;
  const wallpaperCanvas = document.createElement('canvas');
  const wallpaperContext = wallpaperCanvas.getContext('2d', { alpha: false });
  if (!wallpaperContext) return;
  const wallpaper = new Image();
  function updateWallpaper() {
    const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    wallpaper.src = new URL(`assets/glass-backdrop-green-${theme}.svg`, document.baseURI).href;
  }
  updateWallpaper();
  const researchPattern = new Image();
  researchPattern.src = new URL('assets/research-pattern-v2.webp', document.baseURI).href;
  const surfaces = new Map();
  const scene = document.querySelector('.scene');
  let pending = 0;
  let lost = false;
  let textureWidth = 0;
  let textureHeight = 0;
  let wallpaperDirty = true;
  let textureRevision = 0;
  const stats = { frames: 0, textureUploads: 0, surfaceCopies: 0, lastFrameMs: 0 };
  const debug = options.has('glassDebug');

  function schedule() {
    if (!pending && !lost && !document.hidden) pending = requestAnimationFrame(draw);
  }
  const resize = new ResizeObserver(schedule);
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const record = surfaces.get(entry.target);
      if (record) record.visible = entry.isIntersecting;
    });
    schedule();
  }, { rootMargin: '80px' });

  function attach() {
    for (const [surface, record] of surfaces) {
      if (surface.isConnected) continue;
      resize.unobserve(surface);
      visibility.unobserve(surface);
      record.canvas.remove();
      surfaces.delete(surface);
    }
    document.querySelectorAll('.glass-surface:not([data-glass-native])').forEach(surface => {
      if (surfaces.has(surface)) return;
      const canvas = document.createElement('canvas');
      canvas.className = 'glass-refraction';
      canvas.setAttribute('aria-hidden', 'true');
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;
      surface.prepend(canvas);
      surfaces.set(surface, { canvas, context, visible: true });
      resize.observe(surface);
      visibility.observe(surface);
    });
    schedule();
  }

  function paintWallpaper(width, height) {
    sourceContext.setTransform(1,0,0,1,0,0);
    sourceContext.globalAlpha = 1;
    sourceContext.globalCompositeOperation = 'source-over';
    sourceContext.fillStyle = '#282851';
    sourceContext.fillRect(0,0,width,height);
    if (scene) {
      const r = scene.getBoundingClientRect();
      sourceContext.drawImage(wallpaper, r.left, r.top, r.width, r.height);
      // The static reference heading is also behind its overlapping controls.
      const heading = scene.querySelector('h1');
      if (heading) {
        const style = getComputedStyle(heading);
        const rect = heading.getBoundingClientRect();
        const scale = r.width / scene.offsetWidth;
        sourceContext.save();
        sourceContext.translate(rect.left, rect.top);
        sourceContext.scale(scale, scale);
        sourceContext.fillStyle = style.color;
        sourceContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        sourceContext.textBaseline = 'top';
        let line = '', y = 0;
        for (const word of heading.textContent.trim().split(/\s+/)) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && sourceContext.measureText(candidate).width > heading.clientWidth) {
            sourceContext.fillText(line, 0, y);
            y += parseFloat(style.lineHeight);
            line = word;
          } else line = candidate;
        }
        sourceContext.fillText(line, 0, y);
        sourceContext.restore();
      }
    } else {
      // Cache the fixed color field and technical artwork together. The page
      // scroll only changes which part each glass tile samples, not the source.
      if (wallpaperCanvas.width !== width || wallpaperCanvas.height !== height || wallpaperDirty) {
        wallpaperCanvas.width = width;
        wallpaperCanvas.height = height;
        wallpaperContext.fillStyle = '#282851';
        wallpaperContext.fillRect(0,0,width,height);
        const scale = Math.max(width / wallpaper.naturalWidth, height / wallpaper.naturalHeight);
        const w = wallpaper.naturalWidth * scale;
        const h = wallpaper.naturalHeight * scale;
        wallpaperContext.drawImage(wallpaper, (width-w)/2, 0, w, h);
        if (researchPattern.complete && researchPattern.naturalWidth) {
          const patternScale = Math.max(width / researchPattern.naturalWidth, height / researchPattern.naturalHeight);
          const patternWidth = researchPattern.naturalWidth * patternScale;
          const patternHeight = researchPattern.naturalHeight * patternScale;
          wallpaperContext.save();
          wallpaperContext.globalCompositeOperation = 'screen';
          wallpaperContext.globalAlpha = width < 560 ? .54 : .58;
          wallpaperContext.filter = 'saturate(1.12) contrast(1.12)';
          wallpaperContext.drawImage(
            researchPattern,
            (width-patternWidth)/2,
            (height-patternHeight)/2,
            patternWidth,
            patternHeight
          );
          wallpaperContext.restore();
        }
        wallpaperDirty = false;
      }
      sourceContext.drawImage(wallpaperCanvas,0,0);
    }
  }

  function draw() {
    pending = 0;
    if (lost || !wallpaper.complete || !wallpaper.naturalWidth || document.hidden) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width > limit || height > limit) return;
    if (sourceCanvas.width !== width || sourceCanvas.height !== height) {
      sourceCanvas.width = width;
      sourceCanvas.height = height;
    }
    const frameStart = debug ? performance.now() : 0;
    const upload = wallpaperDirty || textureWidth !== width || textureHeight !== height || Boolean(scene);
    if (upload) {
      paintWallpaper(width, height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (textureWidth !== width || textureHeight !== height) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
        textureWidth = width;
        textureHeight = height;
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
      }
      textureRevision++;
      stats.textureUploads++;
    }
    gl.uniform2f(uniforms.viewport, width, height);
    gl.uniform1f(uniforms.shade, document.documentElement.dataset.theme === 'dark' ? .94 : 1);
    const visible = [];
    for (const [surface, record] of surfaces) {
      if (!record.visible) continue;
      const rect = surface.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width || !rect.width || !rect.height) continue;
      // Scaled reference tiles and mobile controls retain their lens proportions.
      const scale = rect.width / surface.clientWidth;
      const r = getComputedStyle(surface).borderTopLeftRadius;
      const radius = r.endsWith('%') ? parseFloat(r)/100 * Math.min(rect.width, rect.height) : parseFloat(r)*scale;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25, limit/rect.width, limit/rect.height);
      const w = Math.max(1, Math.round(rect.width * ratio));
      const h = Math.max(1, Math.round(rect.height * ratio));
      const signature = [rect.left.toFixed(1), rect.top.toFixed(1), w, h, radius, textureRevision, document.documentElement.dataset.theme].join(',');
      if (signature === record.signature && record.canvas.isConnected) continue;
      visible.push({ surface, record, rect, radius, w, h, signature });
    }
    if (!visible.length) return;
    const requiredWidth = Math.max(...visible.map(item => item.w));
    const requiredHeight = Math.max(...visible.map(item => item.h));
    if (output.width < requiredWidth || output.height < requiredHeight) {
      output.width = Math.max(output.width, requiredWidth);
      output.height = Math.max(output.height, requiredHeight);
    }
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const { surface, record, rect, radius, w, h, signature } of visible) {
      // Reuse one drawing buffer for every surface. The old path resized this
      // canvas for every tile on every frame, forcing repeated GPU allocations.
      gl.viewport(0,output.height-h,w,h);
      gl.uniform2f(uniforms.origin, rect.left, rect.top);
      gl.uniform2f(uniforms.size, rect.width, rect.height);
      gl.uniform1f(uniforms.radius, Math.min(radius,rect.width/2,rect.height/2));
      gl.uniform1f(uniforms.strength, flat ? 0 : Math.min(24, Math.min(rect.width,rect.height)*.15));
      gl.drawArrays(gl.TRIANGLES,0,6);
      if (record.canvas.width !== w || record.canvas.height !== h) {
        record.canvas.width = w;
        record.canvas.height = h;
      }
      record.context.drawImage(output,0,0,w,h,0,0,w,h);
      record.signature = signature;
      stats.surfaceCopies++;
      if (surface.dataset.refractionReady !== 'true') {
        surface.dataset.refractionReady = 'true';
        surface.dispatchEvent(new Event('glass-refraction-ready'));
      }
    }
    document.documentElement.dataset.refraction = flat ? 'flat' : 'active';
    stats.frames++;
    if (debug) {
      stats.lastFrameMs = Math.round((performance.now() - frameStart) * 10) / 10;
      document.documentElement.dataset.glassStats = JSON.stringify(stats);
    }
  }

  output.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    document.documentElement.dataset.refraction = 'fallback';
    for (const [surface, record] of surfaces) {
      record.canvas.remove();
      delete surface.dataset.refractionReady;
      surface.dispatchEvent(new Event('glass-refraction-ready'));
    }
  });
  wallpaper.addEventListener('load', () => { wallpaperDirty = true; schedule(); });
  researchPattern.addEventListener('load', () => { wallpaperDirty = true; schedule(); });
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', schedule, { passive:true });
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('glass-layout-change', schedule);
  document.fonts?.ready.then(schedule);
  new MutationObserver(() => {
    updateWallpaper();
    wallpaperDirty = true;
    schedule();
  }).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  const list = document.querySelector('#articleList');
  if (list) new MutationObserver(attach).observe(list, { childList:true });
  attach();
})();
