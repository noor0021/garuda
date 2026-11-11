// Starts the app after the first paint. index.html is prerendered (scripts/prerender.tsx), so
// the page is already readable; fetching the bundle one frame later lets that paint happen first
// and gives HTML and fonts the bandwidth on slow connections. The bundle URL is in
// <meta name="app-entry">. rAF does not run in background tabs, hence the timeout fallback.
(function () {
  var meta = document.querySelector('meta[name="app-entry"]');
  if (!meta) return;
  var started = false;
  function start() {
    if (started) return;
    started = true;
    var script = document.createElement('script');
    script.type = 'module';
    script.src = meta.getAttribute('content');
    document.head.appendChild(script);
  }
  requestAnimationFrame(function () {
    setTimeout(start, 0);
  });
  setTimeout(start, 500);
})();
