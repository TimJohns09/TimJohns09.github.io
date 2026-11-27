(() => {
  const figure = document.querySelector('.globe-figure');
  const canvas = figure.querySelector('.globe-view');
  const poster = figure.querySelector('.globe-poster');
  const stage = figure.querySelector('.globe-stage');
  const size = [180, 110];

  function syncPixelSize() {
    const step = stage.getBoundingClientRect().width / size[0];
    if (step > 0) document.documentElement.style.setProperty('--globe-pixel', step + 'px');
  }
  syncPixelSize();
  if ('ResizeObserver' in window) new ResizeObserver(syncPixelSize).observe(stage);
  else window.addEventListener('resize', syncPixelSize);
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false });
  const flat = gl ? null : canvas.getContext('2d');
  if (!gl && !flat) return;

  const vertex = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragment = `
    precision mediump float;
    uniform sampler2D land;
    uniform vec2 size;
    uniform float yaw, pitch, pale, zoom;
    const float PI = 3.14159265;
    void main() {
      vec2 p = (gl_FragCoord.xy - size * .5) / (size.y * .44 * zoom);
      float d = dot(p, p);
      if (d > 1.0) discard;
      vec3 normal = vec3(p, sqrt(1.0 - d));
      float latitude = asin(clamp(normal.y * cos(pitch) + normal.z * sin(pitch), -1.0, 1.0));
      float longitude = atan(normal.x, normal.z * cos(pitch) - normal.y * sin(pitch)) + yaw;
      vec2 map = vec2(fract(longitude / (2.0 * PI) + .5), .5 - latitude / PI);
      float continent = step(.5, texture2D(land, map).r);
      float diffuse = max(0.0, dot(normal, normalize(vec3(-.48,.54,.72))));
      float checker = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0);
      float tone = floor(diffuse * 6.0 + checker * .52) / 6.0;
      vec3 sea = mix(vec3(.035,.10,.086), vec3(.10,.26,.22), tone);
      vec3 ground = mix(vec3(.13,.35,.27), vec3(.71,.96,.78), tone);
      float grid = 1.0 - step(.019, min(abs(sin(longitude * 6.0)), abs(sin(latitude * 6.0))));
      vec3 color = mix(sea, ground, continent);
      color = mix(color, vec3(.53,.84,.65), grid * .24 * normal.z);
      float rim = 1.0 - smoothstep(.1,.27,normal.z);
      color = mix(color, vec3(.45,.86,.67), rim * (.45 + .4 * diffuse));
      gl_FragColor = vec4(color * mix(1.0,.88,pale), 1.0);
    }
  `;

  canvas.width = size[0];
  canvas.height = size[1];
  let yaw = -Math.PI / 2;
  let pitch = .58;
  let zoom = 1;
  const maxZoom = 3.5;
  const zoomControls = figure.querySelector('.globe-zoom');
  const zoomButtons = [...zoomControls.querySelectorAll('button')];
  const coordinates = figure.querySelector('.globe-coordinates');
  const scaleDisplay = figure.querySelector('.globe-scale');
  let program, angles, frame, texturePixels, framePixels;
  const land = new Image();
  const pinLayer = figure.querySelector('.globe-pins');
  const pins = [...figure.querySelectorAll('.globe-locations button')].map(button => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'globe-pin';
    marker.title = button.textContent + ', ' + button.dataset.region;
    marker.setAttribute('aria-label', marker.title);
    marker.tabIndex = -1; // The location buttons provide keyboard access.
    marker.hidden = true;
    pinLayer.append(marker);
    const pin = { button, marker, latitude: Number(button.dataset.lat) * Math.PI / 180,
      longitude: Number(button.dataset.lon) * Math.PI / 180 };
    button.addEventListener('click', () => focusPin(pin));
    marker.addEventListener('click', () => focusPin(pin));
    return pin;
  });

  function focusPin(pin) {
    yaw = pin.longitude;
    pitch = pin.latitude;
    for (const { button, marker } of pins) {
      const selected = button === pin.button;
      button.setAttribute('aria-pressed', String(selected));
      marker.classList.toggle('active', selected);
    }
    const { lat, lon } = pin.button.dataset;
    coordinates.textContent = `${pin.marker.title} · ${Number(lat).toFixed(2)}° N, ${Math.abs(Number(lon)).toFixed(2)}° W`;
    setZoom(Math.max(zoom, 2.2));
  }

  function setZoom(value) {
    zoom = Math.max(1, Math.min(maxZoom, value));
    const label = zoom.toFixed(1).replace(/\.0$/, '') + '×';
    if (scaleDisplay.value !== label) scaleDisplay.value = label;
    zoomButtons[0].disabled = zoom <= 1;
    zoomButtons[1].disabled = zoom >= maxZoom;
    refresh();
  }
  for (const button of zoomButtons) {
    button.addEventListener('click', () => setZoom(zoom * (Number(button.dataset.zoom) > 0 ? 1.25 : .8)));
  }

  function placePins() {
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    for (const { marker, latitude, longitude } of pins) {
      const x = Math.cos(latitude) * Math.sin(longitude - yaw);
      const north = Math.sin(latitude);
      const forward = Math.cos(latitude) * Math.cos(longitude - yaw);
      const y = north * cosPitch - forward * sinPitch;
      const depth = north * sinPitch + forward * cosPitch;
      const left = 50 + x * 44 * zoom * size[1] / size[0];
      const top = 50 - y * 44 * zoom;
      marker.hidden = depth < .12 || left < 2 || left > 98 || top < 2 || top > 98;
      if (marker.hidden) continue;
      marker.style.left = left + '%';
      marker.style.top = top + '%';
    }
  }

  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (gl.getShaderParameter(item, gl.COMPILE_STATUS)) return item;
    gl.deleteShader(item);
    return null;
  }

  function initialize() {
    if (flat) {
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = land.naturalWidth;
      textureCanvas.height = land.naturalHeight;
      const textureContext = textureCanvas.getContext('2d');
      textureContext.drawImage(land, 0, 0);
      texturePixels = textureContext.getImageData(0, 0, land.naturalWidth, land.naturalHeight).data;
      framePixels = flat.createImageData(...size);
      showGlobe();
      return;
    }

    const vs = shader(gl.VERTEX_SHADER, vertex);
    const fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return;
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { program = null; return; }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, land);
    gl.uniform1i(gl.getUniformLocation(program, 'land'), 0);
    gl.uniform2f(gl.getUniformLocation(program, 'size'), ...size);
    gl.viewport(0, 0, ...size);
    angles = ['yaw', 'pitch', 'pale', 'zoom'].map(name => gl.getUniformLocation(program, name));

    showGlobe();
  }

  function showGlobe() {
    canvas.hidden = false;
    canvas.tabIndex = 0;
    poster.hidden = true;
    zoomControls.hidden = false;
    for (const { button } of pins) button.hidden = false;
    setZoom(zoom);
  }

  function draw() {
    frame = 0;
    if (flat) {
      if (texturePixels) { drawFlat(); placePins(); }
      return;
    }
    if (!program || gl.isContextLost()) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(angles[0], yaw);
    gl.uniform1f(angles[1], pitch);
    gl.uniform1f(angles[2], document.documentElement.dataset.theme === 'light' ? 1 : 0);
    gl.uniform1f(angles[3], zoom);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    placePins();
  }

  // Keep the same projection and interaction when WebGL is unavailable.
  function drawFlat() {
    const [width, height] = size;
    const pixels = framePixels.data;
    const radius = height * .44 * zoom;
    pixels.fill(0);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const lightTheme = document.documentElement.dataset.theme === 'light' ? .88 : 1;
    for (let row = 0; row < height; row++) {
      const y = (height / 2 - row - .5) / radius;
      for (let col = 0; col < width; col++) {
        const x = (col + .5 - width / 2) / radius;
        const distance = x*x + y*y;
        if (distance > 1) continue;
        const z = Math.sqrt(1 - distance);
        const lat = Math.asin(Math.max(-1, Math.min(1, y*cosPitch + z*sinPitch)));
        const lon = Math.atan2(x, z*cosPitch - y*sinPitch) + yaw;
        const meridian = lon / (2*Math.PI) + .5;
        const u = Math.floor((meridian - Math.floor(meridian)) * land.naturalWidth);
        const v = Math.min(land.naturalHeight - 1, Math.floor((.5 - lat / Math.PI) * land.naturalHeight));
        const ground = texturePixels[(v*land.naturalWidth + u)*4] > 127;
        const diffuse = Math.max(0, -.47*x + .53*y + .71*z);
        const tone = Math.floor(diffuse*6 + ((row + col) % 2)*.52) / 6;
        const rim = Math.max(0, Math.min(1, (.27-z)/.17)) * (.45 + .4*diffuse);
        const grid = Math.min(Math.abs(Math.sin(lon*6)), Math.abs(Math.sin(lat*6))) < .019 ? .24*z : 0;
        const index = (row*width + col)*4;
        const red = ground ? .13 + .58*tone : .035 + .065*tone;
        const green = ground ? .35 + .61*tone : .10 + .16*tone;
        const blue = ground ? .27 + .51*tone : .086 + .134*tone;
        pixels[index] = ((red + (.53-red)*grid)*(1-rim) + .45*rim)*255*lightTheme;
        pixels[index+1] = ((green + (.84-green)*grid)*(1-rim) + .86*rim)*255*lightTheme;
        pixels[index+2] = ((blue + (.65-blue)*grid)*(1-rim) + .67*rim)*255*lightTheme;
        pixels[index+3] = 255;
      }
    }
    flat.putImageData(framePixels, 0, 0);
  }

  function refresh() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function rotate(horizontal, vertical) {
    yaw = (yaw + horizontal) % (2 * Math.PI);
    pitch = Math.max(-1.48, Math.min(1.48, pitch + vertical));
    refresh();
  }

  const pointers = new Map();
  function pinchDistance() {
    const [first, second] = pointers.values();
    return Math.hypot(first.x - second.x, first.y - second.y);
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const distance = pointers.size === 2 ? pinchDistance() : 0;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (distance > 0) { setZoom(zoom * pinchDistance() / distance); return; }
    const scale = 4 / (canvas.clientWidth * zoom);
    rotate((previous.x - event.clientX) * scale, (event.clientY - previous.y) * scale);
  });
  canvas.addEventListener('lostpointercapture', event => { pointers.delete(event.pointerId); });
  canvas.addEventListener('contextmenu', event => { if (pointers.size) event.preventDefault(); });
  canvas.addEventListener('wheel', event => {
    if (document.activeElement !== canvas || event.ctrlKey) return;
    event.preventDefault();
    if (event.deltaY) setZoom(zoom * (event.deltaY < 0 ? 1.12 : 1/1.12));
  }, { passive: false });
  const keys = { ArrowLeft: [.16, 0], ArrowRight: [-.16, 0], ArrowUp: [0, -.16], ArrowDown: [0, .16] };
  canvas.addEventListener('keydown', event => {
    if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault();
      setZoom(zoom * (event.key === '-' ? .8 : 1.25));
    } else if (Object.hasOwn(keys, event.key)) {
      event.preventDefault();
      rotate(...keys[event.key].map(step => step / zoom));
    }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    program = null;
    canvas.hidden = true;
    poster.hidden = false;
    for (const { marker } of pins) marker.hidden = true;
    pointers.clear();
    zoomControls.hidden = true;
    coordinates.textContent = '';
    for (const { button } of pins) button.hidden = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    if (land.naturalWidth) initialize();
  });
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  land.onload = initialize;
  // The land mask uses Natural Earth 1:110m public-domain boundaries.
  land.src = 'assets/earth-land.png';
})();
