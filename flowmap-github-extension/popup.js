document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('flowmapUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load the current URL
  chrome.storage.sync.get(['flowmapUrl'], (result) => {
    if (result.flowmapUrl) {
      urlInput.value = result.flowmapUrl;
    } else {
      urlInput.value = 'https://flomap.vercel.app'; // fallback default
    }
  });

  // Save the URL
  saveBtn.addEventListener('click', () => {
    let url = urlInput.value.trim();
    if (!url) return;
    
    // Remove trailing slash if present
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    chrome.storage.sync.set({ flowmapUrl: url }, () => {
      statusEl.textContent = 'Saved successfully!';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    });
  });
});
