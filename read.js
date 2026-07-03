//======================================

//Core Requirement 1 - Movie Listing

//======================================

// get '/' route filters and feeds the database values to your index homepage
router.get('/', (req, res) => {
    const { genre, rating, sortByDate, search } = req.query; //reads query parameters from the URL
    const searchInput = (search || '').trim().toLowerCase();
    
    let filteredMovies = [...moviesData]; // Create a copy of the moviesData array to filter

    if (searchInput) {
        filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchInput) // Filter movies based on the search input, if text includes in array, it stays
        );
    }
    
    // (Filtering and sorting logic resides here - separated below under stretch goals)

    let userBookings = [];
    if (currentUser) { //if user login 
        try {
            const bookingData = fs.readFileSync('./data/bookings.json'); //read json file
            const allBookings = JSON.parse(bookingData); //convert json to js object
            userBookings = allBookings.filter(b => b.email === currentUser);
        } catch (error) {
            console.log("Error: bookings file is empty");
        }
    }

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




//======================================

//Core Requirement 2 — View Showings

//======================================



// Pulls the selected movie object and finds all associated showtimes from times.json
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





//======================================

//Core Requirement 3 - Seat Booking (Map & Multi-select)

//======================================

// Constructs the visual seat chart layout split into left/right halves
router.get('/booking/seats', (req, res) => {
    const movieId = parseInt(req.query.movieId); // movieId is passed as a query parameter in the URL, and we convert it to an integer using parseInt
    const showingId = parseInt(req.query.showingId); // showingId is also passed as a query parameter in the URL, and we convert it to an integer using parseInt
    const errorMsg = req.query.error || null;

    const selectedMovie = moviesData.find(m => m.id === movieId); // extract the exect movie object
    const selectedShowtime = timesData.find(t => t.showingId === showingId); // extract the exect showtime object
    const selectedLayout = showingsData.find(s => s.id === showingId); // extract the exect room layout object

    if (!selectedMovie || !selectedShowtime || !selectedLayout) {
        return res.redirect('/'); // if any of the selectedMovie, selectedShowtime, or selectedLayout is not found (i.e., they are undefined), the user is redirected to the home page.
    }

    let bookedSeatsList = [];
    try {
        const bookingData = fs.readFileSync('./data/bookings.json');
        const allBookings = JSON.parse(bookingData);
        
        const matchingBookings = allBookings.filter(b => 
            b.movieTitle === selectedMovie.title && b.showTime === selectedShowtime.time // filter the bookings to find those that match the selected movie title and showtime
        );
        
        bookedSeatsList = matchingBookings.flatMap(b => b.selectedSeats); // extract the selectedSeats from the matching bookings and flatten them into a single array
    } catch (error) {
        console.log("Bookings file read error or empty");
    }

    const rows = {};
    selectedLayout.rows.forEach(row => {
        const letter = row.name; 
        rows[letter] = rows[letter] || []; // construct theater map

        row.seats.forEach(seat => {
            const seatName = `${letter}${seat.number}`; // displays the seat name in the format of "A1", "B2"
            const isOccupied = bookedSeatsList.includes(seatName) || seat.available === false;  // a seat is blocked if it is already booked or if its availability is set to false in the showingsData

            rows[letter].push({
                id: seatName,
                name: seatName,
                num: seat.number, 
                isOccupied: isOccupied
            }); // push into a clean object array
        });
    });
    const seatLayout = Object.keys(rows).sort().map(letter => { // sort the rows alphabetically and map them to a new array
        const rowSeats = rows[letter];
        const half = Math.ceil(rowSeats.length / 2); // calculate the index to split the row into two halves
        
        return {
            letter: letter,
            left: rowSeats.slice(0, half),
            right: rowSeats.slice(half)
        }; // return an object with the row letter and the left and right halves of the row seats
    });

    res.render('seats', {
        movie: selectedMovie,
        showtime: selectedShowtime,
        seatLayout: seatLayout,
        screenName: selectedLayout.screenName,
        screenType: selectedLayout.type,
        error: errorMsg
    });
});





//======================================

// Core Requirement 3  - Seat Selection Limits

//======================================

// Middleware checks inside checkout route enforcing selection rules
let totalSeatsArray = [];
if (Array.isArray(selectedSeats)) {
    totalSeatsArray = selectedSeats;
} else if (selectedSeats) {
    totalSeatsArray = selectedSeats.split(',');
}

if (totalSeatsArray.length === 0) {
    const errorMsg = encodeURIComponent("Please select at least one seat.");
    return res.redirect(`/booking/seats?movieId=${movieId}&showingId=${showingId}&error=${errorMsg}`);
}

if (totalSeatsArray.length > 6) {
    const errorMsg = encodeURIComponent("You can only select up to 6 seats per booking.");
    return res.redirect(`/booking/seats?movieId=${movieId}&showingId=${showingId}&error=${errorMsg}`);
}






//=======================================

//Core Requirement 4 & 5 - Checkout Form, 
// Fake Reference, & Booking Summary

//=======================================


// Handles final check submission, random tokenization, and returns checkout values
router.post('/confirm-booking', (req, res) => {
    const { name, email, tickets, movieTitle, showTime, selectedSeats } = req.body;
    console.log("Selected Seats:", selectedSeats);
    const selectedSeatsArray = selectedSeats.split(',');

    // Fake Reference Generation (Requirement 4)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    currentUser = email;

    const bookingData = fs.readFileSync('./data/bookings.json');
    const jsonData = JSON.parse(bookingData);
    jsonData.push({
        bookingReference: bookingReference,
        name: name,
        email: currentUser,
        movieTitle: movieTitle,
        showTime: showTime,
        selectedSeats: selectedSeatsArray,
        tickets: tickets,
    });

    // (Seat persistence block executes here...)

    fs.writeFileSync('./data/bookings.json', JSON.stringify(jsonData, null, 2));

    // Renders complete compilation profile back to front-end (Requirement 5 Summary)
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

//======================================

//Stretch Goal - Advanced Filtering & Sorting (Rating, Genre, Date)

//======================================

// Placed inside the GET '/' home controller to execute queries dynamically
if (genre) {
    filteredMovies = filteredMovies.filter(movie => movie.genre === genre);
}

if (rating){
    filteredMovies = filteredMovies.filter(movie => movie.rating === rating);
}

if (sortByDate === 'dateAsc' || sortByDate === 'dateDesc') { 
    filteredMovies.sort((movieA, movieB) => {
        const timesA = timesData.filter(t => String(t.movieId) === String(movieA.id)); 
        const timesB = timesData.filter(t => String(t.movieId) === String(movieB.id)); 

        const dateA = new Date(timesA[0] ? timesA[0].date : ''); 
        const dateB = new Date(timesB[0] ? timesB[0].date : '');

        if (sortByDate === 'dateAsc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
}


//======================================

//Stretch Goal - Dynamic Pricing JSON Matching

//======================================

// Injects localized multi-currency data from prices.json matched by active screen selection
try {
    const dynamicShowings = JSON.parse(fs.readFileSync('./data/showings.json')); 
    const pricesData = JSON.parse(fs.readFileSync('./data/prices.json'));

    const selectedLayout = dynamicShowings.find(s => s.id === timeId);    
    if (selectedLayout) {
        const pricingMatch = pricesData.find(p => p.movieId === parseInt(movieId) && p.screenName === selectedLayout.screenName);
        if (pricingMatch) {
            unitAmount = parseFloat(pricingMatch.amount);
            currencySymbol = pricingMatch.currency || '£';
        }
    }
} catch (err) {
    console.log("Error reading price layout configuration maps:", err.message);
}




//=======================================
//Stretch Goal - Server Seat Persistence (Locking booked layouts)
//=======================================

// Flips the active 'available' booleans inside showingsData file instantly upon user order validation
const movieId = moviesData.find(m => m.title === movieTitle).id;
const showingId = timesData.find(t => t.time === showTime && t.movieId === movieId).showingId;
const purchasedSeats = selectedSeatsArray;

const selectedLayout = showingsData.find(s => s.id === showingId);
if (selectedLayout) {
    selectedLayout.rows.forEach(row => {
        row.seats.forEach(seat => {
            const seatId = `${row.name}${seat.number}`;
            if (purchasedSeats.includes(seatId)) {
                seat.available = false; // Mark seat unavailable for future page requests
            }
        });
    });
}



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