const preview = document.querySelector('.browser-preview');
if (preview) {
  const wallpaper = document.getElementById('wallpaperToggle');
  const comfort = document.getElementById('comfortToggle');
  const sidebar = document.getElementById('sidebarToggle');
  const theme = document.getElementById('themeToggle');
  const status = document.getElementById('demoStatus');
  const names = { mist: 'Mist', dusk: 'Dusk', paper: 'Paper' };
  function update() {
    const preset = document.querySelector('input[name="demoPreset"]:checked').value;
    preview.style.setProperty('--demo-image', `url("./assets/${preset}.svg")`);
    preview.dataset.wallpaper = String(wallpaper.checked);
    preview.dataset.comfort = String(comfort.checked);
    status.textContent = `${names[preset]} · wallpaper ${wallpaper.checked ? 'on' : 'paused'}`;
  }
  wallpaper.addEventListener('change', update);
  comfort.addEventListener('change', update);
  document.querySelectorAll('input[name="demoPreset"]').forEach(input => input.addEventListener('change', update));
  sidebar.addEventListener('click', () => {
    const open = preview.dataset.sidebar !== 'open';
    preview.dataset.sidebar = open ? 'open' : 'compact';
    sidebar.setAttribute('aria-expanded', String(open));
  });
  theme.addEventListener('click', () => {
    const dark = preview.dataset.theme !== 'dark';
    preview.dataset.theme = dark ? 'dark' : 'light';
    theme.textContent = dark ? 'Use light preview' : 'Use dark preview';
  });
  update();
}
