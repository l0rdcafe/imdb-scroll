const OMDB_URL = "https://www.omdbapi.com";
const API_KEY = "843baf87";

const getMovies = function(nextPage, query) {
  function getJSON(url) {
    const headers = new Headers();
    headers.append("Accept", "application/json");

    return fetch(url, { headers })
      .then(res => {
        const contentType = res.headers.get("Content-Type");

        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        }
        return res.text();
      })
      .catch(err => Promise.reject(err));
  }
  function getMovieByQuery() {
    return getJSON(`${OMDB_URL}?page=${nextPage}&s=${query}&apiKey=${API_KEY}`);
  }

  function parseSearchResponse(res) {
    if (res.Response === "False") {
      return Promise.reject(new Error(res.Error));
    }
    return res;
  }

  function getMoviePlots(res) {
    const movies = res.Search;
    const total = parseInt(res.totalResults, 10);

    const movieFetches = movies.map(movie =>
      getJSON(`${OMDB_URL}?page=${nextPage}&i=${movie.imdbID}&apiKey=${API_KEY}`)
    );

    return Promise.all(movieFetches)
      .then(moviesWithPlots => ({ movies: moviesWithPlots, total }))
      .catch(err => {
        Promise.reject(err);
      });
  }

  return getMovieByQuery()
    .then(parseSearchResponse)
    .then(getMoviePlots)
    .catch(err => Promise.reject(err));
};
export { getMovies };
