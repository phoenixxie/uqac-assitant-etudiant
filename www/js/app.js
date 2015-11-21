angular.module('reservation', ['ionic', 'ui.bootstrap', 'reservation.controllers', 'reservation.services'])
  .constant('ApiEndpoint', {
    //url: 'http://localhost:8100/api'
    url: 'http://bibvir2.uqac.ca/orb'
  })

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  .config(['$httpProvider', '$stateProvider', '$urlRouterProvider',
    function ($httpProvider, $stateProvider, $urlRouterProvider) {
      $httpProvider.defaults.withCredentials = true;
      $stateProvider

        .state('index', {
          url: '/',
          templateUrl: 'templates/reservation.html',
          controller: 'ReserveCtrl'
        });

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise('/');
    }]);
