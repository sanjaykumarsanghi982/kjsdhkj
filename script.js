(() => {
  const cards = Array.from(document.querySelectorAll('.card'));
  const toast = document.getElementById('toast');

  // Show a welcome toast
  function showToast(message, ms = 2600) {
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    toast.style.pointerEvents = 'auto';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(14px)';
      toast.style.pointerEvents = 'none';
    }, ms);
  }

  // Card tilt effect on pointer move
  cards.forEach(card => {
    const rect = () => card.getBoundingClientRect();

    card.addEventListener('pointermove', (ev) => {
      const r = rect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const tiltX = clamp((-dy / r.height) * 12, -12, 12);
      const tiltY = clamp((dx / r.width) * 12, -12, 12);
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });

    const media = card.querySelector('.card-media');
    card.addEventListener('mousemove', (ev) => {
      const r = rect();
      const px = (ev.clientX - r.left) / r.width;
      const py = (ev.clientY - r.top) / r.height;
      media.style.transform = `translate3d(${(px - 0.5) * 10}px, ${(py - 0.5) * 6}px, 0)`;
    });
    card.addEventListener('mouseleave', () => {
      media.style.transform = '';
    });
  });

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // Show initial welcome toast
  setTimeout(() => showToast('Welcome — click any Download button to get UltraViewer'), 800);
})();
