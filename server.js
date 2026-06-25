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