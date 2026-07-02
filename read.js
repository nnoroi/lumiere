//Core Requirement 1 — Movie Listing

router.get('/', (req, res) => {
    const { genre, rating, sortByDate, search } = req.query; //reads query parameters from the URL
    const searchInput = (search || '').trim().toLowerCase();
    
    let filteredMovies = [...moviesData]; // Create a copy of the moviesData array to filter

    if (searchInput) {
        filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchInput) // Filter movies based on the search input
        );
    }

    if (genre) {
        filteredMovies = filteredMovies.filter(movie => movie.genre === genre);
    }

    if (rating){
        filteredMovies = filteredMovies.filter(movie => movie.rating === rating);
    }
    // ... [Sorting code is executed here] ...

    res.render('index', { 
        movies: filteredMovies, 
        selectedGenre: genre || '', 
        selectedRating: rating || '', 
        selectedSort: sortByDate || '',
        currentSearch: search || '', 
        user: currentUser, 
        bookings: userBookings
    });
});



//Core Requirement 2 — View Showings

router.get("/booking", (req, res) => {
    const movieId = req.query.movieId;
    const selectedMovie = moviesData.find(m => m.id === parseInt(movieId)); // search through the array, finds id and assigns it to selectedMovie variable
    
    if (!selectedMovie) {
        return res.status(404).send("Movie not found");
    }
    
    const movieTimes = timesData.filter(t => t.movieId === selectedMovie.id); // filter through timesData array, finds all showtimes 
                                                                            // for the selected movie and assigns it to movieTimes variable
    res.render('booking', { movie: selectedMovie, showtimes: movieTimes });
});




//Core Requirement 3 — Seat Booking

// PART A: Generating and rendering the seat map grid
router.get('/booking/seats', (req, res) => {
    // ... [Validations & loading booking histories] ...
    const rows = {};
    selectedLayout.rows.forEach(row => {
        const letter = row.name; 
        rows[letter] = rows[letter] || []; // construct theater map

        row.seats.forEach(seat => {
            const seatName = `${letter}${seat.number}`; // displays the seat name in the format of "A1", "B2"
            // Constraint: Checking if seat is already booked or structurally marked unavailable
            const isOccupied = bookedSeatsList.includes(seatName) || seat.available === false; 

            rows[letter].push({
                id: seatName,
                name: seatName,
                num: seat.number, 
                isOccupied: isOccupied
            }); 
        });
    });
    // ... [Formatting grid layout and rendering 'seats' page] ...
});

// PART B: Enforcing the selection limits during checkout preparation
router.post('/checkout', (req, res) => {
    const { movieId, showingId, selectedSeats } = req.body;
    let totalSeatsArray = Array.isArray(selectedSeats) ? selectedSeats : (selectedSeats ? selectedSeats.split(',') : []);

    if (totalSeatsArray.length === 0) {
        const errorMsg = encodeURIComponent("Please select at least one seat.");
        return res.redirect(`/booking/seats?...error=${errorMsg}`);
    }

    // Constraint enforcement: Max 6 seats limit
    if (totalSeatsArray.length > 6) {
        const errorMsg = encodeURIComponent("You can only select up to 6 seats per booking.");
        return res.redirect(`/booking/seats?...error=${errorMsg}`);
    }
    // ...
});





//Core Requirement 4 — Checkout

router.post('/confirm-booking', (req, res) => {
    // Collects Name, Email, tickets summary, and selected seats from form submission
    const { name, email, tickets, movieTitle, showTime, selectedSeats } = req.body;
    const selectedSeatsArray = selectedSeats.split(',');

    // Requirement: Generate fake booking reference (e.g., CIN-XXXX)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    // ... [Saves to JSON / updates local seats state] ...

    // Requirement: Show confirmation page with the payload data
    res.render('confirm-booking', {
        bookingReference,
        movieTitle,
        showTime,
        selectedSeats,
        tickets,
        name,
        email,
    });
});



//Core Requirement 5 — Booking Summary
res.render('confirm-booking', {
    bookingReference, // Maps to: Confirmation code
    movieTitle,       // Maps to: Movie
    showTime,         // Maps to: Time
    selectedSeats,    // Maps to: Seats
    tickets,          // Maps to: Total tickets
    name,             // Maps to: Customer name
    email,
});



 

// Admin Panel — Adding New Movies and Showings
router.post('/admin/add-movie', (req, res) => {
    if (!isAdmin) return res.redirect('/account?mode=login');

    const { title, poster, genre, duration, director, cast, country, description, rating, trailer, screenName, screenType, numRows, seatsPerRow, date, time } = req.body;

    const newMovieId = Math.max(...moviesData.map(m => m.id)) + 1;
    const newShowingId = Math.max(...showingsData.map(s => s.id)) + 1;

    const rowLetters = 'ABCD'.slice(0, parseInt(numRows)).split('');
    const rows = rowLetters.map(letter => ({
        name: letter,
        seats: Array.from({ length: parseInt(seatsPerRow) }, (_, i) => ({ number: i + 1, available: true }))
    }));

    const newMovie = {
        id: newMovieId,
        title, poster, genre,
        duration: parseInt(duration),
        director,
        cast: cast.split(',').map(c => c.trim()),
        country, description, rating, trailer
    };

    const newShowing = { id: newShowingId, type: screenType, screenName, rows };
    const newTime = { movieId: newMovieId, showingId: newShowingId, date, time };

    moviesData.push(newMovie);
    showingsData.push(newShowing);
    timesData.push(newTime);

    fs.writeFileSync('./data/movies.json', JSON.stringify(moviesData, null, 2));
    fs.writeFileSync('./data/showings.json', JSON.stringify(showingsData, null, 2));
    fs.writeFileSync('./data/times.json', JSON.stringify(timesData, null, 2));

    res.render('admin_panel', { success: `"${title}" added successfully.`, error: null });
});