const express = require('express');
const path = require('path');
const app = express();
const moviesData = require('./data/movies.json'); 
const timesData = require('./data/times.json')


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { movies: moviesData }); 
});

app.get("/booking", (req,res) => {
  const movieId = req.query.movieId;
  const selectedMovie = moviesData.find(m => m.id === movieId || m.id === parseInt(movieId)); // checks if the movie exists in json
  if (!selectedMovie) {
    return res.status(404).send("Movie not found");
  }
  const movieTimes = timesData.filter(t => t.movieId === selectedMovie.id || t.movieId === String(selectedMovie.id));
  res.render('booking', {movie: selectedMovie, showtimes: movieTimes});
});
app.listen(3000, () => {
  console.log('Express server running at http://localhost:3000/');
});












// ========================================================
// Checkout & Confirm Booking
// ========================================================
app.get('/checkout-summary', (req, res) => {
    const movieId = req.query.movieId;
    const selectedTime = req.query.time || "20:00";
    const selectedSeats = req.query.seats || "A1, A2";
    const totalTickets = req.query.tickets || 2;

    const selectedMovie = moviesData.find(m => m.id === movieId || m.id === parseInt(movieId)) || moviesData[0];

    res.render('checkout', { 
        movie: selectedMovie,
        time: selectedTime,
        seats: selectedSeats,
        tickets: totalTickets
    });
});

// Final Unified Booking Process Handler
app.post('/confirm-booking', (req, res) => {
    const { name, email, tickets, movieTitle, showTime, selectedSeats } = req.body;

    // Demo Code Generation
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    // Safely hand over data variables to your brand new template layout
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