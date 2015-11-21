angular.module('reservation.services', [])

  .factory('Reserve', ['$http', '$q', 'ApiEndpoint', function ($http, $q, ApiEndpoint) {
    return {
      get: function (date) {
        var def = $q.defer();

        var d = moment(date).format('DD/MM/YYYY');

        var url = ApiEndpoint.url + '/?date_reservation=' + encodeURIComponent(d);

        $http({
          method: 'GET',
          url: url,
          responseType: 'text',
          withCredentials: true
        }).then(function (response) {
          if (!response.data) {
            alert('data error');
            return;
          }

          var header = $(response.data).find('.tableauRes2 thead');
          var body = $(response.data).find('.tableauRes2 tbody');

          var rooms = [];
          header.find('td').each(function (index) {
            var room = $(this).find('.moyen');
            var spec = $(this).find('.petit');

            if (!room.length || !spec.length) {
              return;
            }

            var r = room.text().trim();
            rooms.push({
              room: r,
              spec: spec.text().trim()
            });
          });

          var timesTDs = body.find('td.bb_point');
          if (timesTDs.length % (rooms.length + 1) != 0) {
            alert('data error');
            return;
          }

          var schedule = [];

          console.log(timesTDs);
          for (var i = 0; i < timesTDs.length;) {
            var time = $(timesTDs[i]).text().trim();
            ++i;
            var status = {time: time, rooms: []};
            for (var j = 0; j < rooms.length; ++j, ++i) {
              var html = $(timesTDs[i]).html();
              var itemid = html.replace(/.*id_item=(X[0-9]+).*/, '$1');

              status.rooms[rooms[j].room] = $(timesTDs[i]).text().trim() == 'Disponible';
              rooms[j].roomid = itemid;
            }
            schedule.push(status);
          }

          def.resolve({
            rooms: rooms,
            schedule: schedule
          });
        }, function (response) {
          def.reject("connection error");
        });

        return def.promise;
      },

      login: function (userid, password, date, time, roomid) {
        var def = $q.defer();

        var d = moment(date).format('DD/MM/YYYY');

        var url = ApiEndpoint.url + '/reservation.php?date_reservation=' + d + '&heure_debut=' + time + '&id_item=' + roomid;
        var req = {
          method: 'POST',
          url: url,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
          transformRequest: function (obj) {
            var str = [];
            for (var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {
            NumUsg: userid,
            MotPas1: '',
            MotPas: password,
            date_reservation: d,
            id_item: roomid,
            heure_debut: time,
            submit7: 'Envoyer'
          },
          responseType: 'text',
          withCredentials: true
        };

        $http(req).then(function (response) {
          var success = $(response.data).find('select[name="heure_fin"]');
          if (success.length) {
            var name = $(response.data).find('input[name="nom_prenom_req"]').val();
            var email = $(response.data).find('input[name="courriel"]').val();
            def.resolve({
              name: name,
              email: email
            });
          } else {
            def.reject("login failed");
          }
        }, function (response) {
          def.reject("connection error");
        });

        return def.promise;
      },

      reserve: function (userid, name, email, date, timeFrom, timeTo, roomid) {
        var def = $q.defer();
        var d = moment(date).format('DD/MM/YYYY');
        var url = ApiEndpoint.url + '/reservation.php';
        var req = {
          method: 'POST',
          url: url,
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
          transformRequest: function (obj) {
            var str = [];
            for (var p in obj)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {
            NumUsg: userid,
            date_reservation: d,
            id_item: roomid,
            heure_debut: timeFrom,
            heure_fin: timeTo,
            nom_prenom_req: name,
            courriel: email,
            nb_personnes: '3',
            notes: '',
            reserver: 'Réserver',
            soumettre: 'soumettre'
          },
          responseType: 'text',
          withCredentials: true
        };

        $http(req).then(function (response) {
          var success = -1 != response.data.indexOf('15 minutes de retard, la');
          if (success) {
            def.resolve(true);
          } else {
            var err = $(response.data).find('div.erreur');
            if (err.length) {
              def.reject(err.text());
            } else {
              def.reject('reserver failed');
            }
          }
        }, function (response) {
          def.reject("connection error");
        });

        return def.promise;
      }
    };
  }]);

