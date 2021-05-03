/****************************************************************************************************************
                                
                                                     App factory

****************************************************************************************************************/

app.factory('appServices', function($http, $rootScope) {
    return {
        post: function(url, opt) {
            return $http({
                method: "POST",
                url: url,
                data: opt
            });
        }, //post
        postAjax: function(url, opt) {
            return $http({
                method: "POST",
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: opt
            });
        }, //postAjax
        get: function(url, opt) {
                return $http({
                    method: "GET",
                    url: url,
                    cache: true,
                    params: opt
                });
            } //get

    };
});

/****************************************************************************************************************
                                
                                                    custom App Filters

****************************************************************************************************************/

app.filter('parseDate', function() {
    return function(value) {
        return Date.parse(value);
    };
});

app.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});

app.filter('capitalize_replace', function() {
    return function(input) {
      let str1 =  (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
      let str2 =  str1.replace(/_/g," ");
      let words = str2.toLowerCase().split(' ');
      for(var i = 0; i < words.length; i++) {
          var letters = words[i].split('');
          letters[0] = letters[0].toUpperCase();
          words[i] = letters.join('');
      }
      return words.join(' ');
    }
});