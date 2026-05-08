if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const ICONS = {
  moon: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  sun: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>',
  file: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5M12 15V3"></path></svg>',
  copy: '<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  chev: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></svg>'
};

const entries = [
  {
    kind: 'code',
    date: 'May 2026',
    tags: ['NETWORK'],
    title: 'Tor TCP Reset Censorship Demonstration',
    desc: 'For my Internet Freedom and Censorship final project, I built a lab simulation of how network censors can disrupt Tor by injecting forged TCP reset packets. China’s Great Firewall has historically blocked Tor through a mix of known relay blocking, traffic fingerprinting, active probing, and connection disruption. When traffic appears to be connecting to Tor infrastructure, a censor can interfere with the TCP session so the client and relay behave as if the connection was closed.\n\nI tested the project with two Ubuntu Server VMs. One VM was configured as the client, and the other was configured as a router. The client VM routed all of its traffic through the router VM, which ran this program and implemented the censorship logic. The program uses Scapy to sniff forwarded TCP traffic, checks for Tor-like indicators such as common relay ports and known relay IPs from a local list, then forges reverse-direction RST packets to tear down matching connections.\n\nThe goal was to make the mechanics of censorship visible in a controlled lab: observe traffic at a routing point, classify likely Tor connections, and inject reset packets to break the circuit. It is a small demonstration of how network-layer censorship can be implemented, and why censorship-resistant tools need to account for both blocking and active interference.',
    file: 'tor_rst.py',
    url: 'assets/tor_rst.py'
  },
  {
    kind: 'pdf',
    date: 'Apr 2026',
    tags: ['CRYPTOGRAPHY'],
    title: 'Bitcoin’s Quantum Divide',
    desc: 'A research paper examining how post-quantum cryptography, geopolitical standards bodies, and institutional custody could shape Bitcoin’s transition to quantum-resistant signatures.',
    file: 'Johns_Bitcoin_Quantum_Divide.pdf',
    url: 'assets/Johns_Bitcoin_Quantum_Divide.pdf'
  },
  {
    kind: 'pdf',
    date: 'Jan 16, 2026',
    tags: ['CRYPTOGRAPHY'],
    title: 'Understanding Merkle Roots',
    desc: 'A basic introduction to Merkle roots — how they work, why they matter in blockchain and distributed systems, and an intuitive breakdown of the underlying data structure.',
    file: 'Merkle_Root.pdf',
    url: 'assets/Merkle_Root.pdf'
  },
  {
    kind: 'pdf',
    date: 'Jan 2026',
    tags: ['NETWORK'],
    title: 'Privacy Node Build: Running Bitcoin, Monero, and Tor on a $264 Machine',
    desc: 'A build report documenting a low-cost privacy node architecture for running Bitcoin Core, a pruned Monero node, and a Tor Snowflake proxy on compact hardware.',
    file: 'node.pdf',
    url: 'assets/node.pdf'
  },
  {
    kind: 'pdf',
    date: 'Jan 2026',
    tags: ['MALWARE', 'AI/ML'],
    title: 'Malware Obfuscation using Kanerva’s Sparse Distributed Memory',
    desc: 'A research paper exploring how Sparse Distributed Memory-style encoding and retrieval can be adapted as a malware obfuscation strategy, distributing payload bytes across memory locations and reconstructing them only at runtime.',
    file: 'sdm_obfuscation.pdf',
    url: 'assets/sdm_obfuscation.pdf'
  },
  {
    kind: 'pdf',
    date: 'Dec 26, 2025',
    tags: ['CRYPTOGRAPHY'],
    title: "Digital Sovereignty and Symbolism in al-Qaeda's Mujahideen Secrets v2.0",
    desc: 'A political-science analysis of the graphical user interface of the Mujahideen Secrets v2.0 encryption program — examining how interface design was used as a vehicle for ideological communication. A follow-up paper on cryptographic vulnerabilities is forthcoming.',
    file: 'MS_Symbolic_Analysis.pdf',
    url: 'assets/MS_Symbolic_Analysis.pdf'
  },
  {
    kind: 'pdf',
    date: 'Dec 26, 2025',
    tags: ['CRYPTOGRAPHY'],
    title: 'An Analysis of the Suspected Backdoor in Dual_EC_DRBG',
    desc: 'A deep dive into the Dual_EC_DRBG pseudorandom number generator and its suspected NSA-planted backdoor — covering how the algorithm works, why the backdoor is plausible, and how it could be exploited in practice.',
    file: 'Dual_EC-1.pdf',
    url: 'assets/Dual_EC-1.pdf'
  },
  {
    kind: 'code',
    date: 'Dec 12, 2024',
    tags: ['NETWORK'],
    title: 'DNS Injection Attack Demonstration',
    desc: 'I wrote this program for my Computer and Network Security course back in 2024. This code implements an on-path DNS injection attack, a man-in-the-middle technique that intercepts DNS queries on a network and sends forged responses before the legitimate DNS server can reply.\n\nThe program sniffs traffic on a specified network interface, watching for DNS queries over UDP port 53. When it detects a query for one of the targeted domains from your hostnames file, it immediately crafts a fake DNS response. The forged packet copies the transaction ID and other details from the original query to make it look legitimate, then swaps the source and destination addresses so it appears to come from the real DNS server. Instead of the correct IP address, it injects whatever malicious IP you specified in your target file.\n\nBecause DNS uses UDP and does not verify the authenticity of responses, whichever answer arrives first gets accepted by the victim machine. If your forged response wins the race, the victim gets redirected to your specified IP address instead of the legitimate website. This could send them to a phishing page, malware site, or simply block access by pointing to 0.0.0.0. The program also captures all the original queries and injected responses to a pcap file for later analysis, which is typical for educational security labs where you need to demonstrate the attack worked.',
    file: 'dnsinject.py',
    url: 'assets/dnsinject.py'
  }
];

const pgpKeys = [
  {
    label: 'KEY 1 — Ed25519 / cv25519 · Thunderbird compatible',
    fingerprint: '17F0 4688 2E5B 32AD FE22  03E9 4270 2802 EB0C DFA7',
    key: `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEacrEyRYJKwYBBAHaRw8BAQdAZBdv/6KG7mUzwtBt3c7LTOY/eSMb+TPYTRBU
Ig7UiOO0IVRpbSBKb2hucyA8dGpvaG5zOTE3QG91dGxvb2suY29tPoi1BBMWCgBd
FiEEF/BGiC5bMq3+IgPpQnAoAusM36cFAmnKxMkbFIAAAAAABAAObWFudTIsMi41
KzEuMTIsMCwzAhsDBQkDwmcABQsJCAcCAiICBhUKCQgLAgQWAgMBAh4HAheAAAoJ
EEJwKALrDN+n/ZsA/3muGkmnRdmtF2nrV6STtICjgTas5UMkTgTs5Q96yu1TAP40
aU74ckaT8h7R5tlAXT2RvN4MQTKyCTHtj2hZw/oWC7g4BGnKxMkSCisGAQQBl1UB
BQEBB0B1gdwDfSTRkWzasAw5KGVM1cwX9Uu0dzBo/meuNkCPMQMBCAeImgQYFgoA
QhYhBBfwRoguWzKt/iID6UJwKALrDN+nBQJpysTJGxSAAAAAAAQADm1hbnUyLDIu
NSsxLjEyLDAsMwIbDAUJA8JnAAAKCRBCcCgC6wzfp/7lAP9FnXoN0VjQ9xlvI2Yq
ePB8iAK6RFT8S8xc50XJIKAqxAEAv9GHAur3hRYGAyhWPT1PMXrz5Ce7Bc3GjQ+T
YJ5dsQw=
=fLkd
-----END PGP PUBLIC KEY BLOCK-----`
  },
  {
    label: 'KEY 2 — ML-KEM (ky768_cv25519) · Quantum-resistant · GPG 2.5+ only, not Thunderbird compatible',
    fingerprint: '280B C76D 616C 6F86 843E  96E2 26FF FF48 0466 81E4',
    key: `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
=R7uN
-----END PGP PUBLIC KEY BLOCK-----`
  }
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHtml = value =>
  String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));

const tagClass = tag => `tag-${tag.replace(/[^a-z0-9]+/gi, '-')}`;
const tagLabel = tag => tag.toLowerCase();

const state = {
  theme: localStorage.getItem('theme') || document.documentElement.dataset.theme || 'light',
  filter: 'ALL',
  search: '',
  renderedItems: new Set()
};

const PY_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
  'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
  'raise', 'return', 'try', 'while', 'with', 'yield'
]);

const PY_BUILTINS = new Set([
  'bytes', 'dict', 'enumerate', 'Exception', 'filter', 'float', 'int', 'len', 'list',
  'map', 'open', 'print', 'range', 'set', 'str', 'sum', 'tuple', 'type', 'zip'
]);

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  const toggle = $('#themeToggle');
  toggle.innerHTML = ICONS[theme === 'dark' ? 'moon' : 'sun'];
  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function renderTerminalIndex() {
  const reports = entries.filter(entry => entry.kind === 'pdf').length;
  const code = entries.filter(entry => entry.kind === 'code').length;
  const codeLabel = code === 1 ? 'code project' : 'code projects';

  $('#terminalSummary').textContent = `# ${entries.length} published entries · ${reports} research reports · ${code} ${codeLabel} · 1 forthcoming`;
  $('#terminalIndex').innerHTML = entries.map(entry => `
    <div class="terminal-entry">
      <span class="file">${escapeHtml(entry.file)}</span>
    </div>
  `).join('') + `
    <div class="terminal-entry">
      <span class="file faint">MS_Exploit_Analysis.pdf</span>
    </div>
  `;
}

function renderFilters() {
  const tags = ['ALL', ...new Set(entries.flatMap(entry => entry.tags))];

  $('#filters').innerHTML = tags
    .map(tag => `<button class="filter ${tag === state.filter ? 'active' : ''}" type="button" data-filter="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
    .join('');
}

function renderPgpKeys() {
  $('#pgpKeys').innerHTML = pgpKeys.map((key, index) => `
    <div class="pgp" data-key-panel="${index}">
      <div class="pgp-head">
        <div class="pgp-title">
          <span class="pgp-label">${escapeHtml(key.label)}</span>
          <span class="fingerprint">${escapeHtml(key.fingerprint)}</span>
        </div>
        <div class="pgp-actions">
          <button class="copy-btn key-toggle" type="button" data-toggle-key="${index}" aria-expanded="false" aria-controls="pgp-${index}">
            <span class="chev">${ICONS.chev}</span><span class="key-toggle-label">Show key</span>
          </button>
          <button class="copy-btn" type="button" data-copy-key="${index}">${ICONS.copy}<span>Copy</span></button>
        </div>
      </div>
      <pre class="pgp-text" id="pgp-${index}" hidden>${escapeHtml(key.key)}</pre>
    </div>
  `).join('');
}

function entryMatches(entry) {
  const haystack = [entry.title, entry.desc, entry.date, entry.file, entry.kind, entry.tags.join(' ')]
    .join(' ')
    .toLowerCase();

  return (state.filter === 'ALL' || entry.tags.includes(state.filter)) &&
    (!state.search || haystack.includes(state.search.toLowerCase()));
}

function renderPapers() {
  state.renderedItems.clear();

  const visible = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entryMatches(entry));

  $('#articleList').innerHTML = visible.map(({ entry, index }) => {
    const isCode = entry.kind === 'code';
    const viewerClass = isCode ? 'code-viewer' : 'pdf-viewer';
    const typeLabel = isCode ? 'PYTHON' : 'PDF';
    const actionLabel = isCode ? 'View code' : 'View paper';

    return `
      <article class="entry-card" data-index="${index}">
        <button class="entry-head" type="button" aria-expanded="false">
          <div class="entry-meta">
            <span class="date">${escapeHtml(entry.date)}</span>
            ${entry.tags.map(tag => `<span class="tag ${tagClass(tag)}">${escapeHtml(tagLabel(tag))}</span>`).join('')}
          </div>
          <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
          <p class="desc">${escapeHtml(entry.desc).replace(/\n\n/g, '<br><br>')}</p>
        </button>

        <div class="article-toggle" role="button" tabindex="0" aria-label="Toggle preview">
          <span class="toggle-label"><span class="chev">${ICONS.chev}</span>${actionLabel}</span>
          <span class="date">${typeLabel}</span>
        </div>

        <div class="pdf">
          <div class="pdf-bar">
            <div class="file-name">${ICONS.file}<span>${escapeHtml(entry.file)}</span></div>
            <div class="pdf-actions">
              <span class="pages" id="pages-${index}"></span>
              <a href="${escapeHtml(entry.url)}" class="pdf-btn" download>${ICONS.download}<span>Download</span></a>
            </div>
          </div>
          <div class="${viewerClass}" id="viewer-${index}">
            <div class="loading"><div class="spinner"></div><span>Loading document...</span></div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  $('#reportCount').textContent = `${visible.length} published entr${visible.length === 1 ? 'y' : 'ies'}`;
  $('#emptyState').style.display = visible.length ? 'none' : 'block';
}

function toggleArticle(article) {
  const index = Number(article.dataset.index);
  const head = $('.entry-head', article);
  const expanded = article.classList.toggle('expanded');

  head.setAttribute('aria-expanded', String(expanded));

  if (expanded && !state.renderedItems.has(index)) {
    state.renderedItems.add(index);

    const entry = entries[index];
    const wrapper = $(`#viewer-${index}`);

    if (entry.kind === 'code') {
      renderCode(entry.url, wrapper, index);
    } else {
      renderPdf(entry.url, wrapper, index);
    }
  }
}

async function renderPdf(url, wrapper, index) {
  if (!window.pdfjsLib) {
    wrapper.innerHTML = '<div class="loading"><span>PDF renderer unavailable. Use the Download link above.</span></div>';
    $(`#pages-${index}`).textContent = 'preview unavailable';
    return;
  }

  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const maxWidth = Math.min(Math.max(wrapper.clientWidth - 44, 260), 980);

    wrapper.innerHTML = '';
    $(`#pages-${index}`).textContent = `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}`;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: maxWidth / baseViewport.width });
      const scale = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = Math.floor(viewport.width * scale);
      canvas.height = Math.floor(viewport.height * scale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      await page.render({
        canvasContext: context,
        transform: scale !== 1 ? [scale, 0, 0, scale, 0, 0] : null,
        viewport
      }).promise;

      wrapper.appendChild(canvas);
    }
  } catch (err) {
    console.error(err);
    wrapper.innerHTML = '<div class="loading"><span>Failed to load document. Use the Download link above.</span></div>';
    $(`#pages-${index}`).textContent = 'preview failed';
  }
}

function highlightPython(code) {
  const tokenPattern = /(@[A-Za-z_]\w*|#[^\n]*|[rRuUbBfF]{0,2}(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b[A-Za-z_]\w*\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;
  let html = '';
  let lastIndex = 0;

  code.replace(tokenPattern, (token, ...args) => {
    const offset = args[args.length - 2];
    html += escapeHtml(code.slice(lastIndex, offset));

    let className = '';

    if (token.startsWith('#')) {
      className = 'py-comment';
    } else if (token.startsWith('@')) {
      className = 'py-decorator';
    } else if (/^[rRuUbBfF]{0,2}["']/.test(token)) {
      className = 'py-string';
    } else if (/^\d/.test(token)) {
      className = 'py-number';
    } else if (PY_KEYWORDS.has(token)) {
      className = 'py-keyword';
    } else if (PY_BUILTINS.has(token)) {
      className = 'py-builtin';
    }

    html += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
    lastIndex = offset + token.length;
    return token;
  });

  return html + escapeHtml(code.slice(lastIndex));
}

async function renderCode(url, wrapper, index) {
  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const code = await response.text();
    const isPython = url.toLowerCase().endsWith('.py');

    wrapper.classList.toggle('python-highlight', isPython);
    wrapper.innerHTML = isPython ? highlightPython(code) : escapeHtml(code);
    $(`#pages-${index}`).textContent = `${code.split(/\r\n|\r|\n/).length} lines`;
  } catch (err) {
    console.warn(`Could not fetch ${url}:`, err);
    wrapper.innerHTML = `
      <object class="code-frame" data="${escapeHtml(url)}" type="text/plain">
        <div class="loading"><span>Failed to load source. Use the Download link above.</span></div>
      </object>
    `;
    $(`#pages-${index}`).textContent = 'source preview';
  }
}

async function copyText(text, btn) {
  const label = btn.querySelector('span:last-child');
  const original = label.textContent;

  try {
    await navigator.clipboard.writeText(text);
    btn.classList.add('copied');
    label.textContent = 'Copied';
  } catch {
    label.textContent = 'Failed';
  } finally {
    setTimeout(() => {
      btn.classList.remove('copied');
      label.textContent = original;
    }, 2200);
  }
}

document.addEventListener('click', event => {
  const tab = event.target.closest('.tab');

  if (tab) {
    $$('.tab').forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });

    $$('.panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tab.dataset.tab}`);
    });
  }

  const filter = event.target.closest('.filter');

  if (filter) {
    state.filter = filter.dataset.filter;
    renderFilters();
    renderPapers();
  }

  const articleToggle = event.target.closest('.entry-head, .article-toggle');

  if (articleToggle) {
    toggleArticle(articleToggle.closest('.entry-card'));
  }

  const keyToggle = event.target.closest('[data-toggle-key]');

  if (keyToggle) {
    const panel = keyToggle.closest('.pgp');
    const keyText = $(`#pgp-${keyToggle.dataset.toggleKey}`);
    const expanded = panel.classList.toggle('open');

    keyText.hidden = !expanded;
    keyToggle.setAttribute('aria-expanded', String(expanded));
    $('.key-toggle-label', keyToggle).textContent = expanded ? 'Hide key' : 'Show key';
  }

  const copyBtn = event.target.closest('[data-copy-key]');

  if (copyBtn) {
    copyText(pgpKeys[copyBtn.dataset.copyKey].key, copyBtn);
  }
});

document.addEventListener('keydown', event => {
  const target = event.target.closest('.article-toggle');

  if (target && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    toggleArticle(target.closest('.entry-card'));
  }
});

$('#themeToggle').addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
});

$('#searchInput').addEventListener('input', event => {
  state.search = event.target.value.trim();
  renderPapers();
});

setTheme(state.theme);
renderTerminalIndex();
renderFilters();
renderPgpKeys();
renderPapers();
