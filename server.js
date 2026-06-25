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
// CORE REQUIREMENT 4 - ISOLATED CHECKOUT MODULE
// ========================================================

// 1. GET Route: Renders your standalone checkout form
app.get('/booking', (req, res) => {
    const selectedMovie = moviesData.find(m => m.id == req.query.movieId) || moviesData[0];
    res.render('checkout', { movie: selectedMovie });
});

// 2. POST Route: Intercepts form data and generates the mandatory CIN- reference
app.post('/confirm-booking', (req, res) => {
    const { name, email, tickets } = req.body;

    // Requirement 4: Generate fake booking reference (Example: CIN-2847)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `CIN-${randomDigits}`;

    res.send(`
        <div style="background: #212529; color: white; padding: 40px; font-family: sans-serif; text-align: center; max-width: 500px; margin: 50px auto; border-radius: 10px; border: 2px solid #ffc107;">
            <h2 style="color: #ffc107; font-weight: bold;">🎉 Booking Confirmed</h2>
            <hr style="border-color: #495057; margin: 20px 0;">
            <p style="font-size: 1.2rem;"><strong>Confirmation Code:</strong> <span style="background: #ffc107; color: black; padding: 2px 8px; border-radius: 3px;">${bookingReference}</span></p>
            <div style="text-align: left; background: #343a40; padding: 20px; border-radius: 5px; margin-top: 20px;">
                <p style="margin-bottom: 8px;"><strong>Customer Name:</strong> ${name}</p>
                <p style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</p>
                <p style="margin-bottom: 0;"><strong>Total Tickets:</strong> ${tickets} / 6 max</p>
            </div>
            <a href="/booking" style="display: inline-block; margin-top: 25px; color: #ffc107; text-decoration: none; font-weight: bold;">← New Booking</a>
        </div>
    `);
});