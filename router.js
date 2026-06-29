// const moviesData = require('./data/movies.json'); 
// const timesData = require('./data/times.json');
// const showingsData = require('./data/showings.json');


// app.get('/', (req, res) => {
//     res.render('index', { movies: moviesData }); 
// });

// app.get("/booking", (req, res) => {
//   const movieId = req.query.movieId;
//   const selectedMovie = moviesData.find(m => m.id === parseInt(movieId)); // checks if the movie exists in json
  
//   if (!selectedMovie) {
//     return res.status(404).send("Movie not found");
//   }
  
//   const movieTimes = timesData.filter(t => t.movieId === selectedMovie.id);
  
//   res.render('booking', { movie: selectedMovie, showtimes: movieTimes });
// });

// app.get('/api/showing/:id', (req, res) => {
//   const showingId = parseInt(req.params.id);
//   const showingLayout = showingsData.find(s => s.id === showingId);
  
//   if (!showingLayout){
//     return res.status(404).json({ error: "Showing session layout not found" });
//   }
//   res.json(showingLayout);
// });