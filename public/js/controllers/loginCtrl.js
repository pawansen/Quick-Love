app.controller('loginCtrl', ['$rootScope', '$scope', 'appServices', '$http', '$state', '$stateParams', '$location','$q', function($rootScope, $scope, appServices, $http, $state, $stateParams, $location,$q) {

	/* For admin login */
	$scope.login = function() {
	    let userEmail = $scope.userEmail;
	    let userPassword = $scope.userPassword;
	    $scope.errorMessage   = false;
	    $scope.successMessage = false;
	    $scope.isLoading      = true;
          appServices.postAjax(APP.service.adminLogin, { userEmail:userEmail,userPassword:userPassword })
            .then(function(response) {
            	if(parseInt(response.data.status) === 0){
            		$scope.errorMessage = response.data.message;
            		$scope.isLoading      = false;
            	}else{
            		$scope.errorMessage   = false;
            		$scope.successMessage = response.data.message;
                        localStorage.setItem('userLoginSessionKey',response.data.response.userLoginSessionKey);
                        localStorage.setItem('userFirstName',response.data.response.userFirstName);
                        localStorage.setItem('userLastName',response.data.response.userLastName);
                        localStorage.setItem('isloggedIn',true);
                        $state.go('adminDashboard');
            	}
            })
	}

}]);