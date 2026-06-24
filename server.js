const express = require('express');
const path = require('path');
const app = express();
const moviesData = require('./data/movies.json'); 

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { movies: moviesData }); 
});

app.listen(3000, () => {
  console.log('Express server running at http://localhost:3000/');
});