"use strict";

var linkDirective = angular.module('linkDirective', []);

linkDirective.directive('innerHeader', function(){
	return{

		templateUrl: 'views/inner-header.html',
		restrict: 'E',
        link:function () {
            console.log("innerHeader")
        }

	};

});//inner header

linkDirective.directive('innerSidebar', function(){

	return{
		templateUrl: 'views/inner-sidebar.html',
		restrict: 'E',
        link:function () {
            console.log("innerSidebar")
        }

	};

});//inner sidebar

linkDirective.directive('innerFooter', function(){

	return{
		templateUrl: 'views/inner-footer.html',
		restrict: 'E',
        link:function () {
            console.log("innerFooter")
        }

	};

});//inner header

