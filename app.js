// 1. Grab the HTML container where we want to display movies
const movieContainer = document.getElementById('movie-container');

// 2. Fetch the movie data from your local folder
fetch('./data/movies.json')
    .then(response => response.json())
    .then(movies => {
        // 3. Loop through each movie in your array
        movies.forEach(movie => {
            // 4. Create a Bootstrap card structure for each movie
            const movieCard = `
                <div class="col-md-4">
                    <div class="card bg-secondary text-white h-100">
                        <img src="${movie.poster}" class="card-img-top" alt="${movie.title} poster">
                        <div class="card-body">
                            <h5 class="card-title fw-bold">${movie.title}</h5>
                            <p class="card-text mb-1"><strong>Genre:</strong> ${movie.genre}</p>
                            <p class="card-text mb-1"><strong>Duration:</strong> ${movie.duration}</p>
                            <span class="badge bg-warning text-dark">${movie.rating}</span>
                        </div>
                        <div class="card-footer border-0 bg-transparent">
                            <a href="booking.html?movieId=${movie.id}" class="btn btn-primary w-100">Book Tickets</a>
                        </div>
                    </div>
                </div>
            `;
            // 5. Append the card into our HTML page container
            movieContainer.innerHTML += movieCard;
        });
    })
    .catch(error => console.error('Error loading movies:', error));