angular.module('reservation.controllers', [])

  .controller('DossierCtrl', ['$scope', '$ionicPopup', '$ionicLoading', '$cordovaCalendar', '$window', 'Dossier',
    function ($scope, $ionicPopup, $ionicLoading, $cordovaCalendar, $window, Dossier) {

      $scope.$on('$ionicView.enter', function () {
        var token = Dossier.getLoginToken();
        console.log(token);
      });
    }]);
