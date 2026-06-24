// public/app.js

// 1. Grab our search elements
const searchInput = document.getElementById('searchInput');
const searchForm = document.getElementById('searchForm');
const movieContainer = document.getElementById('movie-container');

// 2. We can select all the movie cards currently on the screen for instant searching
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const movieCards = movieContainer.querySelectorAll('.col-md-4');

    movieCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        // If the movie title matches the search text, show it, otherwise hide it!
        if (title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

if (searchForm) {
    searchForm.addEventListener('submit', (e) => e.preventDefault());
}