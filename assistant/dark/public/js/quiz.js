/* quiz.js — questionnaire interactivity */
(function () {
  const TOTAL = 27;
  const form       = document.getElementById('quizForm');
  const submitBtn  = document.getElementById('submitBtn');
  const submitNote = document.getElementById('submitNote');
  const progressBar   = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const progressWrap  = progressBar ? progressBar.closest('[role="progressbar"]') : null;

  function countAnswered() {
    const names = new Set();
    document.querySelectorAll('.rating-radio').forEach(r => names.add(r.name));
    let answered = 0;
    names.forEach(name => {
      if (document.querySelector(`.rating-radio[name="${name}"]:checked`)) answered++;
    });
    return answered;
  }

  function updateProgress() {
    const answered = countAnswered();
    const pct = Math.round((answered / TOTAL) * 100);

    if (progressBar)   progressBar.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${answered} / ${TOTAL} answered`;
    if (progressWrap)  progressWrap.setAttribute('aria-valuenow', answered);

    if (answered === TOTAL) {
      submitBtn.disabled = false;
      submitNote.textContent = '';
    } else {
      submitBtn.disabled = true;
      submitNote.textContent = `${TOTAL - answered} question${TOTAL - answered !== 1 ? 's' : ''} remaining`;
    }
  }

  // Mark fieldset as answered when a choice is made
  document.querySelectorAll('.rating-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      const fieldset = radio.closest('.question');
      if (fieldset) fieldset.classList.add('answered');
      updateProgress();
    });
  });

  // Show loading overlay on submit
  if (form) {
    form.addEventListener('submit', (e) => {
      if (countAnswered() < TOTAL) {
        e.preventDefault();
        submitNote.textContent = 'Please answer all questions before submitting.';
        submitNote.style.color = '#fca5a5';
        // Scroll to first unanswered
        const names = new Set();
        document.querySelectorAll('.rating-radio').forEach(r => names.add(r.name));
        for (const name of names) {
          const checked = document.querySelector(`.rating-radio[name="${name}"]:checked`);
          if (!checked) {
            const first = document.querySelector(`.rating-radio[name="${name}"]`);
            if (first) {
              const fs = first.closest('.question');
              if (fs) fs.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            break;
          }
        }
        return;
      }

      // Show spinner
      const btnText    = submitBtn.querySelector('.btn-text');
      const btnSpinner = submitBtn.querySelector('.btn-spinner');
      if (btnText)    btnText.textContent = 'Analysing…';
      if (btnSpinner) btnSpinner.hidden = false;
      submitBtn.disabled = true;

      // Show full-screen loading overlay
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.hidden = false;
    });
  }

  updateProgress();
})();
