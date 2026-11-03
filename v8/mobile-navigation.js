/* Mobile-only navigation; desktop navigation and shop data remain unchanged. */
(() => {
  const shell = document.getElementById('appShell');
  const nav = shell?.querySelector('nav');
  if (!shell || !nav) return;
  nav.id = 'nsmMobileNav';
  nav.setAttribute('aria-label', 'Shop sections');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'nsmMenuToggle';
  toggle.className = 'alt';
  toggle.setAttribute('aria-controls', 'nsmMobileNav');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.innerHTML = '<span aria-hidden="true">☰</span> <span>Menu</span>';
  const toggleRow = document.createElement('div');
  toggleRow.id = 'nsmMenuToggleRow';
  toggleRow.appendChild(toggle);
  const pageTitle = document.createElement('div');
  pageTitle.id = 'nsmCurrentPageTitle';
  pageTitle.setAttribute('role', 'heading');
  pageTitle.setAttribute('aria-level', '2');
  pageTitle.style.cssText = 'display:none;text-align:center;color:#55e5ff;font-weight:800;font-size:14px;letter-spacing:.16em;text-transform:uppercase;text-shadow:0 0 12px #24cfff66;margin:10px 0 2px;overflow-wrap:anywhere;';
  nav.before(pageTitle);
  function updatePageTitle() {
    const active = shell.querySelector('.tab:not(.hidden)');
    const names = {dashboard:'Overview',customers:'Customers',orders:'Orders',products:'Products',materials:'Materials',settings:'Settings',productionStepsPage:'Production Steps'};
    let label = names[active?.id] || 'Overview';
    if (active?.id === 'orders') {
      const tools = document.getElementById('orderTools');
      if (tools && !tools.classList.contains('hidden')) {
        const order = window.state?.orders?.find?.(o => o.id === document.getElementById('orderToolsId')?.value);
        label = (document.getElementById('orderToolsHeading')?.textContent || 'Edit Order') + (order?.orderNumber ? ' — ' + order.orderNumber : '');
      } else if (document.getElementById('orderArchiveView')?.value === 'completed') {
        label = 'Completed Orders';
      }
    }
    pageTitle.textContent = label;
    pageTitle.style.display = window.matchMedia('(max-width: 700px)').matches ? 'block' : 'none';
  }
  const titleObserver = new MutationObserver(updatePageTitle);
  shell.querySelectorAll('.tab').forEach(el => titleObserver.observe(el, {attributes:true,attributeFilter:['class']}));
  const orderTools = document.getElementById('orderTools');
  if (orderTools) titleObserver.observe(orderTools, {attributes:true,attributeFilter:['class']});
  shell.addEventListener('click', () => setTimeout(updatePageTitle, 0));
  window.addEventListener('popstate', updatePageTitle);
  window.matchMedia('(max-width: 700px)').addEventListener('change', updatePageTitle);
  updatePageTitle();
  nav.before(toggleRow);
  const shade = document.createElement('div');
  shade.id = 'nsmMenuShade';
  shade.setAttribute('aria-hidden', 'true');
  nav.after(shade);
  const mobile = window.matchMedia('(max-width: 700px)');
  function closeMenu(restoreFocus = false) {
    const wasOpen = shell.classList.contains('nsm-menu-open');
    shell.classList.remove('nsm-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus && wasOpen) toggle.focus();
  }
  function openMenu() {
    shell.classList.add('nsm-menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    nav.querySelector('button.active,button')?.focus();
  }
  toggle.addEventListener('click', () => shell.classList.contains('nsm-menu-open') ? closeMenu(true) : openMenu());
  shade.addEventListener('click', () => closeMenu(true));
  nav.addEventListener('click', event => {
    if (event.target.closest('button[data-tab]')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shell.classList.contains('nsm-menu-open')) closeMenu(true);
  });
  // Close on an intentional horizontal left swipe; vertical scrolling stays intact.
  let touchStart = null;
  nav.addEventListener('touchstart', event => {
    if (!mobile.matches || !shell.classList.contains('nsm-menu-open') || event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStart = {x:touch.clientX,y:touch.clientY};
  }, {passive:true});
  nav.addEventListener('touchend', event => {
    if (!touchStart || event.changedTouches.length !== 1) {touchStart=null;return;}
    const touch=event.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
    touchStart=null;
    if (dx < -65 && Math.abs(dx) > Math.abs(dy)*1.4) closeMenu(true);
  }, {passive:true});
  nav.addEventListener('touchcancel', () => {touchStart=null;}, {passive:true});
  mobile.addEventListener('change', () => closeMenu());
})();
