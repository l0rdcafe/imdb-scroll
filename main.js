import $ from "jquery";
import _ from "lodash";

const model = (function() {
  const movies = [];
  const nextPage = 1;
  const currentQuery = "";

  const appendMovies = function(movieList) {
    movieList.forEach(movie => {
      model.movies.push(movie);
    });
  };

  const incrementPage = function() {
    model.nextPage += 1;
  };

  const resetMovies = function() {
    model.movies = [];
    model.nextPage = 1;
    model.currentQuery = "";
  };

  const setQuery = function(query) {
    model.currentQuery = query;
  };

  return {
    movies,
    nextPage,
    currentQuery,
    appendMovies,
    incrementPage,
    resetMovies,
    setQuery
  };
})();

const view = (function() {
  const notFound = "assets/notfound.jpg";
  const render = function() {
    const { movies } = model;
    const listChildrenNum = $("#movie-list").children().length;
    const drawMovies = function(movie) {
      let moviePoster;
      let moviePlot;
      let movieRating;

      if (movie.Poster !== "N/A") {
        moviePoster = `<img class="column is-3 is-12-mobile" src="${movie.Poster}">`;
      } else {
        moviePoster = `<img class="column is-3 is-12-mobile" src="${notFound}">`;
      }

      if (movie.Plot) {
        moviePlot = `<p class="subtitle has-text-centered-mobile">${movie.Plot}</p>`;
      }

      if (movie.imdbRating) {
        movieRating = `<span class="column is-1 has-text-centered">${movie.imdbRating}/10</span>`;
      }

      $("#movie-list").append(
        `<li class="movie columns column">${moviePoster}<span class="movie-title column is-5 is-12-mobile has-text-centered-mobile">${
          movie.Title
        }${moviePlot}</span><span class="column is-2 is-offset-1-tablet is-12-mobile has-text-centered-mobile date">${
          movie.Year
        }</span>${movieRating}</li>`
      );
    };

    if (listChildrenNum === 0 || movies.length <= 10) {
      $("#movie-list").html("");
      movies.forEach(drawMovies);
    } else {
      movies.slice(listChildrenNum).forEach(drawMovies);
    }
  };

  const drawSpinner = function() {
    $("#movie-list").append(
      '<span class="xcentered has-text-centered loading"><i class="fa fa-spinner fa-spin fa-lg" aria-hidden="true"></i></spa`n>'
    );
  };

  const removeSpinner = function() {
    $(".loading").remove();
  };

  const drawErrorNotif = function(text) {
    const $notif = $(`<div class="is-danger notification column is-8-mobile">${text}</div>`);
    $("#movie-list").before($notif.hide().fadeIn(250));
    setTimeout(() => {
      $notif.fadeOut();
    }, 2500);
  };

  return {
    render,
    drawSpinner,
    removeSpinner,
    drawErrorNotif
  };
})();

const OMDBApi = (function() {
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
  return {
    getMovies
  };
})();

const handlers = (function() {
  let isFetching = false;
  const processMovies = function(results) {
    const newMovies = results.movies;
    const pagesLeft = _.ceil(results.total / 10);

    view.removeSpinner();

    if (results.total !== 0) {
      model.appendMovies(newMovies);
      if (pagesLeft > model.nextPage) {
        model.incrementPage();
        handlers.getMore();
      }
    } else {
      view.drawErrorNotif(`Could not find results for ${model.currentQuery}`);
    }
    view.render();
  };

  const handleError = function(e) {
    view.removeSpinner();
    view.drawErrorNotif(e);
  };

  const newSearch = function() {
    const firstSearch = function() {
      const movieVal = $("#movie-field").val();

      if (isFetching) {
        return;
      }

      if (movieVal.match(/^[a-z0-9]+( [a-z0-9]+)*$/i)) {
        view.drawSpinner();
        isFetching = true;
        model.resetMovies();
        model.setQuery(movieVal);
        $("#movie-list").val("");

        OMDBApi.getMovies(model.nextPage, model.currentQuery)
          .then(res => {
            processMovies(res);
            isFetching = false;
          })
          .catch(err => {
            handleError(err);
            isFetching = false;
          });
      }
    };

    $("#movie-field").on("keydown", _.debounce(firstSearch, 400));
  };

  const getMore = function() {
    const moreResults = function() {
      const pxFromWindowToBtm = 0 + ($(document).height() - $(window).scrollTop() - $(window).height());

      if (isFetching) {
        return;
      }

      if (pxFromWindowToBtm < 50) {
        isFetching = true;
        view.drawSpinner();
        OMDBApi.getMovies(model.nextPage, model.currentQuery)
          .then(res => {
            processMovies(res);
            isFetching = false;
          })
          .catch(err => {
            handleError(err);
            isFetching = false;
          });
      }
    };

    $(window).on("scroll", _.throttle(moreResults, 2400));
  };

  return {
    newSearch,
    getMore
  };
})();

$(document).ready(() => {
  handlers.newSearch();
});
