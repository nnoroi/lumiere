const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const moviesData = require('./data/movies.json'); 
const timesData = require('./data/times.json');
const showingsData = require('./data/showings.json');
const usersFile = path.join(__dirname, './data/users.json');

let currentUser = null;
let isAdmin = false;

const ADMIN_USER = 'abid';
const ADMIN_PASS = 'dymytrii';

router.get('/', (req, res) => {
    const { genre, rating, sortByDate, search } = req.query; //reads query parameters from the URL
    const searchInput = (search || '').trim().toLowerCase();
    
    let filteredMovies = [...moviesData]; // Create a copy of the moviesData array to filter

    if (searchInput) {
        filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchInput) // Filter movies based on the search input, if text includes in array, it stays
        );
    }

    if (genre) {
        filteredMovies = filteredMovies.filter(movie => movie.genre === genre);
    }

    if (rating){
        filteredMovies = filteredMovies.filter(movie => movie.rating === rating);
    }

    if (sortByDate === 'dateAsc' || sortByDate === 'dateDesc') { // if user selects sort option, this chunk of code triggers
        filteredMovies.sort((movieA, movieB) => {
            const timesA = timesData.filter(t => String(t.movieId) === String(movieA.id)); // filter timesData to get showtimes for movieA
            const timesB = timesData.filter(t => String(t.movieId) === String(movieB.id)); // same to movieB

            const dateA = new Date(timesA[0] ? timesA[0].date : ''); // if showtime object exists, exctracts date and pass it to js date() to turn it into real date obj
            const dateB = new Date(timesB[0] ? timesB[0].date : '');

            if (sortByDate === 'dateAsc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    }

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



router.post('/checkout', (req, res) => {
    const { movieId, showingId, selectedSeats } = req.body;
    const timeId = parseInt(showingId);
    const matchingTimeObj = timesData.find(t => t.showingId === timeId);
    const selectedMovie = moviesData.find(m => m.id === parseInt(movieId));

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

    const totalTickets = totalSeatsArray.length;

    let unitAmount = 0;
    let currencySymbol = '£';
    
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

    const totalAmount = (unitAmount * totalTickets).toFixed(2);

    res.render('checkout', { 
        movie: selectedMovie,
        time: matchingTimeObj ? matchingTimeObj.time : '',
        seats: totalSeatsArray,
        tickets: totalTickets,
        unitPrice: unitAmount.toFixed(2), 
        totalPrice: totalAmount,          
        currency: currencySymbol          
    });
});



router.post('/confirm-booking', (req, res) => {
    const { name, email, tickets, movieTitle, showTime, selectedSeats } = req.body;
    console.log("Selected Seats:", selectedSeats);
    const selectedSeatsArray = selectedSeats.split(',');

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

    const movieId = moviesData.find(m => m.title === movieTitle).id;
    const showingId = timesData.find(t => t.time === showTime && t.movieId === movieId).showingId;
    const purchasedSeats = selectedSeatsArray;

    const selectedLayout = showingsData.find(s => s.id === showingId);
    if (selectedLayout) {
        selectedLayout.rows.forEach(row => {
            row.seats.forEach(seat => {
                const seatId = `${row.name}${seat.number}`;
                if (purchasedSeats.includes(seatId)) {
                    seat.available = false;
                }
            });
        });
    }   // This Express.js backend manages a cinema system using JSON files as a database.
        //  It processes movie searching, sorting, and live seat maps while calculating ticket pricing dynamically. 
        // It also registers bookings and manages user and admin logins.
    console.log(purchasedSeats);
    fs.writeFileSync('./data/bookings.json', JSON.stringify(jsonData, null, 2)); // formatting the JSON data with indentation for better readability

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



router.get(`/account`, (req, res) => {
    if (currentUser) {
        let userBookings = [];
        try {
            const bookingData = fs.readFileSync('./data/bookings.json');
            const allBookings = JSON.parse(bookingData);
            userBookings = allBookings.filter(b => b.email === currentUser);
        } catch (error){
            console.log("Error");
        }
        return res.render('account_info', {
            email: currentUser,
            bookings: userBookings
        });
    }
    let currentMode;
    if (req.query.mode === "signup") {
        currentMode = "signup";
    } else {
        currentMode = "login";
    }
    res.render('account', {mode: currentMode});
});



router.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    const userData = fs.readFileSync(usersFile);
    const registeredUsers = JSON.parse(userData);

    registeredUsers.push({
        email: email,
        username: username,
        password: password
    });
    fs.writeFileSync(usersFile, JSON.stringify(registeredUsers, null, 2));

    currentUser = email;
    res.redirect('/');
});



router.post('/login', (req, res) => {
    const {username, password} = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        isAdmin = true;
        return res.redirect('/admin');
    }

    const userData = fs.readFileSync(usersFile);
    const registeredUser = JSON.parse(userData);

    const foundUser = registeredUser.find(u => u.username === username && u.password === password);

    if (foundUser) {
        currentUser = foundUser.email;
        isAdmin = false;
        res.redirect('/');
    } else {
        res.redirect('/account?mode=login')
    };
});




router.get('/logout', (req, res) => {
    currentUser = null;
    isAdmin = false;
    res.redirect('/');
});

router.get('/admin', (req, res) => {
    if (!isAdmin) return res.redirect('/account?mode=login');
    res.render('admin_panel', { success: null, error: null });
});




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

module.exports = router;