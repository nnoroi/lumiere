document.addEventListener('DOMContentLoaded', function() {
            const cardRadio = document.getElementById('cardPay');
            const paypalRadio = document.getElementById('paypalPay');
            const cardFields = document.getElementById('cardFields');
            const paypalFields = document.getElementById('paypalFields');
            const optionBoxes = document.querySelectorAll('.option-box');

            function updateSelectionHighlight() {
                optionBoxes.forEach(box => {
                    const radio = box.querySelector('input[type="radio"]');
                    if(radio.checked) {
                        box.style.borderColor = '#E50914'; 
                        box.style.backgroundColor = '#1C1C24';
                    } else {
                        box.style.borderColor = '#2A2A35'; 
                        box.style.backgroundColor = '#15151C';
                    }
                });
            }

            optionBoxes.forEach(box => {
                box.addEventListener('click', function() {
                    this.querySelector('input[type="radio"]').checked = true;
                    triggerViewToggle();
                });
            });

            function triggerViewToggle() {
                if (cardRadio.checked) {
                    cardFields.classList.remove('d-none');
                    paypalFields.classList.add('d-none');
                } else if (paypalRadio.checked) {
                    cardFields.classList.add('d-none');
                    paypalFields.classList.remove('d-none');
                }
                updateSelectionHighlight();
            }

            cardRadio.addEventListener('change', triggerViewToggle);
            paypalRadio.addEventListener('change', triggerViewToggle);
            
            triggerViewToggle();
        });