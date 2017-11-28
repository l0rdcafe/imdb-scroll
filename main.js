var model = (function () {
  var movies = [];
  var nextPage = 1;
  var currentQuery = '';

  var appendMovies = function (movieList) {
    movieList.forEach(function (movie) {
      model.movies.push(movie);
    });
  };

  var incrementPage = function () {
    model.nextPage += 1;
  };

  var resetMovies = function () {
    model.movies = [];
    model.nextPage = 1;
    model.currentQuery = '';
  };

  var setQuery = function (query) {
    model.currentQuery = query;
  };


  return {
    movies: movies,
    nextPage: nextPage,
    currentQuery: currentQuery,
    appendMovies: appendMovies,
    incrementPage: incrementPage,
    resetMovies: resetMovies,
    setQuery: setQuery
  };
}());

var view = (function () {
  var notFound = 'assets/notfound.jpg';
  var render = function () {
    var movies = model.movies;
    var listChildrenNum = $('#movie-list').children().length;
    var drawMovies = function (movie) {
      var moviePoster;
      var moviePlot;
      var movieRating;

      if (movie.Poster !== 'N/A') {
        moviePoster = '<img class="column is-3 is-12-mobile" src="' + movie.Poster + '">';
      } else {
        moviePoster = '<img class="column is-3 is-12-mobile" src="' + notFound + '">';
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

  var drawSpinner = function () {
    $('#movie-list').append('<span class="xcentered has-text-centered loading"><i class="fa fa-spinner fa-spin fa-lg" aria-hidden="true"></i></spa`n>');
  };

  var removeSpinner = function () {
    $('.loading').remove();
  };

  var drawErrorNotif = function (text) {
    var $notif = $('<div class="is-danger notification column is-8-mobile">' + text + '</div>');
    $('#movie-list').before($notif.hide().fadeIn(250));
    setTimeout(function () {
      $notif.fadeOut();
    }, 2500);
  };

  return {
    render: render,
    drawSpinner: drawSpinner,
    removeSpinner: removeSpinner,
    drawErrorNotif: drawErrorNotif
  };
}());

var OMDBApi = (function () {
  var OMDB_URL = 'https://www.omdbapi.com';
  var API_KEY = '843baf87';

  var getMovies = function (nextPage, query) {
    function getJSON(url) {
      return fetch(url)
        .then(function (req) {
          return req.json();
        })
        .catch(function (err) {
          return Promise.reject(err);
        });
    }
    function getMovieByQuery() {
      return getJSON(OMDB_URL + '?page=' + nextPage + '&s=' + query + '&apiKey=' + API_KEY);
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
        return getJSON(OMDB_URL + '?page=' + nextPage + '&i=' + movie.imdbID + '&apiKey=' + API_KEY);
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

    view.removeSpinner();

    if (results.total !== 0) {
      model.appendMovies(newMovies);
      if (pagesLeft > model.nextPage) {
        model.incrementPage();
        handlers.getMore();
      }
    } else {
      view.drawErrorNotif('Could not find results for ' + model.currentQuery);
    }
    view.render();
  };

  var handleError = function (e) {
    view.removeSpinner();
    view.drawErrorNotif(e);
  };

  var newSearch = function () {
    var firstSearch = function () {
      var movieVal = $('#movie-field').val();
      if (movieVal.match(/^[a-z0-9]+( [a-z0-9]+)*$/i)) {
        view.drawSpinner();
        model.resetMovies();
        model.setQuery(movieVal);
        $('#movie-list').val('');

        OMDBApi.getMovies(model.nextPage, model.currentQuery)
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
        OMDBApi.getMovies(model.nextPage, model.currentQuery)
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

$(document).ready(function () {
  handlers.newSearch();
});
