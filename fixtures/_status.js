/**
 * Tiny on-page inspector for QA: renders the live PiP-suppression state of
 * every <video> on the fixture so a tester can confirm, without DevTools,
 * whether the attribute/property are present before and after using the
 * extension. Refreshes a few times a second.
 */
(function () {
  const panel = document.createElement("pre");
  panel.style.cssText =
    "position:fixed;right:8px;bottom:8px;margin:0;padding:10px 12px;" +
    "background:#0f172a;color:#e2e8f0;font:12px/1.5 ui-monospace,monospace;" +
    "border-radius:8px;max-width:340px;z-index:2147483647;white-space:pre-wrap;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.4)";
  function render() {
    const vids = Array.from(document.querySelectorAll("video"));
    const lines = vids.map((v, i) => {
      const attr = v.hasAttribute("disablepictureinpicture");
      const prop = v.disablePictureInPicture === true;
      const blocked = attr || prop;
      return (
        `video[${i}] ` +
        `attr=${attr ? "Y" : "n"} prop=${prop ? "Y" : "n"} -> ` +
        `${blocked ? "BLOCKED" : "clear"}`
      );
    });
    const anyBlocked = vids.some(
      (v) => v.hasAttribute("disablepictureinpicture") || v.disablePictureInPicture === true
    );
    panel.textContent =
      `videos: ${vids.length}\n` +
      (lines.length ? lines.join("\n") + "\n" : "(no <video> on page)\n") +
      `page verdict: ${anyBlocked ? "BLOCKED (expect orange)" : vids.length ? "clear (expect default)" : "no-video (default)"}`;
  }
  function boot() {
    document.body.appendChild(panel);
    render();
    setInterval(render, 400);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
