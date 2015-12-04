angular.module('dossier.controllers', [])

  .controller('DossierCtrl', ['$scope', '$ionicPopup', '$ionicModal', '$ionicLoading', '$cordovaCalendar', '$window', '$compile', '$interval',
    'uiCalendarConfig', 'ApiEndpoint', 'Dossier',
    function ($scope, $ionicPopup, $ionicModal, $ionicLoading, $cordovaCalendar, $window, $compile, $interval,
              uiCalendarConfig, ApiEndpoint, Dossier) {

      $scope.login = function () {
        $scope.user = JSON.parse(window.localStorage['dossier.user'] || '{}');

        Dossier.getLoginToken().then(function (token) {
          $scope.captchaImage = token.captchaImage;
          $scope.captchaImageType = token.captchaImageType;

          $ionicPopup.show({
            templateUrl: 'dossier-login.html',
            title: 'Identification des usagers',
            scope: $scope,
            buttons: [
              {text: 'Annuler'},
              {
                text: '<b>Valider</b>',
                type: 'button-positive',
                onTap: function (e) {
                  if (!$scope.user.id || !$scope.user.pass || !$scope.user.captcha) {
                    e.preventDefault();
                  } else {
                    return $scope.user;
                  }
                }
              }
            ]
          }).then(function (user) {
            if (!user || !user.captcha) {
              return;
            }
            $ionicLoading.show({
              template: 'Veuillez attendre...'
            });
            Dossier.login(user.id, user.pass, user.captcha, token).then(function () {
              $ionicLoading.hide();

              $scope.user.logined = true;

              window.localStorage['dossier.user'] = JSON.stringify({
                id: user.id,
                pass: user.pass
              });

              console.log("logined!");

              $scope.listTrimestres();
            }, function (msg) {
              $ionicLoading.hide();

              $scope.user.logined = false;
              alert(msg);
            });
          });
        }, function (msg) {
          alert(msg);
        });
      };

      $scope.getTrimestre = function (code) {
        Dossier.getTrimestre(code).then(function (classes) {

          angular.forEach(classes, function (cls) {
            var c = cls.class;
            angular.forEach(cls.infos, function (info) {
              if (info.date) {
                var d = moment(info.date);
                var syear = d.year();
                var smonth = d.month();

                if (!$scope.calendar[syear]) {
                  $scope.calendar[syear] = {};
                }
                if (!$scope.calendar[syear][smonth]) {
                  $scope.calendar[syear][smonth] = [];
                }

                $scope.calendar[syear][smonth].push({
                  date: info.date,
                  class: c,
                  timeFrom: info.timeFrom,
                  timeTo: info.timeTo,
                  local: info.local
                })
              } else {
                var f = moment(info.dateFrom);
                var t = moment(info.dateTo);

                while (f.isBefore(t) || f.isSame(t)) {
                  var syear = f.year();
                  var smonth = f.month();

                  if (!$scope.calendar[syear]) {
                    $scope.calendar[syear] = {};
                  }
                  if (!$scope.calendar[syear][smonth]) {
                    $scope.calendar[syear][smonth] = [];
                  }

                  $scope.calendar[syear][smonth].push({
                    date: new Date(f.toDate()),
                    class: c,
                    timeFrom: info.timeFrom,
                    timeTo: info.timeTo,
                    local: info.local
                  });

                  f.add(7, 'days');
                }
              }
            });
          });
          window.localStorage['dossier.calendar'] = JSON.stringify($scope.calendar);
          $scope.populateEvents($scope.calendar);

        }, function (msg) {
          alert(msg);
        });
      };

      $scope.listTrimestres = function () {
        Dossier.listTrimestres().then(function (trims) {

          $scope.calendar = {};
          uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEvents');

          $scope.trimestres = trims;

          //$scope.getTrimestre('20151');
          angular.forEach(trims, function (trim) {
            $scope.getTrimestre(trim.code);
          });

        }, function (msg) {
          alert(msg);
        });
      };

      $scope.sync = function () {
        $scope.login();
      };

      $scope.events = [];
      $scope.eventSources = [$scope.events];

      $scope.populateEvents = function (calendar) {
        //uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEvents');

        $ionicLoading.show({
          template: 'Veuillez attendre...'
        });

        $interval(function () {
          $scope.events.splice(0, $scope.events.length);

          angular.forEach(calendar, function (months, year) {
            angular.forEach(months, function (month) {
              angular.forEach(month, function (task) {
                var allday = false;
                if (task.timeFrom == "00:00" && task.timeTo == "23:59") {
                  allday = true;
                }

                var start = moment(task.date);
                var end = moment(task.date);
                var parts = task.timeFrom.split(':');
                start.hour(parts[0]).minute(parts[1]);
                parts = task.timeTo.split(':');
                end.hour(parts[0]).minute(parts[1]);

                parts = task.class.split(' - ');
                $scope.events.push({
                  title: parts[0].trim(),
                  start: start,
                  end: end,
                  allday: allday,
                  stick: true,
                  info: 'De ' + task.timeFrom + ' à ' + task.timeTo +  ' à ' + task.local,
                  classid: parts[0].trim(),
                  classname: parts[1].trim()
                });
              });
            });
          });

          $ionicLoading.hide();
        }, 100, 1);

        //$scope.eventSources = [$scope.events];
      };

      $scope.alertOnEventClick = function(event, jsevent, view){
        $ionicPopup.alert({
          title: event.classid,
          template: '<center>' + event.classname + '<br/>' + event.info + '</center>'
        });
      };

      angular.element(document).ready(function () {
        var elem = angular.element(document.getElementById('myCalendar'));
        var height = $window.innerHeight - elem[0].getBoundingClientRect().top;

        $scope.uiConfig = {
          calendar: {
            editable: false,
            height: height - 100,
            header: {
              left: 'month agendaWeek agendaDay',
              center: 'title',
              right: 'today prev,next'
            },
            eventClick: $scope.alertOnEventClick
          }
        };
      });

      $scope.$on('$ionicView.enter', function () {
        $scope.calendar = JSON.parse(window.localStorage['dossier.calendar'] || '{}');

        $scope.populateEvents($scope.calendar);

        uiCalendarConfig.calendars['myCalendar'].fullCalendar('changeView', 'month');
      });
    }]);
