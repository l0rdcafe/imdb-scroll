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
      successCb(data.Search, _.toNumber(data.totalResults));
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
    $('.fa-spinner').remove();
    newMovies.forEach(function (movie) {
      model.movies.push(movie);
    });
    if (pagesLeft > model.nextPage) {
      model.nextPage += 1;
      view.render();
      view.drawMoreBtn();
    } else {
      $('.button').remove();
      view.render();
    }
  };
  var handleError = function (e) {
    $('.fa-spinner').remove();
    view.drawErrorNotif(e);
  };

  var newSearch = function () {
    var firstSearch = function (e) {
      var isEnterKey = e.keyCode === 13 || e.which === 13;
      if (isEnterKey) {
        model.movies = [];
        model.currentQuery = $('#movie-field').val();
        model.nextPage = 1;
        omdbService.getMovies(model.nextPage, model.currentQuery, handleSuccess, handleError);
        view.drawSpinner();
      }
    };

    $('#movie-field').on('keydown', firstSearch);
  };
  var getMore = function () {
    var moreResults = function () {
      omdbService.getMovies(model.nextPage, model.currentQuery, handleSuccess, handleError);
      view.drawSpinner();
    };

    $('#more').on('click', moreResults);
  };

  return {
    newSearch: newSearch,
    getMore: getMore
  };
}());

view.render = function () {
  var movies = model.movies;
  $('#movie-list').html('');

  movies.forEach(function (movie) {
    $('#movie-list').append('<li class="movie">' + movie.Title + '<span class="date">' + movie.Year + '</li>');
  });
};

view.drawMoreBtn = function () {
  $('#more').remove();
  $('#movie-list').append('<button class="button" id="more">Get More</button>');
  handlers.getMore();
};

view.drawErrorNotif = function (text) {
  var $notif = $('<div class="is-danger notification">' + text + '</div>');
  $('#movie-list').append($notif.hide().fadeIn(250));
  setTimeout(function () {
    $notif.fadeOut();
  }, 2500);
};

view.drawSpinner = function () {
  $('#movie-list').html('');
  $('#movie-list').append('<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>');
};

$(document).ready(function () {
  handlers.newSearch();
});
