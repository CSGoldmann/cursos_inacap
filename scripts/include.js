// small loader to fetch partials and notify app
(async () => {
  async function loadPartial(url, containerId) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Partial not found: ' + url);
      const html = await res.text();
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = html;
      // notify listeners that the partial was inserted
      document.dispatchEvent(new CustomEvent('partial-loaded', { detail: { url, containerId } }));
    } catch (err) {
      console.error('Error loading partial:', err);
    }
  }

  // load both sidebar and header
  await Promise.all([
    loadPartial('partials/sidebar.html', 'sidebar'),
    loadPartial('partials/header.html', 'header')
  ]);
})();