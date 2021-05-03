app.controller('userCtrl', ['$rootScope', '$scope', 'appServices', '$http', '$state', '$stateParams', '$location','$q','$timeout','$window', function($rootScope, $scope, appServices, $http, $state, $stateParams, $location,$q,$timeout,$window,DTOptionsBuilder, DTColumnBuilder) {

    $scope.events = {};
    $scope.isSelectedUsers = true;
    $scope.totalRevenue    = 0;
    $scope.totalEarning    = 0;


    /* User Graph */
    $scope.userCountChart = function(){
        setTimeout(function(){
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            appServices.postAjax(APP.service.userCountModuleWise, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.sessionExpire(response.data.code);
                }else{
                    Highcharts.chart('users-count-module-wise', {
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie'
                        },
                        title: {
                            text: 'Users count for Friendly, Dating & Job Module'
                        },
                        tooltip: {
                            pointFormat: '{series.name}: <b>{point.y}</b>'
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.y} ',
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        },
                        credits: {
                          enabled: false
                        },
                        series: [{
                            name: 'Users',
                            colorByPoint: true,
                            data: response.data.response
                        }]
                    });
                }
            })
        },1000);
    }

    /* Jobs Graph */
    $scope.jobsCount = function(){
        setTimeout(function(){
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            appServices.postAjax(APP.service.jobsCount, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.sessionExpire(response.data.code);
                }else{
                    Highcharts.chart('jobs-count', {
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie'
                        },
                        title: {
                            text: 'Jobs Count'
                        },
                        tooltip: {
                            pointFormat: '{series.name}: <b>{point.y}</b>'
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.title}</b>: {point.y} ',
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        },
                        credits: {
                          enabled: false
                        },
                        series: [{
                            name: 'Jobs',
                            colorByPoint: true,
                            data: response.data.response
                        }]
                    });
                }
            })
        },1000);
    }

    /* Filter chart data */
    $scope.filterChartData = function(){
        $scope.ordersCount('SEARCH');
        $scope.totalEarning('SEARCH');
    }

    /* Orders Graph */
    $scope.ordersCount = function(type){
        setTimeout(function(){
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            let myDateRange1  = '';
            let dateRangeText = '';
            if(type === 'DEFAULT'){
                myDateRange1  = JSON.stringify(new Array());
            }else{
                myDateRange1  = JSON.stringify($scope.myDateRangeNew);
            }
            appServices.postAjax(APP.service.ordersCount, { userLoginSessionKey:userLoginSessionKey,dateRange:myDateRange1})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.sessionExpire(response.data.code);
                }else{
                    dateRangeText = response.data.response.dateRangeText;
                    Highcharts.chart('orders-count', {
                        chart: {
                            type: 'spline'
                        },
                        title: {
                            text: 'Order Earning History From ' + dateRangeText
                        },
                        xAxis: {
                            categories: response.data.response.categories
                        },
                        yAxis: {
                            title: {
                                text: 'Amount (USD)'
                            },
                            labels: {
                                formatter: function () {
                                    return this.value;
                                }
                            }
                        },
                        credits: {
                          enabled: false
                        },
                        tooltip: {
                            formatter: function() {
                                return 'Total Order Earning <b>$'+ this.y;
                            }
                        },
                        plotOptions: {
                            spline: {
                                marker: {
                                    radius: 4,
                                    lineColor: '#666666',
                                    lineWidth: 1
                                }
                            },
                            series:{
                                cursor: 'pointer',
                                color: '#666666'
                            }
                        },
                        series: [{
                            name: 'Orders',
                            marker: {
                                symbol: 'square'
                            },
                            animation: {
                                duration: 2000
                            },
                            data: response.data.response.values
                        }]
                    });
                }
            })
        },1000);
    }

    /* Earning Graph */
    $scope.totalEarning = function(type){
        setTimeout(function(){
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            let myDateRange1  = '';
            let dateRangeText = '';
            if(type === 'DEFAULT'){
                myDateRange1  = JSON.stringify(new Array());
            }else{
                myDateRange1  = JSON.stringify($scope.myDateRangeNew);
            }
            appServices.postAjax(APP.service.totalEarning, { userLoginSessionKey:userLoginSessionKey,dateRange:myDateRange1})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.sessionExpire(response.data.code);
                }else{
                    dateRangeText = response.data.response.dateRangeText;
                    Highcharts.chart('total-revenue', {
                        chart: {
                            type: 'area'
                        },
                        title: {
                            text: 'Quicklove Total Earning From ' + dateRangeText
                        },
                        xAxis: {
                            categories: response.data.response.categories
                        },
                        yAxis: {
                            title: {
                                text: 'Amount (USD)'
                            },
                            labels: {
                                formatter: function () {
                                    return this.value;
                                }
                            }
                        },
                        credits: {
                          enabled: false
                        },
                        tooltip: {
                            formatter: function() {
                                return 'Total Earning <b>$'+ this.y;
                            }
                        },
                        plotOptions: {
                            spline: {
                                marker: {
                                    radius: 4,
                                    lineColor: '#27a9e3',
                                    lineWidth: 1
                                }
                            },
                            series:{
                                cursor: 'pointer',
                                color: '#27a9e3'
                            }
                        },
                        series: [{
                            name: 'Earning',
                            marker: {
                                symbol: 'diamond'
                            },
                            animation: {
                                duration: 2000,
                            },
                            data: response.data.response.values
                        }]
                    });
                }
            })
        },1000);
    }

    /* Subtract days from date */
    $scope.subtractDayFromDate = function(days){
        var date = new Date();
        var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
        var day  = last.getDate();
        var month= last.getMonth()+1;
        var year = last.getFullYear();
        if(day<10) {
            day = '0'+day
        } 
        if(month<10) {
            month = '0'+month
        } 
        return year + '-' + month + '-' + day;
    }

    /* Get today date */
    $scope.setTodayDateRange = function(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();
        if(dd<10) {
            dd = '0'+dd
        } 
        if(mm<10) {
            mm = '0'+mm
        } 
        today = yyyy + '-' + mm + '-' + dd;
        $scope.myDateRange1 = today + " - " + today;
        $scope.myDateRange2 =  $scope.subtractDayFromDate(15) + " - " + today;
    }
    $scope.setTodayDateRange();

    $scope.ShowHideAllUsers = function () {
        if($scope.isAllUsers == true){
            $scope.isSelectedUsers = false;
        }else{
            $scope.isSelectedUsers = true;
        }
    }

    /* For admin session expire auto logout */
    $scope.sessionExpire = function(statusCode) {
        if(parseInt(statusCode) === 405)
        {
            setTimeout(function(){
                let userLoginSessionKey = $rootScope.userLoginSessionKey;
                appServices.postAjax(APP.service.adminLogout, { userLoginSessionKey:userLoginSessionKey })
                    .then(function(response) {
                        $rootScope.successMessage = response.data.message;
                        localStorage.removeItem('userLoginSessionKey');
                        localStorage.removeItem('userFirstName');
                        localStorage.removeItem('userLastName');
                        localStorage.removeItem('isloggedIn');
                        $state.go('login');
                })
            },1000);
        }
    }

    /* Manage Content */
    $scope.getContentDetails = function () {
      let contentType = $scope.contentType;
      if(!contentType)
      {
        $scope.htmlcontent  = "";
        return;
      }  
      let userLoginSessionKey = $rootScope.userLoginSessionKey;
        appServices.postAjax(APP.service.getContentDetails, { userLoginSessionKey:userLoginSessionKey,contentType:contentType })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.htmlcontent  = response.data.response.contentText;
                    $scope.isLoading    = false;
                }
        })
    }

    $scope.updateContent = function () {
      let contentType = $scope.contentType;
      let contentText = $scope.htmlcontent;
      if(!contentType)
      {
        $scope.htmlcontent  = "";
        $scope.errorMessage = 'Please select content type';
        return;
      }
      if(!contentText)
      {
        $scope.errorMessage = 'Please enter content';
        return;
      }   
      $scope.errorMessage = "";
      let userLoginSessionKey = $rootScope.userLoginSessionKey;
        appServices.postAjax(APP.service.updateContent, { userLoginSessionKey:userLoginSessionKey,contentType:contentType,contentText:contentText })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
        })
    }

    /* To active sidebar menu */
    $scope.activeClass = function (path) {
      return ($location.path().substr(0, path.length) === path) ? 'active' : '';
    }

	/* For admin logout */
	$scope.logout = function() {
        let r = confirm("Are you sure want to log-out? Yes /No");
        if (r == true) {
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            appServices.postAjax(APP.service.adminLogout, { userLoginSessionKey:userLoginSessionKey })
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        alert(response.data.message);
                    }else{
                        $rootScope.successMessage = response.data.message;
                        localStorage.removeItem('userLoginSessionKey');
                        localStorage.removeItem('userFirstName');
                        localStorage.removeItem('userLastName');
                        localStorage.removeItem('isloggedIn');
                        $state.go('login');
                    }
            })
        }
	}

    /* For admin change password */
    $scope.updatePassword = function() {
        let oldPassword = $scope.oldPassword;
        let newPassword = $scope.newPassword;
        let confirmPassword = $scope.confirmPassword;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
          appServices.postAjax(APP.service.adminUpdatePassword, { userLoginSessionKey:userLoginSessionKey,oldPassword:oldPassword,newPassword:newPassword,confirmPassword:confirmPassword })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    localStorage.setItem('userLoginSessionKey',response.data.response.newLoginSessionKey);
                    $rootScope.userLoginSessionKey = response.data.response.newLoginSessionKey;
                    $scope.isLoading = false;
                    $scope.oldPassword = '';
                    $scope.newPassword = '';
                    $scope.confirmPassword = '';
                    $timeout(function() {
                      $scope.passwordForm.$setPristine();
                      $scope.passwordForm.$setUntouched();
                      $scope.passwordForm.$submitted = false;
                    });
                }
            })
    }

    /* Manage user current timezone */
    $scope.getUserTimezoneDetails = function()
    {
        var offset    = new Date().getTimezoneOffset();
            offset    = offset.toString();
        var plusSign  = offset.indexOf("+");
        var minusSign = offset.indexOf("-");
        var response  = {};
        response.offset = offset;
        if(plusSign > -1){
            response.identifire   = "-";
            response.totalMinutes = parseInt(offset.replace("+",""));
        }else if(minusSign > -1){
            response.identifire = "+";
            response.totalMinutes = parseInt(offset.replace("-",""));
        }else{
            response.identifire = "-";
            response.totalMinutes = parseInt(offset);
        }
        let totalMinutes = response.totalMinutes;
        let totalHours   = parseInt(totalMinutes/60);
        let hourMinutes  = 60 * totalHours;
        let reaminingMinutes = totalMinutes - hourMinutes;
        response.totalHours  = totalHours;
        response.hourMinutes = hourMinutes;
        response.reaminingMinutes = reaminingMinutes;
        response.finalTimeZoneFormatted = ((totalHours > 10) ? totalHours : "0" + totalHours) + ":" + ((reaminingMinutes > 10) ? reaminingMinutes : "0" + reaminingMinutes);
        return response;
    }

    /* Get contact us list */
    $scope.contactDateTime = 'Datetime';
    $scope.getContactUSList = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        let getUserTimezoneDetails = $scope.getUserTimezoneDetails();
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getContactList, { userLoginSessionKey:userLoginSessionKey,totalMinutes:getUserTimezoneDetails.totalMinutes,identifire:getUserTimezoneDetails.identifire,finalTimeZoneFormatted:getUserTimezoneDetails.finalTimeZoneFormatted})
            .then(function(response) {
                $scope.contactDateTime = 'Datetime (UTC'+getUserTimezoneDetails.identifire+getUserTimezoneDetails.finalTimeZoneFormatted+')';
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    $scope.viewUserDetails = function(userID){
       $location.url('admin/view-user-details/'+userID);
    }

    $scope.walletHistory = function(userID){
       $location.url('admin/wallet-history/'+userID);
    }

    $scope.transactionHistory = function(userID){
       $location.url('admin/transaction-history/'+userID);
    }

    $scope.reportFlag = function(userID){
       $location.url('admin/report-flags/'+userID);
    }

    $scope.orderHistory = function(userID){
       $location.url('admin/order-history/'+userID);
    }

    $scope.viewTxnDispute = function(txnID){
       $location.url('admin/view-txn-dispute/'+txnID);
    }

    $scope.viewReportFlagDetails = function(userReportId){
       $location.url('admin/view-report-flag-details/'+userReportId);
    }

    $scope.getLastUrlSegment = function(){
       return window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
    }

    /* Get user report flag details */
    $scope.initReportFlagDetails = function(){
       let userReportId = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getReportFlagDetials, {userLoginSessionKey:userLoginSessionKey,userReportId:userReportId})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records  = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user details */
    $scope.initUserDetails = function(){
       let userID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.viewUserDetails, {userLoginSessionKey:userLoginSessionKey,userID:userID})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records  = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user wallet history */
    $scope.initUserWalletHistory = function(){
       let userID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.walletHistory, {userLoginSessionKey:userLoginSessionKey,userID:userID})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user transactions history */
    $scope.initUserTxnHistory = function(){
       let userID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.transactionHistory, {userLoginSessionKey:userLoginSessionKey,userID:userID})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user report flags */
    $scope.initReportFlagsList = function(){
       let userID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.reportFlag, {userLoginSessionKey:userLoginSessionKey,userID:userID})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user transaction dispute details */
    $scope.initTxnDisputeDetails = function(){
       let txnID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.viewTxnDispute, {userLoginSessionKey:userLoginSessionKey,txnID:txnID})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user order history */
    $scope.initUserOrderHistory = function(orderType){
       let lastSegment    = $scope.getLastUrlSegment();
       let lastSegmentArr = lastSegment.split('#');
       let userID = lastSegmentArr[0];
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getUserOrderHistory, {userLoginSessionKey:userLoginSessionKey,userID:userID,orderType:orderType})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    if(orderType == 'RECEIVED_ORDERS'){
                        $scope.receivedorders  = response.data.response;
                    }else{
                        $scope.myorders        = response.data.response;
                    }
                    $scope.isLoading    = false;
                }
            })
    }

    $scope.viewOrderDetails = function(orderID){
       $location.url('admin/view-order-details/'+orderID);
    }

    $scope.viewJobDetails = function(jobID){
       $location.url('admin/view-job-details/'+jobID);
    }

    $scope.goBack = function(){
        $window.history.back();
    }

    /* Get user order details */
    $scope.initOrderDetails = function(){
       let orderID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getOrderDetails, {userLoginSessionKey:userLoginSessionKey,orderID:orderID})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Get user job details */
    $scope.initJobDetails = function(){
       let jobID = $scope.getLastUrlSegment();
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getJobDetails, {userLoginSessionKey:userLoginSessionKey,jobID:jobID})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                }
            })
    }

    /* Transaction Dispute Modal View */
    $scope.respondTxnDisputeView = function($event) {
        var transactionID  = angular.element($event.target).attr("data-transactionID");
        var respondType    = angular.element($event.target).attr("data-respondType");
        $scope.adminReason = '';
        $scope.transactionID = transactionID;
        $scope.respondType   = respondType;
        $('#txnDisputeModal').modal('show');
    }

    /* To respond on transaction dispute request */
    $scope.respondTxnDispute = function(){
        let txnID       = $scope.transactionID;
        let respondType = $scope.respondType;
        let adminReason = $scope.adminReason;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        if(adminReason == "")
        {
            $scope.errorMessage = "Please enter your message.";
            $scope.isLoading    = false;
            return false;
        }
        $scope.isLoading  = true;
        appServices.postAjax(APP.service.respondTxnDispute, {userLoginSessionKey:userLoginSessionKey,txnID:txnID,respondType:respondType,adminReason:adminReason})
            .then(function(response) {
                console.log('response',response);
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    $scope.records      = response.data.response;
                    $scope.isLoading    = false;
                    $('#txnDisputeModal').modal('hide');
                    window.location.reload();
                }
            })
    }

    /* Get users list */
    $scope.getUsersList = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.moduleType = "";
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getUsersList, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    /* Search users */
    $scope.searchUsers = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        let moduleType          = $scope.moduleType;
        if(!moduleType) return false;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.searchUsers, { userLoginSessionKey:userLoginSessionKey,moduleType:moduleType})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    /* Export users details */
    $scope.exportUsersDetails = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.exportUsersDetails, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response;
                    $scope.isLoading = false;
                }
            })
    }


    /* Change user status */
    $scope.changeUserStatus = function(userID,currentStatus) {

        if(currentStatus == '')
            currentStatus = 0;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.changeUserStatus, {userLoginSessionKey:userLoginSessionKey,userID:userID,currentStatus:currentStatus})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.isLoading      = false;
                    $state.go('users', {}, { reload: true });
                }
            })
    }

    /* Delete user */
    $scope.deleteUser = function(userID) {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.deleteUser, {userLoginSessionKey:userLoginSessionKey,userID:userID})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.isLoading      = false;
                    $state.go('users', {}, { reload: true });
                }
            })
    }

    /* Get preferences list */
    $scope.getPreferencesList = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getPreferencesList, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    /* For add new preference */
    $scope.insertPreference = function() {
        let preferenceName = $scope.preferenceName;
        let preferenceType = $scope.preferenceType;
        let preferenceModuleType = $scope.preferenceModuleType;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
          appServices.postAjax(APP.service.insertPreference, { userLoginSessionKey:userLoginSessionKey,preferenceName:preferenceName,preferenceType:preferenceType,preferenceModuleType:preferenceModuleType })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.isLoading = false;
                    $scope.preferenceName = '';
                    $scope.preferenceType = '';
                    $scope.preferenceModuleType = '';
                    $timeout(function() {
                      $scope.preferenceForm.$setPristine();
                      $scope.preferenceForm.$setUntouched();
                      $scope.preferenceForm.$submitted = false;
                    });
                    $state.go('preferences');
                }
            })
    }

    /* Delete preference */
    $scope.deletePreference = function(preferenceID) {
        let r = confirm("Are you sure, want to delete ?");
        if (r == true) {
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            $scope.errorMessage   = false;
            $scope.successMessage = false;
            $scope.isLoading      = true;
            appServices.postAjax(APP.service.deletePreference, { userLoginSessionKey:userLoginSessionKey,preferenceID:preferenceID})
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        $scope.errorMessage = response.data.message;
                        $scope.isLoading      = false;
                        $scope.sessionExpire(response.data.code);
                    }else{
                        $scope.errorMessage   = false;
                        $scope.successMessage = response.data.message;
                        $scope.isLoading      = false;
                        $state.go('preferences', {}, { reload: true });
                    }
                })
        }
    }

    /* Reply View (Open Bootstrap Modal) */
    $scope.replyView = function($event) {
        var contactId    = angular.element($event.target).attr("data-contactId");
        var contactName  = angular.element($event.target).attr("data-contactName");
        var contactEmail = angular.element($event.target).attr("data-contactEmail");
        $scope.replyContactTitle = "Reply to " + contactName;
        $scope.replyContactEmail = "Email Id: " + contactEmail;
        $scope.replyMessage = '';
        $scope.contactId = contactId;
        $('#replyModal').modal('show');
    }

    /* Send reply message to user */
    $scope.replyToUser = function(){
        let contactId = $scope.contactId;
        let replyMessage = $scope.replyMessage;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        if(replyMessage == "")
        {
            $scope.errorMessage = "Please enter reply message.";
            $scope.isLoading    = false;
            return false;
        }
        $scope.isLoading  = true;
        appServices.postAjax(APP.service.replyToUser, { userLoginSessionKey:userLoginSessionKey,contactId:contactId,replyMessage:replyMessage})
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        $scope.errorMessage = response.data.message;
                        $scope.isLoading      = false;
                        $scope.sessionExpire(response.data.code);
                    }else{
                        $scope.errorMessage   = false;
                        $scope.isLoading      = false;
                        $scope.successMessage = response.data.message;
                        $state.go('contactus', {}, { reload: true });
                        $('#replyModal').modal('hide');
                    }
                })
    }

     /* Remove Flag View (Open Bootstrap Modal) */
    $scope.removeFlag = function($event) {
        var userReportId          = angular.element($event.target).attr("data-userReportId");
        var userReportFriendName  = angular.element($event.target).attr("data-userReportFriendName");
        var userReportFriendEmail = angular.element($event.target).attr("data-userReportFriendEmail");
        $scope.replyUserReportFriendName = "<strong>Friend Name: </strong> " + userReportFriendName;
        $scope.replyUserReportFriendEmail = "<strong>Friend Email Id: </strong> " + userReportFriendEmail;
        $scope.replyAdminRemoveReportFlagReason = '';
        $scope.userReportId = userReportId;
        $('#removeFlagModal').modal('show');
    }

    /* Remove flag action */
    $scope.doRemoveFlag = function(){
        let userReportId = $scope.userReportId;
        let replyAdminRemoveReportFlagReason = $scope.replyAdminRemoveReportFlagReason;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        if(replyAdminRemoveReportFlagReason == "")
        {
            $scope.errorMessage = "Please enter reason.";
            $scope.isLoading    = false;
            return false;
        }
        $scope.isLoading  = true;
        appServices.postAjax(APP.service.doRemoveFlag, { userLoginSessionKey:userLoginSessionKey,userReportId:userReportId,reason:replyAdminRemoveReportFlagReason})
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        $scope.errorMessage = response.data.message;
                        $scope.isLoading      = false;
                        $scope.sessionExpire(response.data.code);
                    }else{
                        $scope.errorMessage   = false;
                        $scope.isLoading      = false;
                        $scope.successMessage = response.data.message;
                        $('#removeFlagModal').modal('hide');
                    }
                    $scope.initReportFlagsList();
                })
    }

    /* Get report flag categories list */
    $scope.getReportFlagCategoriesList = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getReportFlagCategoriesList, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    /* For insert report flag category */
    $scope.insertReportFlagCategory = function() {
        let reportFlagCategoryName = $scope.reportFlagCategoryName;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
          appServices.postAjax(APP.service.insertReportFlagCategory, { userLoginSessionKey:userLoginSessionKey,reportFlagCategoryName:reportFlagCategoryName })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading      = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.isLoading = false;
                    $scope.reportFlagCategoryName = '';
                    $timeout(function() {
                      $scope.reportFlagCategoryForm.$setPristine();
                      $scope.reportFlagCategoryForm.$setUntouched();
                      $scope.reportFlagCategoryForm.$submitted = false;
                    });
                    $state.go('reportFlagCategories');
                }
            })
    }

    /* Delete report flag category */
    $scope.deleteReportFlagCategory = function(reportFlagCategoryID) {
        let r = confirm("Are you sure, want to delete ?");
        if (r == true) {
            let userLoginSessionKey = $rootScope.userLoginSessionKey;
            $scope.errorMessage   = false;
            $scope.successMessage = false;
            $scope.isLoading      = true;
            appServices.postAjax(APP.service.deleteReportFlagCategory, { userLoginSessionKey:userLoginSessionKey,reportFlagCategoryID:reportFlagCategoryID})
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        $scope.errorMessage = response.data.message;
                        $scope.isLoading    = false;
                        $scope.sessionExpire(response.data.code);
                    }else{
                        $scope.errorMessage   = false;
                        $scope.successMessage = response.data.message;
                        $scope.isLoading      = false;
                        $state.go('reportFlagCategories', {}, { reload: true });
                    }
                })
        }
    }

    $scope.myJobHistory = function(userID){
       $location.url('admin/my-job-history/'+userID);
    }

    /* Get user my job history */
    $scope.initMyJobHistory = function(jobType){
       let lastSegment    = $scope.getLastUrlSegment();
       let lastSegmentArr = lastSegment.split('#');
       let userID = lastSegmentArr[0];
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getMyJobHistory, {userLoginSessionKey:userLoginSessionKey,userID:userID,jobType:jobType})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.isLoading    = false;
                }else{
                    $scope.errorMessage = false;
                    if(jobType == 'PAST_JOBS'){
                        $scope.pastjobs    = response.data.response;
                    }else{
                        $scope.currentjobs = response.data.response;
                    }
                    $scope.isLoading    = false;
                }
            })
    }

    $scope.receivedJobHistory = function(userID){
       $location.url('admin/received-job-history/'+userID);
    }

    /* Get user received job history */
    $scope.initReceivedJobHistory = function(jobType){
       let lastSegment    = $scope.getLastUrlSegment();
       let lastSegmentArr = lastSegment.split('#');
       let userID = lastSegmentArr[0];
       let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getReceivedJobHistory, {userLoginSessionKey:userLoginSessionKey,userID:userID,jobType:jobType})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.isLoading  = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage = false;
                    if(jobType == 'PAST_JOBS'){
                        $scope.pastjobs    = response.data.response;
                    }else{
                        $scope.currentjobs = response.data.response;
                    }
                    $scope.isLoading    = false;
                }
            })
    }

    /* For send notification */
    $scope.insertSendNotifications = function() {
        let title      = $scope.title;
        let message    = $scope.message;
        let isAllUsers = $scope.isAllUsers;
        let users      = $scope.users;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
          if(!isAllUsers && !users)
          {
            alert('Please select users');
            return false;
          }
          if(isAllUsers == true) users = 'ALL';
           $scope.errorMessage   = false;
           $scope.successMessage = false;
           $scope.isLoading      = true;
          appServices.postAjax(APP.service.insertSendNotifications, { userLoginSessionKey:userLoginSessionKey,title:title,message:message,users:users })
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.successMessage = response.data.message;
                    $scope.isLoading = false;
                    $scope.title = '';
                    $scope.message = '';
                    $scope.isAllUsers = false;
                    $scope.users = '';
                    $timeout(function() {
                      $scope.sendNotificationForm.$setPristine();
                      $scope.sendNotificationForm.$setUntouched();
                      $scope.sendNotificationForm.$submitted = false;
                    });
                }
            })
    }

    /* Get dashboard statics*/
    $scope.getStatics = function(){
       setTimeout(function(){
           let userLoginSessionKey = $rootScope.userLoginSessionKey;
            $scope.errorMessage   = false;
            $scope.successMessage = false;
            $scope.isLoading      = true;
            appServices.postAjax(APP.service.getStatics, {userLoginSessionKey:userLoginSessionKey})
                .then(function(response) {
                    if(parseInt(response.data.status) === 0){
                        $scope.errorMessage = response.data.message;
                        $scope.isLoading    = false;
                        $scope.sessionExpire(response.data.code);
                    }else{
                        $scope.errorMessage = false;
                        $scope.records  = response.data.response;
                        $scope.isLoading    = false;
                    }
                })
        },1000);
    }

    $scope.parseNumber = function(number){
        if(number != "" && number != null && number != undefined){
          if(Number.isInteger(number)){
            return number; // INTEGER
          }else{
            return parseFloat(parseFloat(number).toFixed(2)); // FLOAT
          }
        }else{
          return 0;
        }
    }

    /* Get reports data*/
    $scope.getReportData = function(type){
        if(type == 'CLEAR')
        {
            $scope.moduleType = "";
            $scope.users      = "";
            $scope.setTodayDateRange();
        }
        let moduleType  = $scope.moduleType;
        let myDateRange = JSON.stringify($scope.myDateRange);
        let users  = $scope.users;
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.getReportData, {userLoginSessionKey:userLoginSessionKey,users:users,moduleType:moduleType,myDateRange:myDateRange})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.reports      = response.data.response;
                    $scope.isLoading    = false;
                    $scope.totalRevenue = 0;
                    $scope.totalEarning = 0;
                    $scope.sessionExpire(response.data.code);
                }else{
                    let responseData = response.data.response.revenueData;
                    let earningData  = response.data.response.earningData;
                    let finalRevenue = 0;
                    let finalEarning = 0;
                    $scope.errorMessage = false;
                    $scope.reports      = responseData;
                    $scope.earningReports = earningData;
                    $scope.isLoading    = false;
                    for (var i = 0; i < responseData.length; i++) 
                    {
                        if(parseInt(responseData[i].reportAmountType) === 1){
                            finalRevenue = $scope.parseNumber(finalRevenue) + $scope.parseNumber(responseData[i].reportAmount);
                        }else{
                            finalRevenue = $scope.parseNumber(finalRevenue) - $scope.parseNumber(responseData[i].reportAmount);
                        }

                        /* Manage Total Earning */
                        let reportModuleName = responseData[i].reportModuleName;
                        let earningTypes     = new Array('PURCHASE_PRODUCT','PURCHASE_MEMBERSHIP','ACCEPT_JOB','JOB_CANCEL_FEE_AMOUNT');
                        if(reportModuleName && earningTypes.indexOf(reportModuleName) >= 0 && parseInt(responseData[i].reportAmountType) === 1)
                        {
                            finalEarning = $scope.parseNumber(finalEarning) + $scope.parseNumber(responseData[i].reportAmount);
                        }
                    }
                    $scope.totalRevenue = $scope.parseNumber(finalRevenue);
                    $scope.totalEarning = $scope.parseNumber(finalEarning);
                }
            })
    }

    /* Get Notifications History List */
    $scope.viewNotificationHistory = function() {
        let userLoginSessionKey = $rootScope.userLoginSessionKey;
        $scope.errorMessage   = false;
        $scope.successMessage = false;
        $scope.isLoading      = true;
        appServices.postAjax(APP.service.viewNotificationHistory, { userLoginSessionKey:userLoginSessionKey})
            .then(function(response) {
                if(parseInt(response.data.status) === 0){
                    $scope.errorMessage = response.data.message;
                    $scope.isLoading    = false;
                    $scope.sessionExpire(response.data.code);
                }else{
                    $scope.errorMessage   = false;
                    $scope.records = response.data.response
                    $scope.isLoading = false;
                    $scope.vm = {};
                    $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                      .withOption('order', [0, 'asc']);
                }
            })
    }

    $scope.removedFlagAlert = function($event) {
        var title  = angular.element($event.target).attr("data-flag-title");
        alert(title);
    }

    

}]);