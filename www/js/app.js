angular.module('reservation', ['ionic', 'ui.bootstrap', 'reservation.controllers', 'reservation.services', 'ngCordova'])
  .constant('ApiEndpoint', {
    reserveUrl: 'http://localhost:8100/api',
    dossierUrl: 'http://localhost:8100/dossier',
    //reserveUrl: 'http://bibvir2.uqac.ca/orb',
    //dossierUrl: 'https://wprodl.uqac.ca/'
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
          templateUrl: 'templates/home.html'
        })
        .state('reservation', {
          url: '/reservation',
          abstract: true,
          templateUrl: 'templates/reservation-tab.html'
        })
        .state('reservation.home', {
          url: '/home',
          views: {
            'reservation-home': {
              templateUrl: 'templates/reservation-home.html',
              controller: 'ReserveCtrl'
            }
          }
        })
        .state('reservation.history', {
          url: '/history',
          views: {
            'reservation-history': {
              templateUrl: 'templates/reservation-history.html',
              controller: 'ReserveHistoryCtrl'
            }
          }
        })
        .state('dossier', {
          url:'/dossier',
          abstract: true,
          templateUrl: 'templates/dossier-tab.html'
        })
        .state('dossier.cours', {
          url: '/cours',
          views: {
            'dossier-cours': {
              templateUrl: 'templates/dossier-cours.html',
              controller: 'DossierCtrl'
            }
          }
        })
      ;

      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider
        .when('/reservation', '/reservation/home')
        .when('/dossier', '/dossier/cours')
        .otherwise('/');
    }]);
