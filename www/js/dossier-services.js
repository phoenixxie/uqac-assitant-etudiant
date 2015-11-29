angular.module('reservation.services', [])

  .factory('Dossier', ['$http', '$q', '$window', 'ApiEndpoint', function ($http, $q, $window, ApiEndpoint) {

    return {
      getLoginToken: function () {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/';

        $http({
          method: 'GET',
          url: url,
          responseType: 'text',
          withCredentials: true
        }).then(function (response) {
          if (!response.data) {
            def.reject("Erreur de donnée");
            return;
          }

          var captchaSrc = $(response.data).find('form img[alt="CAPTCHA"]');
          var match = /codeSecret1.value=(.*);/g.exec(response.data);

          console.log(match);
          def.resolve({
            captchaSrc: captchaSrc.attr('src'),
            codeSecret1: match[0]
          });
        }, function (response) {
          def.reject("Erreur de connexion");
        });

        return def.promise;
      },

      login: function (userid, password, date, time, roomid) {
        var def = $q.defer();

        var d = moment(date).format('DD/MM/YYYY');

        var url = ApiEndpoint.reserveUrl + '/reservation.php?date_reservation=' + d + '&heure_debut=' + time + '&id_item=' + roomid;
        var req = {
          method: 'POST',
          url: url,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
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
            def.reject("Connexion échoué. Numéro d'usager inconnu ou mot de passe erronné.");
          }
        }, function (response) {
          def.reject("Erreur de connexion");
        });

        return def.promise;
      }

    };
  }]);

