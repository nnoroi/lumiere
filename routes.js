// routes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');

const moviesData = require('./data/movies.json'); 
const timesData = require('./data/times.json');
const showingsData = require('./data/showings.json');

router.get('/', (req, res) => {
    res.render('index', { movies: moviesData }); 
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

    const flatSeats = selectedLayout.rows.flatMap(row =>
        row.seats.map(seat => ({
            id: `${row.name}${seat.number}`,
            name: `${row.name}${seat.number}`,
            isOccupied: !seat.available
        }))
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

    // selectedSeats is a string if 1 checkbox was checked,
    // or an array if multiple share the same name
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
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    const bookingData = fs.readFileSync('./data/bookings.json');
    const jsonData = JSON.parse(bookingData);
    jsonData.push({
        bookingReference: bookingReference,
        name: name,
        email: email,
        movieTitle: movieTitle,
        showTime: showTime,
        selectedSeats: selectedSeats,
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
    let currentMode;
    if (req.query.mode === "signup") {
        currentMode = "signup";
    } else {
        currentMode = "login";
    }
    res.render('account', {mode: currentMode});
});

module.exports = router;