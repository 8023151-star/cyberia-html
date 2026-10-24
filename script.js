const filters = document.querySelectorAll('.filters button');
const cards = [...document.querySelectorAll('.game')];
const search = document.querySelector('#search');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
let category = 'all';

function updateGames() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !((category === 'all' || card.dataset.category === category) && card.dataset.name.toLowerCase().includes(query));
    if (!card.hidden) visible++;
  });
  count.textContent = visible;
  empty.hidden = visible !== 0;
}

filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  updateGames();
}));
search.addEventListener('input', updateGames);

const currentVersion = window.CYBERIA_VERSION || 'Unavailable';
const welcome = document.querySelector('#welcome');
const site = document.querySelector('#site');
const versionPanel = document.querySelector('#version-panel');
const installedVersion = document.querySelector('#installed-version');
const availableVersion = document.querySelector('#available-version');
const versionResult = document.querySelector('#version-result');
const checkButton = document.querySelector('#check-updates');
installedVersion.textContent = currentVersion;

document.querySelector('#enter-site').addEventListener('click', () => {
  welcome.hidden = true;
  site.inert = false;
  document.body.classList.remove('welcome-open');
  site.querySelector('.site-header a')?.focus();
});

document.querySelector('#download-link').addEventListener('click', () => {
  document.querySelector('#download-panel').hidden = false;
});

function compareVersions(left, right) {
  const parse = version => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid version number. Use a number like 0.0.2.');
    return version.split('.').map(Number);
  };
  const a = parse(left);
  const b = parse(right);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return Math.sign(a[i] - b[i]);
  }
  return 0;
}

checkButton.addEventListener('click', async () => {
  versionPanel.hidden = false;
  availableVersion.textContent = 'Checking…';
  versionResult.textContent = 'Connecting to GitHub…';
  checkButton.disabled = true;
  try {
    const response = await fetch('https://api.github.com/repos/8023151-star/cyberia-html/contents/version.js?ref=main', { cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 404 ? 'The GitHub version.js file was not found. Upload the site to GitHub first.' : `GitHub returned ${response.status}.`);
    const file = await response.json();
    if (file.encoding !== 'base64' || !file.content) throw new Error('GitHub did not return the version file.');
    const source = atob(file.content.replace(/\s/g, ''));
    const match = source.match(/^\s*window\.CYBERIA_VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]\s*;?\s*$/m);
    if (!match) throw new Error('GitHub version.js needs a line like window.CYBERIA_VERSION = "0.0.2";');
    const latest = match[1];
    const comparison = compareVersions(latest, currentVersion);
    availableVersion.textContent = latest;
    versionResult.textContent = comparison > 0
      ? 'A newer version is available. Use Download / instructions to get it.'
      : comparison === 0
        ? 'You have the latest version.'
        : 'Your installed copy is newer than the version on GitHub.';
  } catch (error) {
    availableVersion.textContent = 'Unavailable';
    versionResult.textContent = error instanceof TypeError
      ? 'Could not reach GitHub. Connect to the internet and try again.'
      : error.message;
  } finally {
    checkButton.disabled = false;
  }
});
