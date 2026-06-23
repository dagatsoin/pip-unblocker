/**
 * Shared fixture helper: turns a <video> into a real, playing video by feeding
 * it an animated canvas-captured MediaStream. This gives every fixture an
 * actually PiP-invocable video over file:// with no external media file.
 *
 * Usage in a fixture:
 *   <video id="v" disablepictureinpicture autoplay muted playsinline></video>
 *   <script src="sample-stream.js"></script>
 *   <script>attachSampleStream(document.getElementById('v'), 'amber');</script>
 *
 * The animation also makes it obvious the video is live (so QA can confirm the
 * native PiP pop-out shows moving content).
 */
function attachSampleStream(video, label) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  const start = performance.now();

  const palette = {
    amber: ["#7c2d12", "#f97316"],
    emerald: ["#064e3b", "#10b981"],
    slate: ["#1e293b", "#64748b"],
    indigo: ["#312e81", "#6366f1"],
  };
  const [bg, fg] = palette[label] || palette.slate;

  function draw(now) {
    const t = (now - start) / 1000;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // A bouncing block so motion is visible in the (possibly PiP) frame.
    const x = (Math.sin(t * 1.3) * 0.5 + 0.5) * (canvas.width - 60);
    const y = (Math.cos(t * 1.7) * 0.5 + 0.5) * (canvas.height - 60);
    ctx.fillStyle = fg;
    ctx.fillRect(x, y, 60, 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(label || "sample", 10, 24);
    ctx.fillText(t.toFixed(1) + "s", 10, canvas.height - 12);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  const stream = canvas.captureStream(30);
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  // Autoplay of a muted, script-driven stream is allowed.
  const p = video.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}
