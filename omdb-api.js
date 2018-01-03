/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

import axios from "npm:axios";

const OMDB_URL = "https://www.omdbapi.com";
const API_KEY = "843baf87";

const getMovies = function(nextPage, query) {
  function getJSON(url) {
    return axios
      .get(url)
      .then(res => res.data)
      .catch(err => Promise.reject(err));
  }
  function getMovieByQuery() {
    return Promise.race([
      getJSON(`${OMDB_URL}?page=${nextPage}&s=${query}&apiKey=${API_KEY}`),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("Request Timeout")), 4000);
      })
    ]);
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
export default { getMovies };
