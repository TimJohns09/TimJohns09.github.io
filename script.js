pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const ICONS = {
  moon: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  file: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></svg>',
  copy: '<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  chev: '<svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
};

const entries = [
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

const escapeHtml = str =>
  String(str).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));

const state = {
  theme: localStorage.getItem('theme') || 'light',
  filter: 'ALL',
  search: '',
  renderedItems: new Set()
};

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  $('#themeToggle').innerHTML = ICONS[theme === 'dark' ? 'moon' : 'sun'];
}

function renderFilters() {
  const tags = ['ALL', ...new Set(entries.flatMap(p => p.tags))];

  $('#filters').innerHTML = tags
    .map(tag => `<button class="filter ${tag === state.filter ? 'active' : ''}" data-filter="${tag}">${tag}</button>`)
    .join('');
}

function renderPgpKeys() {
  $('#pgpKeys').innerHTML = pgpKeys.map((key, i) => `
    <div class="pgp" data-key-panel="${i}">
      <div class="pgp-head">
        <div class="pgp-title">
          <span class="pgp-label">${escapeHtml(key.label)}</span>
          <span class="fingerprint">${escapeHtml(key.fingerprint)}</span>
        </div>
        <div class="pgp-actions">
          <button class="copy-btn key-toggle" data-toggle-key="${i}" aria-expanded="false" aria-controls="pgp-${i}"><span class="chev">${ICONS.chev}</span><span class="key-toggle-label">Show key</span></button>
          <button class="copy-btn" data-copy-key="${i}">${ICONS.copy}<span>Copy</span></button>
        </div>
      </div>
      <pre class="pgp-text" id="pgp-${i}" hidden>${escapeHtml(key.key)}</pre>
    </div>
  `).join('<span class="gap"></span>');
}

function entryMatches(entry) {
  const haystack = [
    entry.title,
    entry.desc,
    entry.date,
    entry.file,
    entry.kind,
    entry.tags.join(' ')
  ].join(' ').toLowerCase();

  const tagMatch = state.filter === 'ALL' || entry.tags.includes(state.filter);
  const searchMatch = !state.search || haystack.includes(state.search.toLowerCase());

  return tagMatch && searchMatch;
}

function renderPapers() {
  state.renderedItems.clear();

  const visible = entries
    .map((entry, i) => ({ entry, i }))
    .filter(({ entry }) => entryMatches(entry));

  $('#articleList').innerHTML = visible.map(({ entry, i }) => {
    const isCode = entry.kind === 'code';
    const viewerClass = isCode ? 'code-viewer' : 'pdf-viewer';
    const typeLabel = isCode ? 'PYTHON' : 'PDF';
    const actionLabel = isCode ? 'View code' : 'View paper';
    const downloadLabel = 'Download';

    return `
      <article data-index="${i}">
        <div class="article-head" role="button" tabindex="0" aria-expanded="false">
          <div class="meta">
            <span class="date">${escapeHtml(entry.date)}</span>
            ${entry.tags.map(tag => `<span class="tag ${tag}">${tag.toLowerCase()}</span>`).join('')}
          </div>
          <h2 class="article-title">${escapeHtml(entry.title)}</h2>
          <p class="desc">${escapeHtml(entry.desc).replace(/\n\n/g, '<br><br>')}</p>
        </div>

        <div class="article-toggle" role="button" tabindex="0" aria-label="Toggle preview">
          <span class="toggle-label"><span class="chev">${ICONS.chev}</span>${actionLabel}</span>
          <span class="date">${typeLabel}</span>
        </div>

        <div class="pdf">
          <div class="pdf-bar">
            <div class="file-name">${ICONS.file}${escapeHtml(entry.file)}</div>
            <div class="pdf-actions">
              <span class="pages" id="pages-${i}"></span>
              <a href="${escapeHtml(entry.url)}" class="pdf-btn" download>${ICONS.download}${downloadLabel}</a>
            </div>
          </div>

          <div class="${viewerClass}" id="viewer-${i}">
            <div class="loading"><div class="spinner"></div><span>Loading document…</span></div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  $('#reportCount').textContent = `${visible.length} published entr${visible.length === 1 ? 'y' : 'ies'}`;
  $('#emptyState').style.display = visible.length ? 'none' : 'block';
}

function toggleArticle(article) {
  const head = $('.article-head', article);
  const index = Number(article.dataset.index);
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
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;

    wrapper.innerHTML = '';
    $(`#pages-${index}`).textContent = `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}`;

    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (wrapper.clientWidth * .92) / base.width });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      wrapper.appendChild(canvas);

      await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport
      }).promise;
    }
  } catch (err) {
    console.error(err);

    wrapper.innerHTML = `
      <div style="padding:28px;color:#f87171;font-family:var(--font-mono);font-size:.78rem;text-align:center">
        Failed to load document. Use the Download button above.
      </div>
    `;
  }
}

async function renderCode(url, wrapper, index) {
  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const code = await response.text();

    wrapper.textContent = code;
    $(`#pages-${index}`).textContent = `${code.split(/\r\n|\r|\n/).length} lines`;

    return;
  } catch (err) {
    console.warn(`Could not fetch ${url}:`, err);

    /*
      If you open index.html directly from your computer with file://,
      most browsers block fetch() from reading assets/dnsinject.py.

      This fallback still gives the browser a chance to display the file.

      On GitHub Pages, fetch() should work as long as the file exists at:
      assets/dnsinject.py
    */
    wrapper.innerHTML = `
      <object class="code-frame" data="${escapeHtml(url)}" type="text/plain">
        <div style="padding:28px;color:#f87171;font-family:var(--font-mono);font-size:.78rem;text-align:center">
          Failed to load source file. Confirm the file exists at <strong>assets/dnsinject.py</strong>, then use the Download button above.
        </div>
      </object>
    `;

    $(`#pages-${index}`).textContent = 'source preview';
  }
}

async function copyText(text, btn) {
  const label = $('span', btn);

  try {
    await navigator.clipboard.writeText(text);

    btn.classList.add('copied');
    label.textContent = 'Copied!';
  } catch {
    label.textContent = 'Failed';
  } finally {
    setTimeout(() => {
      btn.classList.remove('copied');
      label.textContent = 'Copy';
    }, 2200);
  }
}

document.addEventListener('click', e => {
  const tab = e.target.closest('.tab');

  if (tab) {
    $$('.tab').forEach(t => {
      const active = t === tab;

      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });

    $$('.panel').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tab.dataset.tab}`);
    });
  }

  const filter = e.target.closest('.filter');

  if (filter) {
    state.filter = filter.dataset.filter;
    renderFilters();
    renderPapers();
  }

  const articleToggle = e.target.closest('.article-head, .article-toggle');

  if (articleToggle) {
    toggleArticle(articleToggle.closest('article'));
  }

  const keyToggle = e.target.closest('[data-toggle-key]');

  if (keyToggle) {
    const panel = keyToggle.closest('.pgp');
    const keyText = $(`#pgp-${keyToggle.dataset.toggleKey}`);
    const expanded = panel.classList.toggle('open');

    keyText.hidden = !expanded;
    keyToggle.setAttribute('aria-expanded', String(expanded));
    $('.key-toggle-label', keyToggle).textContent = expanded ? 'Hide key' : 'Show key';
  }

  const copyBtn = e.target.closest('[data-copy-key]');

  if (copyBtn) {
    copyText(pgpKeys[copyBtn.dataset.copyKey].key, copyBtn);
  }
});

document.addEventListener('keydown', e => {
  const target = e.target.closest('.article-head, .article-toggle');

  if (target && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    toggleArticle(target.closest('article'));
  }
});

$('#themeToggle').addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
});

$('#searchInput').addEventListener('input', e => {
  state.search = e.target.value.trim();
  renderPapers();
});

setTheme(state.theme);
renderFilters();
renderPgpKeys();
renderPapers();
