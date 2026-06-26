document.addEventListener('DOMContentLoaded', () => { // waits browser to finish loading the html structure
    
    const timePills = document.querySelectorAll('.showtime-pill');
    const container = document.getElementById('seat-map-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    const showingIdInput = document.getElementById('showing-id-input'); //html element object from DOM
    const selectedSeatsInput = document.getElementById('selected-seats-input');

    let selectedSeats = [];
    const ticketPrice = 12.50;

    timePills.forEach((pill, index) => {
        pill.addEventListener('click', async (e) => {
            selectedSeats = []; // if user switches between rooms, it clears shopping cart
            updateCheckoutUI();

            const rawShowingId = pill.getAttribute('data-showing-id'); //reads the attribute from ejs file
            const showingId = rawShowingId.trim(); // clears the data-showing-id if there any spaces 
            showingIdInput.value = showingId;

            container.innerHTML = '<div class="text-white">Loading dynamic seat layouts...</div>';

            try {
                const apiUrl = `/api/showing/${showingId}`;                
                const response = await fetch(apiUrl); //asks code to wait (pause) till load
                
                if (!response.ok) throw new Error(`Network error: ${response.status}`);
                const data = await response.json();  //parse raw text data into js object              
                renderSeatMap(data, container);
            } catch(err) {
                console.error("Error loading seat matrix:", err);
                container.innerHTML = `<p class="text-danger">Failed to load layout room details. Error: ${err.message}</p>`;
            }
        });
    });

    function renderSeatMap(data, containerElement) {
        containerElement.innerHTML = ''; //removes any previous text

        const screenDiv = document.createElement('div');
        screenDiv.className = `p-2 mb-5 rounded text-center text-uppercase fw-bold text-muted`;
        screenDiv.style.background = 'linear-gradient(to bottom, #3a3a4a, #15151c)';
        screenDiv.style.borderTop = '3px solid #E50914';
        screenDiv.style.fontSize = '0.8rem';
        screenDiv.style.letterSpacing = '2px';
        screenDiv.innerText = `${data.screenName} (${data.type} SCREEN)`;
        containerElement.appendChild(screenDiv);
        data.rows.forEach(row => { //looping through the rows array in json file and wrap each row with <div>
            const rowWrapper = document.createElement('div');
            rowWrapper.className = 'd-flex justify-content-center align-items-center mb-2 gap-2';

            const rowLabel = document.createElement('span');
            rowLabel.className = 'text-muted me-3 fw-bold';
            rowLabel.style.width = '20px';
            rowLabel.innerText = row.name;
            rowWrapper.appendChild(rowLabel); //this block adds the letter to the far left like A, B, C

            row.seats.forEach(seat => {
                const seatBtn = document.createElement('button');
                seatBtn.type = 'button';
                seatBtn.className = 'btn btn-sm m-1 p-2 rounded-2 transition-all';
                seatBtn.style.width = '35px';
                seatBtn.style.height = '35px';
                seatBtn.style.fontSize = '0.75rem'; 
                seatBtn.innerText = seat.number; //this block creates buttons on each seats 

                const seatIdentifier = `${row.name}-${seat.number}`; //creates a unique Text ID by combining name and number A-1

                if (!seat.available) {
                    seatBtn.className += ' btn-secondary disabled opacity-25'; //cheks if the seat is not available turns it gray; disabled
                } else {
                    seatBtn.className += ' btn-outline-secondary text-white border-secondary'; // if available, makes it clickable
                    
                    seatBtn.addEventListener('click', () => {
                        if (selectedSeats.includes(seatIdentifier)) {
                            selectedSeats = selectedSeats.filter(s => s !== seatIdentifier); //compares if the array contains seat, if yes, it disselects it
                            seatBtn.classList.remove('btn-danger');
                            seatBtn.classList.add('btn-outline-secondary', 'text-white');
                        } else {
                            if (selectedSeats.length >= 6) { //limit up to 6
                                alert("Maximum booking limit reached! You can only select up to 6 seats per transaction.");
                                return; // stop execution so the seat doesn't get added
                            }

                            selectedSeats.push(seatIdentifier); //adds selected seat into array
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