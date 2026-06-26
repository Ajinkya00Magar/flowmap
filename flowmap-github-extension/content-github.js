// Inject the Flowmap button into GitHub's UI
function injectFlowmapButton() {
  // Prevent duplicate injections
  if (document.getElementById('flowmap-github-ext-btn')) return;

  // Find a good place to inject the button. 
  // In the repo page, the file navigation bar or header is usually good.
  // We'll target the right side of the repository header (where Watch/Fork/Star are)
  const pageheadActions = document.querySelector('.pagehead-actions');
  
  if (!pageheadActions) return;

  const li = document.createElement('li');
  
  const btn = document.createElement('button');
  btn.id = 'flowmap-github-ext-btn';
  btn.className = 'btn btn-sm d-none d-md-block';
  btn.style.backgroundColor = '#6366F1';
  btn.style.color = 'white';
  btn.style.border = '1px solid rgba(255,255,255,0.1)';
  
  btn.innerHTML = `
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-project" style="fill: currentColor; vertical-align: text-bottom; margin-right: 4px;">
      <path fill-rule="evenodd" d="M1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25V1.75A1.75 1.75 0 0014.25 0H1.75zM1.5 1.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v12.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V1.75zM11.75 3a.75.75 0 00-.75.75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75zm-8.25.75a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zM7.25 3a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z"></path>
    </svg>
    Open Flowmap Canvas
  `;

  btn.addEventListener('click', openFlowmapOverlay);
  
  li.appendChild(btn);
  pageheadActions.insertBefore(li, pageheadActions.firstChild);
}

function openFlowmapOverlay() {
  if (document.getElementById('flowmap-overlay')) return;

  chrome.storage.sync.get(['flowmapUrl'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Flowmap Extension Error:", chrome.runtime.lastError);
    }
    const baseUrl = (result && result.flowmapUrl) ? result.flowmapUrl : 'https://flomap.vercel.app';
    
    // We append a query param just in case the app wants to read it in the future,
    // though our injected CSS handles the hiding.
    const iframeSrc = `${baseUrl}?embed=true`;

    const overlay = document.createElement('div');
    overlay.id = 'flowmap-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.zIndex = '9999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Canvas & Return to GitHub';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '30px';
    closeBtn.style.padding = '8px 16px';
    closeBtn.style.backgroundColor = '#ef4444';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.zIndex = '99999999';
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open App in New Tab';
    openBtn.style.position = 'absolute';
    openBtn.style.top = '20px';
    openBtn.style.right = '270px';
    openBtn.style.padding = '8px 16px';
    openBtn.style.backgroundColor = '#6366F1';
    openBtn.style.color = 'white';
    openBtn.style.border = 'none';
    openBtn.style.borderRadius = '6px';
    openBtn.style.cursor = 'pointer';
    openBtn.style.fontWeight = 'bold';
    openBtn.style.zIndex = '99999999';
    
    openBtn.addEventListener('click', () => {
      window.open(baseUrl, '_blank');
    });

    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.allow = "clipboard-read; clipboard-write";
    iframe.style.width = '90vw';
    iframe.style.height = '85vh';
    iframe.style.border = '1px solid rgba(255,255,255,0.1)';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
    iframe.style.backgroundColor = '#050810';

    overlay.appendChild(closeBtn);
    overlay.appendChild(openBtn);
    overlay.appendChild(iframe);
    
    document.body.appendChild(overlay);
  });
}

// Observe DOM changes to re-inject button if GitHub's SPA router navigates
const observer = new MutationObserver(() => {
  injectFlowmapButton();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial injection
injectFlowmapButton();
