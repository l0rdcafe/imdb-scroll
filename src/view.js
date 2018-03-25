const $ = require("jquery");

const notFound = "assets/notfound.jpg";
const render = function(state) {
  const { movies } = state();
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

export { render, drawSpinner, removeSpinner, drawErrorNotif };
