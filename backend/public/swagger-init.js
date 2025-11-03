function getSavedToken() {
  try { return localStorage.getItem('dev_bearer_token') || '' } catch (e) { return ''; }
}
function setSavedToken(t) { try { localStorage.setItem('dev_bearer_token', t); } catch (e) {} }
function clearSavedToken() { try { localStorage.removeItem('dev_bearer_token'); } catch (e) {} }

function showError(msg) {
  const container = document.getElementById('swagger-ui');
  if (!container) return;
  container.innerHTML = '<div style="padding:24px;color:#a00;background:#fee;border:1px solid #f99">' +
    '<strong>Failed to load API spec:</strong><div style="margin-top:8px">' +
    String(msg).replace(/</g, '&lt;') + '</div></div>';
}

document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('dev-token');
  const saveBtn = document.getElementById('save-token');
  const clearBtn = document.getElementById('clear-token');
  if (input) input.value = getSavedToken();
  if (saveBtn) saveBtn.addEventListener('click', () => { setSavedToken(input.value); alert('Token saved to localStorage'); });
  if (clearBtn) clearBtn.addEventListener('click', () => { clearSavedToken(); if (input) input.value = ''; alert('Token cleared'); });

  // Fetch the YAML spec first and parse to an object. Provide verbose
  // diagnostics so the page doesn't go blank silently if something fails.
  const debug = (msg) => {
    try { document.getElementById('swagger-debug').textContent += msg + '\n'; } catch (e) {}
    console.debug(msg);
  };

  (async function loadAndInit() {
    debug('Diagnostic: starting Swagger UI init');
    if (typeof SwaggerUIBundle === 'undefined') {
      showError('Swagger UI bundle did not load (SwaggerUIBundle is undefined). Check network or vendor files.');
      return;
    }
    debug('Diagnostic: SwaggerUIBundle present');
    if (typeof jsyaml === 'undefined') {
      debug('Diagnostic: js-yaml not present, attempting to continue using Swagger UI fetch');
    } else {
      debug('Diagnostic: js-yaml present');
    }

    let res;
    try {
      res = await fetch('/docs/openapi.yaml');
      debug('Diagnostic: fetch /docs/openapi.yaml status=' + res.status);
    } catch (e) {
      const msg = 'Network error when fetching /docs/openapi.yaml: ' + (e && e.message ? e.message : String(e));
      console.error(msg, e);
      showError(msg);
      return;
    }

    if (!res.ok) {
      const msg = 'HTTP ' + res.status + ' fetching /docs/openapi.yaml';
      showError(msg);
      return;
    }

    let text;
    try {
      text = await res.text();
      debug('Diagnostic: fetched spec length=' + (text ? text.length : 0));
      debug('Diagnostic: spec snippet:\n' + (text ? text.substring(0, 1000) : '[empty]'));
    } catch (e) {
      const msg = 'Error reading spec text: ' + (e && e.message ? e.message : String(e));
      showError(msg);
      return;
    }

    let specObj = null;
    if (typeof jsyaml !== 'undefined') {
      try {
        specObj = jsyaml.load(text);
        debug('Diagnostic: YAML parsed successfully. Top-level keys: ' + Object.keys(specObj || {}).join(','));
      } catch (e) {
        const msg = 'YAML parse error: ' + (e && e.message ? e.message : String(e));
        showError(msg);
        return;
      }
    }

    try {
      const ui = SwaggerUIBundle({
        spec: specObj || undefined,
        url: specObj ? undefined : '/docs/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        validatorUrl: null,
        requestInterceptor: (req) => {
          const t = getSavedToken();
          if (t && !req.headers.Authorization) {
            req.headers.Authorization = typeof t === 'string' && t.startsWith('Bearer') ? t : `Bearer ${t}`;
          }
          return req;
        }
      });
      debug('Diagnostic: Swagger UI initialized');
      try { globalThis.ui = ui; } catch (e) { window.ui = ui; }
    } catch (e) {
      const msg = 'Error initializing Swagger UI: ' + (e && e.message ? e.message : String(e));
      console.error(msg, e);
      showError(msg);
    }
  })();
});
