document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded! Looking for showtime pills...");
    
    const timePills = document.querySelectorAll('.showtime-pill');
    const container = document.getElementById('seat-map-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    const showingIdInput = document.getElementById('showing-id-input');
    const selectedSeatsInput = document.getElementById('selected-seats-input');

    console.log(`Found ${timePills.length} showtime pills on the page.`);
    if (!container) {
        console.error("CRITICAL ERROR: Could not find element with id='seat-map-container'!");
    }

    let selectedSeats = [];
    const ticketPrice = 12.50;

    timePills.forEach((pill, index) => {
        pill.addEventListener('click', async (e) => {
            console.log(`Pill #${index} clicked!`);
            
            // Toggle active classes
            timePills.forEach(p => {
                p.classList.remove('btn-light', 'text-dark');
                p.classList.add('btn-outline-light');
            });
            pill.classList.remove('btn-outline-light');
            pill.classList.add('btn-light', 'text-dark');
            
            selectedSeats = [];
            updateCheckoutUI();

            const rawShowingId = pill.getAttribute('data-showing-id');
            console.log("Raw showing ID grabbed from button attribute:", rawShowingId);

            if (!rawShowingId) {
                console.error("ERROR: Clicked button has an empty or missing data-showing-id attribute!");
                container.innerHTML = `<p class="text-danger">Error: Showtime has no ID associated with it.</p>`;
                return;
            }

            const showingId = rawShowingId.trim();
            showingIdInput.value = showingId;

            container.innerHTML = '<div class="text-white">Loading dynamic seat layouts...</div>';

            try {
                const apiUrl = `/api/showing/${showingId}`;
                console.log(`Fetching seat data from endpoint: ${apiUrl}`);
                
                const response = await fetch(apiUrl);
                console.log("Server responded with status code:", response.status);
                
                if (!response.ok) throw new Error(`Network error: ${response.status}`);
                
                const data = await response.json();
                console.log("Successfully received seat data object from database:", data);
                
                renderSeatMap(data, container);
            } catch(err) {
                console.error("Error loading seat matrix:", err);
                container.innerHTML = `<p class="text-danger">Failed to load layout room details. Error: ${err.message}</p>`;
            }
        });
    });

    function renderSeatMap(data, containerElement) {
        containerElement.innerHTML = '';

        const screenDiv = document.createElement('div');
        screenDiv.className = `p-2 mb-5 rounded text-center text-uppercase fw-bold text-muted`;
        screenDiv.style.background = 'linear-gradient(to bottom, #3a3a4a, #15151c)';
        screenDiv.style.borderTop = '3px solid #E50914';
        screenDiv.style.fontSize = '0.8rem';
        screenDiv.style.letterSpacing = '2px';
        screenDiv.innerText = `${data.screenName} (${data.type} SCREEN)`;
        containerElement.appendChild(screenDiv);

        if (!data.rows || data.rows.length === 0) {
            containerElement.innerHTML += `<p class="text-warning">This layout session contains no rows.</p>`;
            return;
        }

        data.rows.forEach(row => {
            const rowWrapper = document.createElement('div');
            rowWrapper.className = 'd-flex justify-content-center align-items-center mb-2 gap-2';

            const rowLabel = document.createElement('span');
            rowLabel.className = 'text-muted me-3 fw-bold';
            rowLabel.style.width = '20px';
            rowLabel.innerText = row.name;
            rowWrapper.appendChild(rowLabel);

            row.seats.forEach(seat => {
                const seatBtn = document.createElement('button');
                seatBtn.type = 'button';
                seatBtn.className = 'btn btn-sm m-1 p-2 rounded-2 transition-all';
                seatBtn.style.width = '35px';
                seatBtn.style.height = '35px';
                seatBtn.style.fontSize = '0.75rem';
                seatBtn.innerText = seat.number;

                const seatIdentifier = `${row.name}-${seat.number}`;

                if (!seat.available) {
                    // SEAT IS OCCUPIED: Gray it out, cross it out, make it unclickable
                    seatBtn.className += ' btn-secondary disabled opacity-25';
                } else {
                    // SEAT IS AVAILABLE: Make it clean and interactive
                    seatBtn.className += ' btn-outline-secondary text-white border-secondary';
                    
                    seatBtn.addEventListener('click', () => {
                        // Check if seat is already clicked
                        if (selectedSeats.includes(seatIdentifier)) {
                            // De-select it
                            selectedSeats = selectedSeats.filter(s => s !== seatIdentifier);
                            seatBtn.classList.remove('btn-danger');
                            seatBtn.classList.add('btn-outline-secondary', 'text-white');
                        } else {
                            // ─── LIMIT CHECK LIVE ───
                            if (selectedSeats.length >= 6) {
                                alert("Maximum booking limit reached! You can only select up to 6 seats per transaction.");
                                return; // Stop execution so the seat doesn't get added
                            }

                            // Select it
                            selectedSeats.push(seatIdentifier);
                            seatBtn.classList.remove('btn-outline-secondary', 'text-white');
                            seatBtn.classList.add('btn-danger');
                        }
                        updateCheckoutUI();
                    });
                }
                rowWrapper.appendChild(seatBtn);
            });
            containerElement.appendChild(rowWrapper);
        });
    }

    function updateCheckoutUI() {
        if(selectedSeatsInput) selectedSeatsInput.value = selectedSeats.join(',');

        if (selectedSeats.length > 0) {
            if(checkoutBtn) {
                checkoutBtn.disabled = false;
                const totalSum = (selectedSeats.length * ticketPrice).toFixed(2);
                checkoutBtn.innerText = `Proceed to Payment for £${totalSum} (Seat(s): ${selectedSeats.join(', ')})`;
            }
        } else {
            if(checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.innerText = (showingIdInput && showingIdInput.value) ? 'Select your seats to proceed' : 'Select a session and seats to proceed';
            }
        }
    }
});