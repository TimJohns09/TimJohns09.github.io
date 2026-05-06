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

    html += className
      ? `<span class="${className}">${escapeHtml(token)}</span>`
      : escapeHtml(token);
    lastIndex = offset + token.length;
    return token;
  });

  return html + escapeHtml(code.slice(lastIndex));
}

renderCode = async function renderCode(url, wrapper, index) {
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
        <div style="padding:28px;color:#f87171;font-family:var(--font-mono);font-size:.78rem;text-align:center">
          Failed to load source file. Confirm the file exists at <strong>${escapeHtml(url)}</strong>, then use the Download button above.
        </div>
      </object>
    `;

    $(`#pages-${index}`).textContent = 'source preview';
  }
};
