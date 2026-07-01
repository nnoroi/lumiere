// routes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const moviesData = require('./data/movies.json'); 
const timesData = require('./data/times.json');
const usersFile = path.join(__dirname, './data/users.json');

let currentUser = null;

router.get('/', (req, res) => {
    const { genre, rating, sortByDate, search } = req.query;
    const searchInput = (search || '').trim().toLowerCase();
    
    let filteredMovies = [...moviesData];

    if (searchInput) {
        filteredMovies = filteredMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchInput)
        );
    }
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

    const selectedSort = req.query.sortByDate;
    if (selectedSort === 'dateAsc' || selectedSort === 'dateDesc') {
        filteredMovies.sort((movieA, movieB) => {
            const timesA = timesData.filter(t => String(t.movieId) === String(movieA.id));
            const timesB = timesData.filter(t => String(t.movieId) === String(movieB.id));

            const dateA = new Date(timesA[0] ? timesA[0].date : '');
            const dateB = new Date(timesB[0] ? timesB[0].date : '');

            if (selectedSort === 'dateAsc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
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
    
    const dynamicShowings = JSON.parse(fs.readFileSync('./data/showings.json'));
    const selectedLayout = dynamicShowings.find(s => s.id === showingId);

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

    const flatSeats = selectedLayout.rows.flatMap(row =>
        row.seats.map(seat => {
            const seatName = `${row.name}${seat.number}`;
            
            const isOccupied = bookedSeatsList.includes(seatName) || seat.available === false;
            return {
                id: seatName,
                name: seatName,
                isOccupied: isOccupied
            };
        })
    );

    res.render('seats', {
        movie: selectedMovie,
        showtime: selectedShowtime,
        seats: flatSeats,
        screenName: selectedLayout.screenName,
        screenType: selectedLayout.type
    });
});

router.get('/checkout', (req, res) => {
    const { movieId, showingId, selectedSeats } = req.query;
    const timeId = parseInt(showingId);
    const matchingTimeObj = timesData.find(t => t.showingId === timeId);
    const selectedMovie = moviesData.find(m => m.id === parseInt(movieId));

    const totalSeatsArray = Array.isArray(selectedSeats) ? selectedSeats : [selectedSeats];
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
    const selectedSeatsArray = selectedSeats.split(',');

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    currentUser = email;

    // 1. Read, update, and save to bookings.json
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

    const userData = fs.readFileSync(usersFile);
    const registeredUser = JSON.parse(userData);

    const foundUser = registeredUser.find(u => u.username === username && u.password === password);

    if (foundUser) {
        currentUser = foundUser.email;
        res.redirect('/');
    } else {
        res.redirect('/account?mode=login')
    };
});

router.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/');
});

module.exports = router;