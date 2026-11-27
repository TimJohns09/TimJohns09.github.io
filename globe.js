(() => {
  const figure = document.querySelector('.globe-figure');
  const canvas = figure.querySelector('.globe-view');
  const poster = figure.querySelector('.globe-poster');
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
    uniform float yaw, pitch, pale;
    const float PI = 3.14159265;
    void main() {
      vec2 p = (gl_FragCoord.xy - size * .5) / (size.y * .44);
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

  const size = [180, 110];
  canvas.width = size[0];
  canvas.height = size[1];
  let yaw = -.53;
  let pitch = .36;
  let program, angles, frame, drag, texturePixels, framePixels;
  const land = new Image();
  const pinLayer = figure.querySelector('.globe-pins');
  const pins = [...figure.querySelectorAll('.globe-posts a')].map(link => {
    const marker = document.createElement('a');
    marker.href = link.getAttribute('href');
    marker.className = 'globe-pin';
    marker.title = link.getAttribute('aria-label');
    marker.setAttribute('aria-label', marker.title);
    marker.tabIndex = -1; // The location links expose the same destinations by keyboard.
    marker.hidden = true;
    pinLayer.append(marker);
    return { marker, latitude: Number(link.dataset.lat) * Math.PI / 180,
      longitude: Number(link.dataset.lon) * Math.PI / 180 };
  });

  function placePins() {
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    for (const { marker, latitude, longitude } of pins) {
      const x = Math.cos(latitude) * Math.sin(longitude - yaw);
      const north = Math.sin(latitude);
      const forward = Math.cos(latitude) * Math.cos(longitude - yaw);
      const y = north * cosPitch - forward * sinPitch;
      const depth = north * sinPitch + forward * cosPitch;
      marker.hidden = depth < .12;
      if (marker.hidden) continue;
      marker.style.left = (50 + x * 44 * size[1] / size[0]) + '%';
      marker.style.top = (50 - y * 44) + '%';
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
    angles = ['yaw', 'pitch', 'pale'].map(name => gl.getUniformLocation(program, name));

    showGlobe();
  }

  function showGlobe() {
    canvas.hidden = false;
    canvas.tabIndex = 0;
    poster.hidden = true;
    draw();
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
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    placePins();
  }

  // Keep the same projection and interaction when WebGL is unavailable.
  function drawFlat() {
    const [width, height] = size;
    const pixels = framePixels.data;
    const radius = height * .44;
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

  canvas.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const scale = 4 / canvas.clientWidth;
    rotate((drag.x - event.clientX) * scale, (event.clientY - drag.y) * scale);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  canvas.addEventListener('contextmenu', event => { if (drag) event.preventDefault(); });
  const keys = { ArrowLeft: [.16, 0], ArrowRight: [-.16, 0], ArrowUp: [0, -.16], ArrowDown: [0, .16] };
  canvas.addEventListener('keydown', event => {
    if (!Object.hasOwn(keys, event.key)) return;
    event.preventDefault();
    rotate(...keys[event.key]);
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    program = null;
    canvas.hidden = true;
    poster.hidden = false;
    for (const { marker } of pins) marker.hidden = true;
    drag = null;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    if (land.naturalWidth) initialize();
  });
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  land.onload = initialize;
  // The land mask uses Natural Earth 1:110m public-domain boundaries.
  land.src = 'assets/earth-land.png';
})();
