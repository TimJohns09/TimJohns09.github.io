(() => {
  const scene = document.querySelector('.crt-scene');
  const cabinet = scene.querySelector('.crt-cabinet');
  const screen = scene.querySelector('.crt-screen');
  const win = screen.querySelector('.crt-window');
  const launch = scene.querySelector('.crt-launch');
  const reset = document.querySelector('.case-reset');
  let yaw = -16, pitch = -5;
  function rotate(y, p) {
    yaw = y % 360; pitch = p % 360;
    screen.style.setProperty('--reflection-x', (24 + 36 * Math.sin(yaw * Math.PI / 180)) + '%');
    cabinet.style.setProperty('--yaw', yaw + 'deg');
    cabinet.style.setProperty('--pitch', pitch + 'deg');
    reset.hidden = yaw === 0 && pitch === 0;
  }
  function show(open) {
    if (open) rotate(0,0);
    win.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    (open ? win.querySelector('.crt-close') : launch).focus({preventScroll:true});
  }
  launch.onclick = () => show(win.hidden);
  win.querySelector('.crt-close').onclick = () => show(false);
  win.addEventListener('keydown', e => { if(e.key === 'Escape') show(false); });
  cabinet.addEventListener('keydown', event => {
    if (event.target !== cabinet) return;
    const turns = {ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,15],ArrowDown:[0,-15],Home:[-yaw,-pitch]};
    const turn = turns[event.key];
    if (turn) { event.preventDefault(); rotate(yaw+turn[0],pitch+turn[1]); }
  });
  reset.onclick = () => rotate(0,0);
  function openLink(hash) {
    if (!['#about','#terminal','#contact'].includes(hash)) return;
    show(true);
    if(hash === '#contact') win.querySelector('[data-tab="contact"]').click();
    scene.scrollIntoView({block:'center'});
  }
  document.addEventListener('click',e => {
    const a = e.target.closest('a[href^="#"]');
    if(a) openLink(a.hash);
  });
  window.addEventListener('hashchange',()=>openLink(location.hash));
  if(location.hash) openLink(location.hash);
  cabinet.addEventListener('pointerdown', e => {
    if(!e.isPrimary || e.button !== 0 || e.target.closest('button,a')) return;
    const movingWindow = e.target.closest('.terminal-titlebar');
    if(!movingWindow && e.target.closest('.crt-screen')) return;
    const x = e.clientX, y = e.clientY, initialYaw = yaw, initialPitch = pitch;
    const left = win.offsetLeft, top = win.offsetTop;
    cabinet.setPointerCapture(e.pointerId);
    function move(event) {
      if(event.pointerId !== e.pointerId) return;
      const dx = event.clientX-x, dy = event.clientY-y;
      if(movingWindow) {
        const scale = screen.clientWidth / screen.getBoundingClientRect().width;
        win.style.left = Math.max(0,Math.min(screen.clientWidth-win.offsetWidth,left+dx*scale))+'px';
        win.style.top = Math.max(0,Math.min(screen.clientHeight-win.offsetHeight,top+dy*scale))+'px';
      } else rotate(initialYaw+dx*.55,initialPitch-dy*.55);
    }
    cabinet.addEventListener('pointermove',move);
    cabinet.addEventListener('lostpointercapture',()=>cabinet.removeEventListener('pointermove',move),{once:true});
  });
  new ResizeObserver(()=>{win.style.left=''; win.style.top='';}).observe(screen);
})();