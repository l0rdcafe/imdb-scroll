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
      if ($(window).scrollTop() >= ($(document).height() - $(window).height())) {
        console.log('hey');
        view.drawSpinner();
        omdbService.getMovies(model.nextPage, model.currentQuery, handleSuccess, handleError);
      }
    };

    $(window).on('scroll', _.debounce(moreResults, 400));
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
    $('#movie-list').append('<li class="movie">' + movie.Title + '<span class="date">' + movie.Year + '</li>');
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
  $('#movie-list').append($notif.hide().fadeIn(250));
  setTimeout(function () {
    $notif.fadeOut();
  }, 2500);
};

view.drawSpinner = function () {
  $('#movie-list').append('<span class="loading"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i><strong>Loading...</strong></span>');
};

$(document).ready(function () {
  handlers.newSearch();
});
