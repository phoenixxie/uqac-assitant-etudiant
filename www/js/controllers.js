angular.module('reservation.controllers', [])

  .controller('ReserveCtrl', ['$scope', '$ionicPopup', '$ionicLoading', '$window', 'Reserve',
    function ($scope, $ionicPopup, $ionicLoading, $window, Reserve) {

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

      $scope.doReserve = function (time, roomid) {
        $scope.data.from = time;
        $scope.data.to = $scope.data.statuss[0].time;

        $ionicPopup.show({
          templateUrl: 'reserve.html',
          title: 'Réservation de salle de travail',
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
            $scope.data.dt, data.from, data.to, roomid).then(function (success) {
            if (success) {
              $ionicLoading.hide();
              alert("Réservation effectuée avec succès!");
              $scope.getSchedule();
            }
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
          $scope.doReserve(schedule.time, room.roomid);
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

              $scope.doReserve(schedule.time, room.roomid);
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

      $scope.getSchedule();
    }])

  .controller('ChatsCtrl', function ($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    console.log(Chats);
    $scope.chat = Chats.get($stateParams.chatId);
  });
