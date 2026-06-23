// Check if we are loaded in an iframe AND if the URL contains our embed flag
if (window.self !== window.top && window.location.search.includes('embed=true')) {
  // Add a class to the body so our injected CSS takes effect
  // We use requestAnimationFrame or DOMContentLoaded to ensure body exists
  
  const injectClass = () => {
    document.body.classList.add('flowmap-extension-embed');
  };

  if (document.body) {
    injectClass();
  } else {
    document.addEventListener('DOMContentLoaded', injectClass);
  }
}
