import _ from "lodash";
import $ from "jquery";
import * as model from "./model";
import * as view from "./view";
import OMDBApi from "./omdb-api";

let isFetching = false;

const processMovies = function(results) {
  const newMovies = results.movies;
  const pagesLeft = _.ceil(results.total / 10);

  view.removeSpinner();

  if (results.total !== 0) {
    model.appendMovies(newMovies);
    if (pagesLeft > model.state().nextPage) {
      model.incrementPage();
      getMore();
    }
  } else {
    view.drawErrorNotif(`Could not find results for ${model.state().currentQuery}`);
  }
  view.render(model.state);
};

const handleError = function(e) {
  view.removeSpinner();
  view.drawErrorNotif(e);
};

const getMore = function() {
  const moreResults = function() {
    if (isFetching) {
      return;
    }

    const pxFromWindowToBtm = 0 + ($(document).height() - $(window).scrollTop() - $(window).height());

    if (pxFromWindowToBtm < 50) {
      isFetching = true;
      view.drawSpinner();
      OMDBApi.getMovies(model.state().nextPage, model.state().currentQuery)
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

const newSearch = function() {
  const firstSearch = function() {
    if (isFetching) {
      return;
    }

    const movieVal = $("#movie-field").val();

    if (movieVal.match(/^[a-z0-9]+( [a-z0-9]+)*$/i)) {
      view.drawSpinner();
      isFetching = true;
      model.resetMovies();
      model.setQuery(movieVal);
      $("#movie-list").val("");
      OMDBApi.getMovies(model.state().nextPage, model.state().currentQuery)
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

$(document).ready(() => {
  newSearch();
});
