const express = require('express');
const path = require('path');
const app = express();
const moviesData = require('./data/movies.json'); 
const timesData = require('./data/times.json');
const showingsData = require('./data/showings.json');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { movies: moviesData }); 
});

app.get("/booking", (req, res) => {
  const movieId = req.query.movieId;
  const selectedMovie = moviesData.find(m => m.id === parseInt(movieId)); // checks if the movie exists in json
  
  if (!selectedMovie) {
    return res.status(404).send("Movie not found");
  }
  
  const movieTimes = timesData.filter(t => t.movieId === selectedMovie.id);
  
  // Removed the broken moviesShowings line since layout data is fetched via the /api/showing/:id route instead
  res.render('booking', { movie: selectedMovie, showtimes: movieTimes });
});

// FIXED: Flipped parameters back to standard (req, res) order
app.get('/api/showing/:id', (req, res) => {
  const showingId = parseInt(req.params.id);
  const showingLayout = showingsData.find(s => s.id === showingId);
  
  if (!showingLayout){
    return res.status(404).json({ error: "Showing session layout not found" });
  }
  res.json(showingLayout);
});


app.listen(3000, () => {
  console.log('Express server running at http://localhost:3000/');
});