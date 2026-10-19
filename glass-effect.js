/* Rebuild the supplied SVG effect at each element's actual pixel dimensions.
   Only the faint texture is displaced. Text and the backdrop are not displaced. */
(() => {
  const namespace = 'http://www.w3.org/2000/svg';
  const records = new WeakMap();
  let nextId = 0;

  function render(surface) {
    const record = records.get(surface);
    if (!record) return;
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    if (!width || !height) return;
    const style = getComputedStyle(surface);
    const value = style.borderTopLeftRadius;
    const radius = Math.min(value.endsWith('%') ? parseFloat(value) / 100 * Math.min(width, height) : parseFloat(value) || 0, width / 2, height / 2);
    const signature = `${width},${height},${radius}`;
    if (record.signature === signature) return;
    record.signature = signature;
    const id = record.id;
    const innerW = Math.max(1, width - 10);
    const innerH = Math.max(1, height - 12);
    const innerR = Math.max(0, radius - 6);
    const rect = (attrs = '') => `<rect width="${width}" height="${height}" rx="${radius}" ${attrs}/>`;
    // The original ellipse extends beyond the inner pill and is clipped by it.
    const ellipse = `M${width * 1.264999} ${height * .504857}C${width * 1.264999} ${height * .955833} ${width * .953837} ${height * 1.321429} ${width * .57} ${height * 1.321429}C${width * .186163} ${height * 1.321429} ${-width * .125} ${height * .955833} ${-width * .125} ${height * .504857}C${-width * .125} ${height * .053881} ${width * .186163} ${-height * .321429} ${width * .57} ${-height * .321429}C${width * .953837} ${-height * .321429} ${width * 1.264999} ${height * .053881} ${width * 1.264999} ${height * .504857}Z`;
    const backdrop = (blur, clip, x, y, w, h) => `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;backdrop-filter:blur(${blur}px);-webkit-backdrop-filter:blur(${blur}px);clip-path:url(#${clip})"></div></foreignObject>`;
    record.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    record.svg.innerHTML = `<defs>
      <clipPath id="${id}-outer">${rect()}</clipPath>
      <clipPath id="${id}-blur2" transform="translate(65 56)"><rect x="-33" y="-24" width="${width + 67}" height="${height + 48}"/></clipPath>
      <clipPath id="${id}-blur45" transform="translate(90 90)">${rect()}</clipPath>
      <clipPath id="${id}-blur4" transform="translate(${width * .156008} 35)"><path d="${ellipse}"/></clipPath>
      <mask id="${id}-half" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" style="mask-type:alpha">${rect('fill="#D9D9D9" fill-opacity=".5"')}</mask>
      <mask id="${id}-inset" maskUnits="userSpaceOnUse" x="5" y="6" width="${innerW}" height="${innerH}" style="mask-type:alpha"><rect x="5" y="6" width="${innerW}" height="${innerH}" rx="${innerR}" fill="#D9D9D9"/></mask>
      <filter id="${id}-texture" x="-65" y="-56" width="${width + 131}" height="${height + 112}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.011641443707048893 0.011641443707048893" numOctaves="3" seed="9055" result="textureNoise"/>
        <feDisplacementMap in="shape" in2="textureNoise" scale="64" xChannelSelector="R" yChannelSelector="G" result="displacedImage"/>
        <feMerge><feMergeNode in="displacedImage"/></feMerge>
      </filter>
      <filter id="${id}-edgeDark" x="-8" y="-8" width="${width+16}" height="${height+16}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="${id}-edgeLight" x="-3.5" y="-3.5" width="${width+7}" height="${height+7}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.5"/></filter>
      <linearGradient id="${id}-dark" x1="19.0477%" y1="9.5238%" x2="28.6271%" y2="132.0464%"><stop stop-opacity=".8"/><stop offset=".5" stop-opacity=".2"/><stop offset="1" stop-opacity=".8"/></linearGradient>
      <linearGradient id="${id}-light" x1="5.6202%" y1="14.881%" x2="28.2306%" y2="175.4226%"><stop stop-color="white" stop-opacity=".8"/><stop offset=".349749" stop-color="white" stop-opacity=".05"/><stop offset=".765731" stop-color="white" stop-opacity=".05"/><stop offset="1" stop-color="white" stop-opacity=".8"/></linearGradient>
      <linearGradient id="${id}-crisp" x1="50%" y1="0%" x2="50%" y2="100%"><stop stop-color="white" stop-opacity=".4"/><stop offset="1" stop-color="white" stop-opacity=".32"/></linearGradient>
    </defs>
    <g clip-path="url(#${id}-outer)">
      ${rect('fill="white" fill-opacity=".01"')}
      ${backdrop(2, `${id}-blur2`, -65, -56, width+131, height+112)}
      <g filter="url(#${id}-texture)"><rect x="-33" y="-24" width="${width+67}" height="${height+48}" fill="white" fill-opacity=".01"/></g>
      <g mask="url(#${id}-half)">
        ${backdrop(45, `${id}-blur45`, -90, -90, width+180, height+180)}
        ${rect('fill="#545454" fill-opacity=".1"')}
        <g mask="url(#${id}-inset)">
          ${backdrop(4, `${id}-blur4`, -width*.156008, -35, width*1.452015, height+70)}
          <path d="${ellipse}" fill="black" fill-opacity=".1" style="mix-blend-mode:overlay"/>
        </g>
        <g filter="url(#${id}-edgeDark)" style="mix-blend-mode:multiply"><rect x=".5" y=".5" width="${width-1}" height="${height-1}" rx="${Math.max(0,radius-.5)}" fill="none" stroke="url(#${id}-dark)" stroke-opacity=".5"/></g>
        <g filter="url(#${id}-edgeLight)" style="mix-blend-mode:plus-lighter">${rect(`fill="none" stroke="url(#${id}-light)"`)}</g>
        <g filter="url(#${id}-edgeLight)" style="mix-blend-mode:plus-lighter">${rect('fill="none" stroke="white" stroke-opacity=".2"')}</g>
      </g>
      <rect x=".5" y=".5" width="${width-1}" height="${height-1}" rx="${Math.max(0,radius-.5)}" fill="none" stroke="url(#${id}-crisp)" stroke-opacity=".5"/>
    </g>`;
  }

  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => render(target)));
  function attach() {
    document.querySelectorAll('.glass-surface:not([data-glass-ready])').forEach(surface => {
      const svg = document.createElementNS(namespace, 'svg');
      svg.classList.add('glass-effect');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      surface.prepend(svg);
      surface.dataset.glassReady = 'true';
      records.set(surface, { svg, id: `exported-glass-${++nextId}` });
      resize.observe(surface);
      render(surface);
    });
  }
  attach();
  // Reports are replaced by the existing search/filter renderer.
  const articleList = document.querySelector('#articleList');
  if (articleList) new MutationObserver(changes => {
    changes.forEach(change => change.removedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches('.glass-surface')) resize.unobserve(node);
      node.querySelectorAll('.glass-surface').forEach(surface => resize.unobserve(surface));
    }));
    attach();
  }).observe(articleList, { childList: true });
  // Theme changes and breakpoints can alter border radii without a size change.
  new MutationObserver(() => document.querySelectorAll('[data-glass-ready]').forEach(render))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
