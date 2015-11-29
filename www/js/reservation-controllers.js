angular.module('reservation.controllers', [])

  .controller('ReserveCtrl', ['$scope', '$ionicPopup', '$ionicLoading', '$cordovaCalendar', '$window', 'Reserve',
    function ($scope, $ionicPopup, $ionicLoading, $cordovaCalendar, $window, Reserve) {

      angular.element(document).ready(function () {
        var elem = angular.element(document.getElementById('res-scroll'));
        var height = $window.innerHeight - elem[0].getBoundingClientRect().top;
        elem.css('height', height + 'px');
      });

      var today = new Date();
      $scope.data = {
        dt: today,
        minDate: today,
        maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
      };

      $scope.open = function ($event) {
        $scope.status.opened = true;
      };

      $scope.status = {
        opened: false
      };

      $scope.session = {
        logined: false
      };

      $scope.user = JSON.parse(window.localStorage['user'] || '{}');

      $scope.getClass = function (timeIdx, roomIdx) {
        if (!$scope.data.schedule[timeIdx].rooms[$scope.data.rooms[roomIdx].room]) {
          return "reserved";
        } else {
          return "noreserved";
        }
      };

      $scope.doReserve = function (time, room) {
        $scope.data.from = time;
        $scope.data.to = time;

        var location = room.room.replace(/.*(P[23]-[0-9]{4}).*/, '$1');

        $ionicPopup.show({
          templateUrl: 'reserve.html',
          title: 'Réservation de salle de travail',
          subTitle: location,
          scope: $scope,
          buttons: [
            {text: 'Annuler'},
            {
              text: '<b>Réserver</b>',
              type: 'button-positive',
              onTap: function (e) {
                if (!$scope.data.from || !$scope.data.to) {
                  e.preventDefault();
                } else {
                  return $scope.data;
                }
              }
            }
          ]
        }).then(function (data) {
          if (!data) {
            return;
          }

          $ionicLoading.show({
            template: 'Chargement...'
          });
          Reserve.reserve($scope.user.id, $scope.session.name, $scope.session.email,
            $scope.data.dt, data.from, data.to, room.roomid).then(function (cancelUrl) {
            $ionicLoading.hide();

            Reserve.addHistory($scope.data.dt, location, data.from, data.to, cancelUrl);

            alert("Réservation effectuée avec succès!");
            $scope.getSchedule();

            var timeFrom = new Date($scope.data.dt.getTime());
            var timeTo = new Date($scope.data.dt.getTime());

            var parts = data.from.split('h');
            timeFrom.setHours(parts[0], parts[1], 0, 0);
            parts = data.to.split('h');
            timeTo.setHours(parts[0], parts[1], 0, 0);

            $cordovaCalendar.createEventInteractively({
              title: 'Rendezvous à ' + location,
              location: location,
              notes: 'Réservation de salle de travail à la bibliothèque',
              startDate: timeFrom,
              endDate: timeTo
            }).then(function (result) {
              // success
            }, function (err) {
              alert('Création d\'évenement a échoué.');
            });
          }, function (msg) {
            $ionicLoading.hide();
            alert(msg);
            $scope.session.logined = false;
          });
        });
      }

      $scope.reserve = function (timeIdx, roomIdx) {
        var room = $scope.data.rooms[roomIdx];
        var schedule = $scope.data.schedule[timeIdx];
        if (!schedule.rooms[room.room]) {
          return;
        }
        if (!room.roomid) {
          return;
        }

        if ($scope.session.logined) {
          $scope.doReserve(schedule.time, room);
        } else {
          $ionicPopup.show({
            templateUrl: 'login.html',
            title: 'Identification des usagers',
            scope: $scope,
            buttons: [
              {text: 'Annuler'},
              {
                text: '<b>Envoyer</b>',
                type: 'button-positive',
                onTap: function (e) {
                  if (!$scope.user.id || !$scope.user.pass) {
                    e.preventDefault();
                  } else {
                    return $scope.user;
                  }
                }
              }
            ]
          }).then(function (user) {
            if (!user) {
              return;
            }
            $ionicLoading.show({
              template: 'Chargement...'
            });
            Reserve.login(user.id, user.pass, $scope.data.dt, schedule.time, room.roomid).then(function (info) {
              $scope.session.logined = true;
              $scope.session.username = info.name;
              $scope.session.email = info.email;
              window.localStorage['user'] = JSON.stringify(user);
              $ionicLoading.hide();

              $scope.doReserve(schedule.time, room);
            }, function (msg) {
              $scope.session.logined = false;
              $ionicLoading.hide();

              alert(msg);
            });
          });
        }
      };

      $scope.getSchedule = function () {
        $ionicLoading.show({
          template: 'Chargement...'
        });

        Reserve.get($scope.data.dt).then(function (data) {
            $scope.data.rooms = data.rooms;
            $scope.data.schedule = data.schedule;

            var statuss = [];
            angular.forEach(data.schedule, function (s) {
              var times = {
                time: s.time,
                status: []
              };
              angular.forEach(data.rooms, function (r) {
                times.status.push(s.rooms[r.room] ? "Disponible" : "Réservée");
              });
              statuss.push(times);
            });

            $scope.data.statuss = statuss;
            $ionicLoading.hide();
          }, function (msg) {
            $ionicLoading.hide();
            alert(msg);
          }
        );
      };

      $scope.$on('$ionicView.enter', function () {
        $scope.getSchedule();
      });
    }])

  .controller('ReserveHistoryCtrl', ['$scope', 'Reserve', function ($scope, Reserve) {
    $scope.$on('$ionicView.enter', function () {
      $scope.histories = Reserve.listHistory();
    });

    $scope.cancelReserve = function (index) {
      Reserve.cancelReserve(index);
      $scope.histories.splice(index, 1);
    };

    $scope.clearHistory = function () {
      Reserve.clearHistory();
      $scope.histories = [];
    }
  }]);
