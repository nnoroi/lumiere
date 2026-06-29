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

router.get('/api/showing/:id', (req, res) => {
    const showingId = parseInt(req.params.id);
    const showingLayout = showingsData.find(s => s.id === showingId);
    
    if (!showingLayout){
        return res.status(404).json({ error: "Showing session layout not found" });
    }
    res.json(showingLayout);
});

router.post('/checkout', (req, res) => {
    const { movieId, selectedTime, selectedSeats } = req.body;
    const timeId = parseInt(selectedTime);
    const matchingTimeObj = timesData.find(t => t.showingId === timeId);
    const selectedMovie = moviesData.find(m => m.id === parseInt(movieId));
    
    let totalSeatsArray = selectedSeats.split(",");
    const totalTickets = totalSeatsArray.length;

    res.render('checkout', { 
        movie: selectedMovie,
        time: matchingTimeObj.time,
        seats: selectedSeats,
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

module.exports = router; 