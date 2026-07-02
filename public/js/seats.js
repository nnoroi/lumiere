document.addEventListener('DOMContentLoaded', () => {
  const MAX = 6;
  const boxes = document.querySelectorAll('.seat-checkbox:not(:disabled)');
  const submitBtn = document.getElementById('submit-btn');
  const countLabel = document.getElementById('seat-count');
  const chipsLabel = document.getElementById('seat-chips');
  const warningLabel = document.getElementById('seat-warning');
  let warningTimeout;

  function showWarning(msg) {
    warningLabel.textContent = msg;
    warningLabel.classList.add('is-visible');
    clearTimeout(warningTimeout);
    warningTimeout = setTimeout(() => warningLabel.classList.remove('is-visible'), 2200);
  }

  function update() {
    const selected = Array.from(document.querySelectorAll('.seat-checkbox:checked'));
    countLabel.textContent = `${selected.length} / ${MAX} seats selected`;
    chipsLabel.textContent = selected.map(b => b.getAttribute('data-name')).sort().join(', ');
    
    submitBtn.disabled = selected.length === 0;
    submitBtn.textContent = selected.length
      ? `Proceed to Checkout (${selected.length})`
      : 'Select seats to continue';
  }

  boxes.forEach(box => box.addEventListener('change', e => {
    if (e.target.checked && document.querySelectorAll('.seat-checkbox:checked').length > MAX) {
      e.target.checked = false;
      showWarning(`You can only select up to ${MAX} seats per booking.`);
    }
    update();
  }));
});