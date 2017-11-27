var model = {};
var view = {};
var omdbService = (function () {
  var omdbUrl = 'https://www.omdbapi.com';
  var API_KEY = '843baf87';

  var getMovies = function (nextPage, query) {
    function getJson(url) {
      return fetch(url)
          .then(function (req) {
            return req.json();
          })
          .catch(function (err) {
            return Promise.reject(err);
          });
    }
    function getMovieByQuery() {
      return getJson(omdbUrl + '?page=' + nextPage + '&s=' + query + '&apiKey=' + API_KEY);
    }

    function parseSearchResponse(res) {
      if (res.Response === 'False') {
        return Promise.reject(new Error(res.Error));
      }
      return res;
    }

    function getMoviePlots(res) {
      var movies = res.Search;
      var total = parseInt(res.totalResults, 10);

      var movieFetches = movies.map(function (movie) {
        return getJson(omdbUrl + '?page=' + nextPage + '&i=' + movie.imdbID + '&apiKey=' + API_KEY);
      });

      return Promise.all(movieFetches)
        .then(function (moviesWithPlots) {
          return { movies: moviesWithPlots, total: total };
        })
        .catch(function (err) {
          Promise.reject(err);
        });
    }

    return getMovieByQuery()
      .then(parseSearchResponse)
      .then(getMoviePlots)
      .catch(function (err) {
        return Promise.reject(err);
      });
  };
  return {
    getMovies: getMovies
  };
}());

var handlers = (function () {
  var isFetching = false;
  var processMovies = function (results) {
    var newMovies = results.movies;
    var pagesLeft = _.ceil(results.total / 10);

    $('.loading').remove();

    if (results.total !== 0) {
      newMovies.forEach(function (movie) {
        model.movies.push(movie);
      });
      if (pagesLeft > model.nextPage) {
        model.nextPage += 1;
        handlers.getMore();
      }
    } else {
      view.drawErrorNotif('Could not find results for ' + model.currentQuery);
    }
    view.render();
  };

  var handleError = function (e) {
    $('.loading').remove();
    view.drawErrorNotif(e);
  };

  var newSearch = function () {
    var firstSearch = function () {
      var movieVal = $('#movie-field').val();
      if (movieVal.match(/^[a-z0-9]+( [a-z0-9]+)*$/i)) {
        view.drawSpinner();
        model.movies = [];
        model.currentQuery = movieVal;
        model.nextPage = 1;
        $('#movie-list').val('');

        omdbService.getMovies(model.nextPage, model.currentQuery)
          .then(processMovies)
          .catch(handleError);
      }
    };

    $('#movie-field').on('keydown', _.debounce(firstSearch, 400));
  };

  var getMore = function () {
    var moreResults = function () {
      var pxFromWindowToBtm = 0 + (($(document).height() - $(window).scrollTop()) - $(window).height());

      if (isFetching) {
        return;
      }

      if (pxFromWindowToBtm < 50) {
        isFetching = true;
        view.drawSpinner();
        omdbService.getMovies(model.nextPage, model.currentQuery)
          .then(function (res) {
            processMovies(res);
            isFetching = false;
          })
          .catch(function (err) {
            handleError(err);
            isFetching = false;
          });
      }
    };

    $(window).on('scroll', _.throttle(moreResults, 2400));
  };

  return {
    newSearch: newSearch,
    getMore: getMore
  };
}());

view.render = function () {
  var movies = model.movies;
  var listChildrenNum = $('#movie-list').children().length;
  var drawMovies = function (movie) {
    var moviePoster;
    var moviePlot;
    var movieRating;

    if (movie.Poster !== 'N/A') {
      moviePoster = '<img class="column is-3 is-12-mobile" src="' + movie.Poster + '">';
    } else {
      moviePoster = '<img class="column is-3 is-12-mobile" src="' + view.notFound + '">';
    }

    if (movie.Plot) {
      moviePlot = '<p class="subtitle has-text-centered-mobile">' + movie.Plot + '</p>';
    }

    if (movie.imdbRating) {
      movieRating = '<span class="column is-1 has-text-centered">' + movie.imdbRating + '/10</span>';
    }

    $('#movie-list').append('<li class="movie columns column">' + moviePoster + '<span class="movie-title column is-5 is-12-mobile has-text-centered-mobile">' + movie.Title + moviePlot + '</span><span class="column is-2 is-offset-1-tablet is-12-mobile has-text-centered-mobile date">' + movie.Year + '</span>' + movieRating + '</li>');
  };

  if (listChildrenNum === 0 || movies.length <= 10) {
    $('#movie-list').html('');
    movies.forEach(drawMovies);
  } else {
    movies.slice(listChildrenNum).forEach(drawMovies);
  }
};

view.drawErrorNotif = function (text) {
  var $notif = $('<div class="is-danger notification column is-8-mobile">' + text + '</div>');
  $('#movie-list').before($notif.hide().fadeIn(250));
  setTimeout(function () {
    $notif.fadeOut();
  }, 2500);
};

view.drawSpinner = function () {
  if ($('.loading').length > 1) {
    $('.loading').remove();
  }
  $('#movie-list').append('<span class="xcentered has-text-centered loading"><i class="fa fa-spinner fa-spin fa-lg" aria-hidden="true"></i></span>');
};

view.notFound = 'assets/notfound.jpg';

$(document).ready(function () {
  handlers.newSearch();
});
