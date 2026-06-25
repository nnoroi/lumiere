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
// DEMO FALLBACK: ISOLATED EXPLICIT CHECKOUT ROUTING LOGIC
// ========================================================
app.get('/checkout-summary', (req, res) => {
    const movieId = req.query.movieId;
    const selectedTime = req.query.time || "20:00";
    const selectedSeats = req.query.seats || "A1, A2";
    const totalTickets = req.query.tickets || 2;

    // FIX: Using the exact same matching logic as your teammate's route above
    const selectedMovie = moviesData.find(m => m.id === movieId || m.id === parseInt(movieId)) || moviesData[0];

    res.render('checkout', { 
        movie: selectedMovie,
        time: selectedTime,
        seats: selectedSeats,
        tickets: totalTickets
    });
});

// Listen for when someone clicks "Confirm & Purchase"
app.post('/confirm-booking', (req, res) => {
    const { name, email, tickets, movieTitle, showTime, selectedSeats } = req.body;

    // Demo Code Generation
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    // Send the receipt layout straight back to the screen
    res.send(`
        <div style="background: #212529; color: white; padding: 40px; font-family: sans-serif; text-align: center; max-width: 500px; margin: 50px auto; border-radius: 10px; border: 2px solid #ffc107;">
            <h2 style="color: #ffc107; font-weight: bold;">🎉 Booking Confirmed</h2>
            <hr style="border-color: #495057; margin: 20px 0;">
            <p style="font-size: 1.1rem;"><strong>Confirmation Code:</strong> <span style="background: #ffc107; color: black; padding: 4px 10px; border-radius: 4px; font-weight: bold;">${bookingReference}</span></p>
            <div style="text-align: left; background: #343a40; padding: 20px; border-radius: 6px; margin-top: 20px;">
                <p><strong>Movie:</strong> ${movieTitle}</p>
                <p><strong>Showtime:</strong> ${showTime}</p>
                <p><strong>Seats:</strong> ${selectedSeats}</p>
                <p><strong>Tickets:</strong> ${tickets}</p>
                <hr style="border-color: #495057;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
            </div>
            <a href="/" style="display: inline-block; margin-top: 25px; color: #ffc107; text-decoration: none; font-weight: bold; border: 1px solid #ffc107; padding: 8px 20px; border-radius: 4px;">Return Home</a>
        </div>
    `);
});