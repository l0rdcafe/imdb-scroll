var model = {};
var view = {};
var omdbService = (function () {
  var omdbUrl = 'https://www.omdbapi.com';
  var API_KEY = '843baf87';

  var getMovies = function (nextPage, query, successCb, errorCb) {
    var requestData = {
      page: nextPage,
      s: query,
      apiKey: API_KEY
    };

    var parseMovies = function (data) {
      if (data.Search) {
        successCb(data.Search, _.toNumber(data.totalResults));
      } else {
        successCb([], 0);
      }
    };

    var parseError = function (jqXHR, textStatus, i) {
      errorCb('Request failed: ' + textStatus + ' ' + i);
    };

    $.getJSON({
      url: omdbUrl,
      data: requestData,
      success: parseMovies,
      error: parseError
    });
  };
  return {
    getMovies: getMovies
  };
}());

var handlers = (function () {
  var handleSuccess = function (newMovies, total) {
    var pagesLeft = _.ceil(total / 10);
    $('.loading').remove();

    if (total !== 0) {
      newMovies.forEach(function (movie) {
        model.movies.push(movie);
      });
      if (pagesLeft > model.nextPage) {
        model.nextPage += 1;
        handlers.getMore();
        view.render();
      }
    } else {
      view.drawErrorNotif('Could not find results for ' + model.currentQuery);
    }
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
        $('#movie-field').val('');
        omdbService.getMovies(model.nextPage, model.currentQuery, handleSuccess, handleError);
      }
    };

    $('#movie-field').on('keydown', _.debounce(firstSearch, 400));
  };
  var getMore = function () {
    var moreResults = function () {
      var pxFromWindowToBtm = 0 + (($(document).height() - $(window).scrollTop()) - $(window).height());

      if (pxFromWindowToBtm < 50) {
        view.drawSpinner();
        omdbService.getMovies(model.nextPage, model.currentQuery, handleSuccess, handleError);
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

    if (movie.Poster !== 'N/A') {
      moviePoster = '<img class="column is-3 is-12-mobile" src="' + movie.Poster + '">';
    } else {
      moviePoster = '<img class="column is-3 is-12-mobile" src="' + view.notFound + '">';
    }
    $('#movie-list').append('<li class="movie columns column">' + moviePoster + '<span class="movie-title column is-5 is-12-mobile is-offset-2-tablet has-text-centered-mobile">' + movie.Title + '</span><span class="column is-2 is-12-mobile has-text-centered-mobile date">' + movie.Year + '</li>');
  };

  if (listChildrenNum === 0 || movies.length <= 10) {
    $('#movie-list').html('');
    movies.forEach(drawMovies);
  } else {
    movies.slice(listChildrenNum).forEach(drawMovies);
  }
};

view.drawErrorNotif = function (text) {
  var $notif = $('<div class="is-danger notification">' + text + '</div>');
  $('#movie-list').before($notif.hide().fadeIn(250));
  setTimeout(function () {
    $notif.fadeOut();
  }, 2500);
};

view.drawSpinner = function () {
  $('#movie-list').append('<span class="xcentered has-text-centered loading"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i><strong>Loading...</strong></span>');
};

view.notFound = 'assets/notfound.jpg';

$(document).ready(function () {
  handlers.newSearch();
});
