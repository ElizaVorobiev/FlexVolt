(function () {
    'use strict';

	angular.module('flexvolt.physiobuddy',[])

    .controller('PhysiobuddyCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup','$ionicPopover', '$ionicModal', '$interval', 'myometerPlot', 'myometerLogic', 'dataHandler', 'hardwareLogic', 'customPopover',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $ionicModal, $interval, myometerPlot, myometerLogic, dataHandler, hardwareLogic, customPopover) {


    	/* Physiobuddy home
			- display some info about user (todo:later)
			- button that says do my exercises
    	*/

    	/* Step 1a : Connect Brace --> Maybe we skip this one for now?
			- check that connected
			- switch template
    	*/

    	/* Step 1b : Brace is Connected
			- show picture of exercise
			- Button to calibrate - takes you to next step
    	*/

    	/* Step 3 : do exercise
			- start looking at data right away?
			- process data
				- display counter ( js)
				- display visual feedback (d3)
			- popover for rest time
			- popover for countdown for get ready
			- popover for completion and take to home
			- need some soft of timer function/ display seconds countdown
    	*/
    	//function called when user clicks start exercise
    	$scope.startExercise = function(){

    	};

    	/*
			Data processing function
				- if above MVC and atMVC is false
					call hitMVC()
				- if below MVC and atMVC is true
					call offMVC()
				- if atMVC = true and doneExercise == true then
					break
					call completedSet()
				dataVal =
    	*/


      //init();
    }])

    /* Step 2 : Calibrate Brace
		- display images
		- d3 animate
		- start recording data
    	- cancel recording data
    	- process data
    	- set new MVC
    	- show progress bar
    	- Move onto exercise bar
    	- Popover before starting exercise with info, click into exercise from here
	*/
	.controller('PhysiobuddyCalibrateCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup', '$interval', 'physiobuddyCalibratePlot', 'physiobuddyLogic', 'dataHandler', 'hardwareLogic',
    function($scope, $state, $stateParams, $ionicPopup, $interval, physiobuddyCalibratePlot, physiobuddyLogic, dataHandler, hardwareLogic) {

    	var currentUrl = $state.current.url;
      	var stateInterval, myPopup, mvcData, mvcRange, barMax;

      	var states = {
	        getReady: {
	          name: 'ready',
	          msg: 'Maximum voluntary contraction measurement starts in XT, get ready to push as hard as you can!',
	          count: 3,
	          nextState: 'measuring'
	        },
	        measuring: {
	          name: 'measuring',
	          msg: 'Measuring your MVC - keep pushing, XT s remaining!',
	          count: 5,
	          nextState: 'results'
	        },
	        results: {
	          name: 'results',
	          msg: 'Good job! We got your MVC :)',
	          count: 0,
	          nextState: 'idle'
	        },
	        idle: {
	          name: 'idle',
	          msg: '',
	          nextState: 'idle'
	        }
      	};

      	$scope.physiobuddyMVC = {
      		state: states.idle,
      		msg:'',
      		counter: 0,
      		channel: 0,
      	};

	    $scope.pageLogic = physiobuddyLogic;
	    $scope.hardwareLogic = hardwareLogic;
	    $scope.updating = false;
	    $scope.calibrating = false;

	    //realtime processing data, called every second
	    function mvcProcessor(){
	    	if ($scope.physiobuddyMVC.counter > 0){
	    		$scope.physiobuddyMVC.counter--;
	    		//decrement counter, this works as a countdown since only fired every 1s
	    	} else {
	    		//get next state
	    		$scope.physiobuddyMVC.state = states[$scope.physiobuddyMVC.state.nextState];

				if ($scope.physiobuddyMVC.state.name === 'measuring'){
					//if next state is to measure MVC make sure mvcData is cleared and defined
					mvcData = [];
				} else if ($scope.physiobuddyMVC.state.name === 'results'){
					//if next states is results calculate mvc
					if (mvcData.length > 0){
						var mvc = Math.max(...mvcData);
						$scope.pageLogic.settings.mvc = mvc;
						console.log('mvc'+mvc);
					}
				}
	    		$scope.physiobuddyMVC.counter = $scope.physiobuddyMVC.state.count;
	    	}
	    	//Display Seconds countdown
	    	$scope.physiobuddyMVC.msg = $scope.physiobuddyMVC.state.msg.replace('XT',''+$scope.physiobuddyMVC.counter);
	    	console.log('calibrate counter' + $scope.physiobuddyMVC.msg);
       		// physiobuddyCalibratePlot.addText($scope.physiobuddyMVC.msg);
	    };

    	/* Step 2 : Calibrate Brace
			- display images
			- d3 animate
			- start recording data
	    	- cancel recording data
	    	- process data
	    	- set new MVC
	    	- show progress bar
	    	- Move onto exercise bar
	    	- Popover before starting exercise with info, click into exercise from here
    	*/
    	//function called when the user clicks start recording on Calibrate your brace page
    	$scope.setMVC = function(chan){
       	 	$scope.calibrating = true;
        	$scope.physiobuddyMVC.channel = chan;
        	$scope.physiobuddyMVC.state = states.getReady;
	        $scope.physiobuddyMVC.counter = $scope.physiobuddyMVC.state.count;
	        $scope.physiobuddyMVC.msg = $scope.physiobuddyMVC.state.msg.replace('XT',''+$scope.physiobuddyMVC.counter);
	        // physiobuddyCalibratePlot.addText($scope.physiobuddyMVC.msg);
	        console.log('setMVC' + $scope.physiobuddyMVC.msg);
	        stateInterval = $interval(mvcProcessor,1000);
    	};

	    function updateAnimate(){
	        if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed

	        var dataIn = dataHandler.getData();
	        if (dataIn === null || dataIn === angular.undefined ||
	            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}

	        // store data if we are taking a baseline
	        if ($scope.physiobuddyMVC.state.name === 'measuring'){
	          mvcData = mvcData.concat(dataIn[$scope.physiobuddyMVC.channel]);
	        }

	        // convert data to downsampled and scale-factored form
	        var dataOut = [];
	        if (dataIn[0].length == 0){
	        	dataIn[0].value = 0
	        }

	        dataOut = dataIn[0];
	        console.log(dataOut);

	        // physiobuddyCalibratePlot.update(dataOut);
   		};

	    function paintStep(){
	        if ($state.current.url === currentUrl){
	          afID = window.requestAnimationFrame(paintStep);
	          frameCounts++;
	          if (frameCounts > 5){
	            frameCounts = 0;
	            updateAnimate();
	          }
	        } else if ($state.current.url === '/connection'){
	          afID = window.requestAnimationFrame(paintStep);
	        }
	    };


	    function init() {
	        if($state.current.url === currentUrl){
	          physiobuddyLogic.ready()
	            .then(function(){
	                physiobuddyLogic.settings.nChannels = Math.min(physiobuddyLogic.settings.nChannels,hardwareLogic.settings.nChannels);
	                dataHandler.init(physiobuddyLogic.settings.nChannels);
	                for (var i= 0; i < physiobuddyLogic.settings.filters.length; i++){
	                    dataHandler.addFilter(physiobuddyLogic.settings.filters[i]);
	                }
	    //            dataHandler.setMetrics(60);
	                // physiobuddyCalibratePlot.init('#physiobuddyCalibrateWindow', physiobuddyLogic.settings, hardwareLogic.settings.vMax, updateTargets);
	                paintStep();
	            });
	        }
	      }

    	window.onresize = function() {
	          if (afID){
	            window.cancelAnimationFrame(afID);
	          }
	          afID = undefined;
	          $scope.updating  = true;
	          // physiobuddyCalibratePlot.resize();
	          $scope.updating  = false;
	          paintStep();
	    };

	      init();
    }])
}())
