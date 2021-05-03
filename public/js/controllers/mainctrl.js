"use strict";

app.controller("mainCtrl", ['$rootScope', '$scope', 'appServices', '$http', '$state', '$stateParams', '$location', function($rootScope, $scope, appServices, $http, $state, $stateParams, $location) {

    $rootScope.viewPath = "app/views/";

    $rootScope.imagePath = "app/images/";

    $scope.signIn = function() {
        customAppServices.customDialog("app/views/login.html");
    }; // open Sign in Dialoug


}]);


