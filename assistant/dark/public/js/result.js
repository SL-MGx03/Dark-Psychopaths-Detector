/* result.js — result card download + copy link */
(function () {
  const data = window.__RESULT__;
  if (!data) return;

  /* ── Copy link ───────────────────────────────────────────── */
  const copyBtn = document.getElementById('copyLinkBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.siteUrl);
        const orig = copyBtn.innerHTML;
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
      } catch {
        prompt('Copy this link:', data.siteUrl);
      }
    });
  }

  /* ── Download card ───────────────────────────────────────── */
  const downloadBtn = document.getElementById('downloadCardBtn');
  const canvas      = document.getElementById('resultCanvas');

  if (!downloadBtn || !canvas) return;

  downloadBtn.addEventListener('click', () => {
    generateCard(canvas, data);
  });

  function generateCard(canvas, d) {
    const W = 1200, H = 630;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Gradient blobs
    const glow1 = ctx.createRadialGradient(200, 150, 0, 200, 150, 350);
    glow1.addColorStop(0, 'rgba(168,85,247,0.3)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(1000, 480, 0, 1000, 480, 300);
    glow2.addColorStop(0, 'rgba(236,72,153,0.25)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = 'rgba(168,85,247,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, 16, 16, W-32, H-32, 20);
    ctx.stroke();

    // Site brand
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('🧠 Dark Triad Detector', 60, 70);

    // Nickname
    ctx.font = 'bold 52px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#e8e8f0';
    ctx.fillText(truncate(d.nickname, 28) + "'s Dark Profile", 60, 160);

    // Specimen type (subtitle)
    if (d.specimenType) {
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = '#a855f7';
      ctx.fillText(truncate(d.specimenType, 70), 60, 210);
    }

    // Score bars
    const traits = [
      { label: 'Machiavellianism', value: d.scores.machiavellianism, color: '#a855f7' },
      { label: 'Narcissism',       value: d.scores.narcissism,       color: '#f59e0b' },
      { label: 'Psychopathy',      value: d.scores.psychopathy,      color: '#ef4444' },
    ];

    const barY = 270, barH = 40, barW = 700, barGap = 70;
    traits.forEach((t, i) => {
      const y = barY + i * barGap;
      const pct = Math.round(t.value * 100);

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      roundRect(ctx, 60, y, barW, barH, 8);
      ctx.fill();

      // Fill
      ctx.fillStyle = t.color;
      roundRect(ctx, 60, y, Math.max(barW * t.value, 16), barH, 8);
      ctx.fill();

      // Label
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(t.label, 60, y - 6);

      // Percentage
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(pct + '%', 60 + barW - 10, y + barH - 12);
      ctx.textAlign = 'left';
    });

    // Summary verdict
    if (d.summary) {
      const summaryY = barY + traits.length * barGap + 30;
      ctx.font = 'italic 20px Inter, sans-serif';
      ctx.fillStyle = '#fca5a5';
      const lines = wrapText(ctx, `"${d.summary}"`, 60, W - 120);
      lines.forEach((line, li) => ctx.fillText(line, 60, summaryY + li * 32));
    }

    // Footer
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(d.siteUrl, 60, H - 36);
    // right-align attribution
    ctx.textAlign = 'right';
    ctx.fillText('Short Dark Triad (SD3) · Jones & Paulhus, 2014', W - 60, H - 36);
    ctx.textAlign = 'left';

    // Trigger download
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dark-triad-result.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }

  function wrapText(ctx, text, x, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines.slice(0, 3); // max 3 lines
  }
})();
