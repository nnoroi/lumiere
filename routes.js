// routes.js
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

const ADMIN_USER = 'abid'
const ADMIN_PASS = 'dymytrii'

router.get('/', (req, res) => {
    const {genre, rating, sortByDate} = req.query;
    let filteredMovies = moviesData;

    if (genre) {
        filteredMovies = filteredMovies.filter(movie => movie.genre === genre);
    }
    if (rating){
        filteredMovies = filteredMovies.filter(movie => movie.rating === rating);
    }

    let userBookings = [];

    if (currentUser) {
        try {
            const bookingData = fs.readFileSync('./data/bookings.json');
            const allBookings = JSON.parse(bookingData);
            userBookings = allBookings.filter(b => b.email === currentUser);
        } catch (error) {
            console.log("Error: bookings file is empty");
        }
    }

    res.render('index', { 
        movies: filteredMovies, 
        selectedGenre: genre, 
        selectedRating: rating, 
        selectedSort: sortByDate,  // ADDED
        user: currentUser, 
        bookings: userBookings
    });
});

router.get("/booking", (req, res) => {
    const movieId = req.query.movieId;
    const selectedMovie = moviesData.find(m => m.id === parseInt(movieId));
    
    if (!selectedMovie) {
        return res.status(404).send("Movie not found");
    }
    
    const movieTimes = timesData.filter(t => t.movieId === selectedMovie.id);
    res.render('booking', { movie: selectedMovie, showtimes: movieTimes });
});

router.get('/booking/seats', (req, res) => {
    const movieId = parseInt(req.query.movieId);
    const showingId = parseInt(req.query.showingId);

    const selectedMovie = moviesData.find(m => m.id === movieId);
    const selectedShowtime = timesData.find(t => t.showingId === showingId);
    const selectedLayout = showingsData.find(s => s.id === showingId);

    if (!selectedMovie || !selectedShowtime || !selectedLayout) {
        return res.redirect('/');
    }

    let bookedSeatsList = [];
    try {
        const bookingData = fs.readFileSync('./data/bookings.json');
        const allBookings = JSON.parse(bookingData);
        
        const matchingBookings = allBookings.filter(b => 
            b.movieTitle === selectedMovie.title && b.showTime === selectedShowtime.time
        );
        
        bookedSeatsList = matchingBookings.flatMap(b => b.selectedSeats);
    } catch (error) {
        console.log("Bookings file read error or empty");
    }

    const rows = {};
    selectedLayout.rows.forEach(row => {
        const letter = row.name; 
        rows[letter] = rows[letter] || [];

        row.seats.forEach(seat => {
            const seatName = `${letter}${seat.number}`;
            const isOccupied = bookedSeatsList.includes(seatName) || seat.available === false;

            rows[letter].push({
                id: seatName,
                name: seatName,
                num: seat.number, 
                isOccupied: isOccupied
            });
        });
    });
    const seatLayout = Object.keys(rows).sort().map(letter => {
        const rowSeats = rows[letter];
        const half = Math.ceil(rowSeats.length / 2);
        
        return {
            letter: letter,
            left: rowSeats.slice(0, half),
            right: rowSeats.slice(half)
        };
    });

    res.render('seats', {
        movie: selectedMovie,
        showtime: selectedShowtime,
        seatLayout: seatLayout,
        screenName: selectedLayout.screenName,
        screenType: selectedLayout.type
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
    
    const totalTickets = totalSeatsArray.length;

    res.render('checkout', { 
        movie: selectedMovie,
        time: matchingTimeObj.time,
        seats: totalSeatsArray,
        tickets: totalTickets
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
    }
    console.log(purchasedSeats);
    fs.writeFileSync('./data/bookings.json', JSON.stringify(jsonData, null, 2));

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