angular.module('dossier.services', [])

  .factory('Dossier', ['$http', '$q', '$window', 'ApiEndpoint', function ($http, $q, $window, ApiEndpoint) {
    var session = {};

    return {

      getLoginToken: function () {

        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/';

        //window.cordovaHTTP.acceptAllCerts(true, function () {
        //  console.log('success!');
        //}, function () {
        //  console.log('error :(');
        //});

        window.cordovaHTTP.get(url, {}, {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,fr-CA;q=0.6,fr;q=0.4,fr-FR;q=0.2,zh;q=0.2,zh-CN;q=0.2',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
          'Host': 'wprodl.uqac.ca'
        }, function (response) {
          if (!response.data) {
            def.reject("Erreur de donnée");
            return;
          }

          var captchaUrl = ApiEndpoint.dossierUrl + $(response.data).find('form img[alt="CAPTCHA"]').attr('src');
          var match = /codeSecret1.value=(.*);/g.exec(response.data);
          var codeSecret1 = match[1];

          var cookie = response.headers['Set-Cookie'];
          var re = /PHPSESSID=[a-z0-9]+/g;
          match = cookie.match(re);
          cookie = match[match.length - 1];

          window.cordovaHTTP.get(captchaUrl, {}, {
            'Accept': 'image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.8,fr-CA;q=0.6,fr;q=0.4,fr-FR;q=0.2,zh;q=0.2,zh-CN;q=0.2',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
            'Host': 'wprodl.uqac.ca',
            'Referer': url,
            'Cookie': cookie
          }, function (res) {
            if (!res.data) {
              def.reject("Erreur de donnée");
              return;
            }

            def.resolve({
              captchaImage: btoa(res.data),
              captchaImageType: res.headers['Content-Type'],
              codeSecret1: codeSecret1,
              cookie: cookie,
              referer: url
            });

          }, function (res) {
            console.log(res);
            def.reject("Erreur de connexion");
          });

        }, function (response) {
          console.log(response);
          def.reject("Erreur de connexion");
        });

        return def.promise;
      },

      login: function (userid, password, captcha, token) {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/validation.html';

        window.cordovaHTTP.post(url, {
          user: userid,
          codeSecret: password,
          noCaptcha: captcha,
          codeSecret1: token.codeSecret1,
          valider: 'Valider'
        }, {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,fr-CA;q=0.6,fr;q=0.4,fr-FR;q=0.2,zh;q=0.2,zh-CN;q=0.2',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
          'Host': 'wprodl.uqac.ca',
          'Referer': token.referer,
          'Cookie': token.cookie
        }, function (response) {
          var success = $(response.data).find('div#partie_gauche');
          if (success.length) {
            session.cookie = token.cookie;
            def.resolve();
          } else {
            var err = $(response.data).find('#contenu > table:nth-child(6) > tbody > tr:nth-child(2)');
            if (err) {
              def.reject($(err).text().trim());
            } else {
              def.reject("Connexion échoué. Veuillez réessayer.");
            }
          }
        }, function (response) {
          def.reject("Erreur de connexion. Veuillez réessayer plus tard.");
        });

        return def.promise;
      },

      listTrimestres: function () {
        var def = $q.defer();

        var url = ApiEndpoint.dossierUrl + '/dossier_etudiant/grille_horaire.html?type=gl';
        window.cordovaHTTP.get(url, {}, {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,fr-CA;q=0.6,fr;q=0.4,fr-FR;q=0.2,zh;q=0.2,zh-CN;q=0.2',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
          'Host': 'wprodl.uqac.ca',
          'Cookie': session.cookie
        }, function (response) {
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
        window.cordovaHTTP.post(url, {
          session: code
        }, {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,fr-CA;q=0.6,fr;q=0.4,fr-FR;q=0.2,zh;q=0.2,zh-CN;q=0.2',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
          'Host': 'wprodl.uqac.ca',
          'Cookie': session.cookie
        }, function (response) {
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

                if (duree.substring(0, 2) == "Du") {
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

