let movies = [];
let nextPage = 1;
let currentQuery = "";

const state = function() {
  return {
    movies,
    nextPage,
    currentQuery
  };
};

const appendMovies = function(movieList) {
  movieList.forEach(movie => {
    movies.push(movie);
  });
};

const incrementPage = function() {
  nextPage += 1;
};

const resetMovies = function() {
  movies = [];
  nextPage = 1;
  currentQuery = "";
};

const setQuery = function(query) {
  currentQuery = query;
};

export { state, appendMovies, incrementPage, resetMovies, setQuery };
