angular.module('dossier.services', [])

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

          def.resolve({
            captchaSrc: captchaSrc.attr('src'),
            codeSecret1: match[1]
          });
        }, function (response) {
          def.reject("Erreur de connexion");
        });

        return def.promise;
      },

      login: function (userid, password, captcha, codeSecret1) {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/validation.html';
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
            user: userid,
            codeSecret: password,
            noCaptcha: captcha,
            codeSecret1: codeSecret1,
            valider: 'valider'
          },
          responseType: 'text',
          withCredentials: true
        };

        $http(req).then(function (response) {
          var success = $(response.data).find('div#partie_gauche');
          if (success.length) {
            def.resolve();
          } else {
            def.reject("Connexion échoué. Veuillez réessayer.");
          }
        }, function (response) {
          def.reject("Erreur de connexion. Veuillez réessayer plus tard.");
        });

        return def.promise;
      },

      listTrimestres: function () {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/grille_horaire.html?type=gl';

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

          var options = $(response.data).find('#partie_centrale select[name="session"] > option');
          if (!options.length) {
            def.reject("Connexion échoué. Veuillez réessayer.");
            return;
          }

          var trims = [];
          options.each(function () {
            if (!$(this).attr('value')) {
              return;
            }
            trims.push({
              code: $(this).val(),
              trimestre: $(this).text().trim()
            })
          });

          def.resolve(trims);
        }, function (response) {
          def.reject("Erreur de connexion");
        });

        return def.promise;
      },

      getTrimestre: function (code) {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/grille_horaire.html?type=gl';
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
            session: code
          },
          responseType: 'text',
          withCredentials: true
        };

        $http(req).then(function (response) {
          var cours = $(response.data).find('#partie_centrale > b');
          if (cours.length) {
            var classes = [];
            for (var i = 0; i < cours.length; ++i) {
              var c = cours[i];
              var details = $(c).nextUntil('b').text();

              var pos = 0;
              var infos = [];
              while (details.indexOf('Durée:', pos) != -1) {
                var dureepos = details.indexOf('Durée:', pos);
                var heurepos = details.indexOf('Heure:', pos);
                var localpos = details.indexOf('Local:', pos);

                var nextduree = details.indexOf('Durée:', dureepos + 'Durée:'.length);

                var info = {};

                var duree;
                if (heurepos == -1) {
                  duree = details.substring(dureepos + 'Durée:'.length, localpos).trim();
                  info.timeFrom = "00:00";
                  info.timeTo = "23:59";
                } else {
                  duree = details.substring(dureepos + 'Durée:'.length, heurepos).trim();
                  var heure = details.substring(heurepos + 'Heure:'.length, localpos).trim();

                  var timeRe = /[0-9]{2}:[0-9]{2}/g;
                  var match = timeRe.exec(heure);
                  info.timeFrom = match[0];
                  match = timeRe.exec(heure);
                  info.timeTo = match[0];
                }

                var local;
                if (nextduree == -1) {
                  local = details.substring(localpos + 'Local:'.length).trim();
                } else {
                  local = details.substring(localpos + 'Local:'.length, nextduree).trim();
                }

                if (duree.startsWith("Du")) {
                  var dateRe = /[0-9]{2}-[0-9]{2}-[0-9]{4}/g;
                  var match = dateRe.exec(duree);
                  info.dateFrom = moment(match[0], 'DD-MM-YYYY').toDate();
                  match = dateRe.exec(duree);
                  info.dateTo = moment(match[0], 'DD-MM-YYYY').toDate();
                } else {
                  var match = /[0-9]{2}-[0-9]{2}-[0-9]{4}/g.exec(duree);
                  info.date = moment(match[0], 'DD-MM-YYYY').toDate();
                }

                info.local = local;

                if (local != "Aucun") {
                  infos.push(info);
                }

                if (nextduree == -1) {
                  break;
                }
                pos = nextduree;
              }

              classes.push({
                class: $(c).text().trim(),
                infos: infos
              });
            }

            def.resolve(classes);
          } else {
            def.resolve([]);
          }
        }, function (response) {
          def.reject("Erreur de connexion. Veuillez réessayer plus tard.");
        });

        return def.promise;
      }

    };
  }]);

