(function () {
    'use strict';

	angular.module('flexvolt.physiobuddy',[])

    .controller('PhysiobuddyCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup','$ionicPopover', '$ionicModal', '$interval', 'physiobuddyLogic', 'physiobuddyExercisePlot', 'dataHandler', 'hardwareLogic', 'customPopover', 'sound',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $ionicModal, $interval, physiobuddyLogic, physiobuddyExercisePlot, dataHandler, hardwareLogic, customPopover, sound) {


    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-modal.html', {
      id: '0',
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal0 = modal;
    });

    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-rest-modal.html', {
      id: '1', 
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal1 = modal;
    });

    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-finished-modal.html', {
      id: '2', 
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal2 = modal;
    });

    $scope.openModal = function(index) {
      if (index == 0) $scope.oModal0.show();
      else if (index == 1) $scope.oModal1.show();
      else $scope.oModal2.show();
    };

    $scope.closeModal = function(index) {
      if (index == 1) $scope.oModal1.hide();
      else if (index == 0) $scope.oModal0.hide();
      else {
      	$scope.oModal2.hide().then(function(){$state.go('physiobuddyConnectBrace');})
      }
    };  

    //countdown timer
    // var timeleft = 10;
    // var countdownTimer = setInterval( function() {
    // timeleft = timeleft-1;
    // document.getElementById("timer").textContent = timeleft;
    // if(timeleft <= 0) {
    //     closeModal(1);
    //     clearInterval(countdownTimer);
    // }
    // },1500);

// var timeleft = 10;
//     var downloadTimer = setInterval(function(){
//     timeleft--;
//     document.getElementById("timer").textContent = timeleft;
//     if(timeleft <= 0)
//         clearInterval(downloadTimer);
//     },1000);

    	// var temp;
    	var afID;
    	var frameCounts = 0;
    	var currentUrl = $state.current.url;
	    var calculatedMvc = physiobuddyLogic.settings.mvc;
	    $scope.pageLogic = physiobuddyLogic;
	    var exerciseData = [], percentMVC = .60, stateIntervalExercise;
	    var atMVC = false, heldAtMVC = 0, mvcMiss = 0, heldAtMVCGoal = 5;
      	$scope.repNum = 0;
      	$scope.totalRep = 2;
      	var states = {
	        getReady: {
	          name: 'ready',
	          msg: 'Get ready to start flexing in XT s!',
	          count: 3,
	          nextState: 'measuring'
	        },
	        measuring: {
	          name: 'measuring',
	          msg: '',
	          count: 60,
	          nextState: 'timeout'
	        },
	        results: {
	          name: 'timeout',
	          msg: 'Nice try! Take a break and then try again',
	          count: 0,
	          nextState: 'idle'
	        },
	        idle: {
	          name: 'idle',
	          msg: '',
	          nextState: 'idle'
	        }
      	};

      	$scope.physiobuddyExercise = {
      		state: states.idle,
      		msg:'',
      		counter: 0,
      		channel: 0,
      	};

    	function doneExercise(){
    		//called when mvc has been held for at least 10 seconds
    		$scope.repNum++;
			atMVC = false;
			mvcMiss = 0;
			heldAtMVC = 0;
			exerciseData = [];
			physiobuddyExercisePlot.doneExercise();
    		flexvolt.api.turnDataOff();
    		console.log('done exercise');
    		if ($scope.repNum > $scope.totalRep-1){
    			$scope.openModal(2);
    		} else {
    			$scope.openModal(1);
    		}
    		//stop the function from continuing to be called
    		$interval.cancel(stateIntervalExercise);

    	};

    	//realtime processing data, called every second
	    function exerciseProcessor(){
	    	if ($scope.physiobuddyExercise.counter > 0){
	    		$scope.physiobuddyExercise.counter--;
	    		//decrement counter, this works as a countdown since only fired every 1s
	    	} else {
	    		//get next state
	    		$scope.physiobuddyExercise.state = states[$scope.physiobuddyExercise.state.nextState];

				if ($scope.physiobuddyExercise.state.name === 'measuring'){
					//clear everything before starting to measure
					atMVC = false;
					mvcMiss = 0;
					heldAtMVC = 0;
					exerciseData = [];
				} else if ($scope.physiobuddyExercise.state.name === 'timeout'){
					//if next states is timeout then the user was unable to complete exercise properly
				}
	    		$scope.physiobuddyExercise.counter = $scope.physiobuddyExercise.state.count;
	    	}
	    	if ($scope.physiobuddyExercise.state.name === 'measuring'){
	          // process dataIn and compare it to the mvc, define inMVC or notMVC range here
	        	if (percentMVC <= exerciseData){
	        		//if dataOut is higher percentage of MVC than 60 then set flag to true
	        		atMVC = true;
	        		physiobuddyExercisePlot.addText('Great Job! Keep pushing!');
	        		physiobuddyExercisePlot.addCountdownText('Holding your MVC for: ' +heldAtMVC);
	        		if(heldAtMVC > heldAtMVCGoal){
	        			doneExercise();
	        		}
	        		heldAtMVC++;
	        	} else {
	        		physiobuddyExercisePlot.addText('Push Harder!!')
	        		if (atMVC) {
	        			if (mvcMiss<3){
		        			// if below mvc but it hasn't been 3 seconds
		        			physiobuddyExercisePlot.addCountdownText('Holding your MVC for: ' + heldAtMVC);
		        			heldAtMVC++;
		        			mvcMiss ++;	        				
	        			} else {
	        				physiobuddyExercisePlot.removeCountdownText();
	        				atMVC = false;
	        				mvcMiss = 0;
	        				heldAtMVC = 0;
	        			}
	        		}
	        	}
	        } else {
	        	$scope.physiobuddyExercise.msg = $scope.physiobuddyExercise.state.msg.replace('XT',''+$scope.physiobuddyExercise.counter);
       			physiobuddyExercisePlot.addText($scope.physiobuddyExercise.msg);
       			sound.beep();
	        }
	    	//Display Seconds countdown
	    	console.log('exercise counter ' + $scope.physiobuddyExercise.msg);
	    	console.log('mvc counter ' + heldAtMVC);
       		console.log('exercise state' + $scope.physiobuddyExercise.state.name);
	    };

    	//function called when user clicks start exercise
    	$scope.startExercise = function(temp){
			flexvolt.api.turnDataOn();
        	$scope.physiobuddyExercise.channel = 0;
        	$scope.physiobuddyExercise.state = states.getReady;
	        $scope.physiobuddyExercise.counter = $scope.physiobuddyExercise.state.count;
	        $scope.physiobuddyExercise.msg = $scope.physiobuddyExercise.state.msg.replace('XT',''+$scope.physiobuddyExercise.counter);
	        physiobuddyExercisePlot.addText($scope.physiobuddyExercise.msg);
	        console.log('start Exercise');
	        stateIntervalExercise = $interval(exerciseProcessor,1000);
    	};


	    function updateAnimate(){
	        if ($scope.updating)return; // don't try to draw any graphics while the settings are being changed

	        var dataIn = dataHandler.getData();
	        if (dataIn === null || dataIn === angular.undefined ||
	            dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}

	        // convert data to percentMVC 
	        var dataOut = [];
	        var sum = 0, k=0;
	        if (dataIn[k].length > 0){
	            for (var i = 0; i < dataIn[k].length; i++){
	              sum += Math.abs(dataIn[k][i]);
	            }
	           	dataOut[k] = 100 * (sum/dataIn[k].length) / $scope.pageLogic.settings.mvc; // adjusting to actual
	        } else {
	            dataOut[k].value = 0; // just set to 0 if no values?
	        }
	        // if we are in measuring state we should be comparing to mvc and setting flag
	        exerciseData = dataOut[k];
	        // console.log(dataOut);

	        physiobuddyExercisePlot.update(dataOut[k]);
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
	                physiobuddyExercisePlot.init('#physiobuddyExerciseWindow', physiobuddyLogic.settings, hardwareLogic.settings.vMax);
	                paintStep();
	            });
	        }
	      }


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
    	window.onresize = function() {
	          if (afID){
	            window.cancelAnimationFrame(afID);
	          }
	          afID = undefined;
	          $scope.updating  = true;
	          physiobuddyExercisePlot.resize();
	          $scope.updating  = false;
	          paintStep();
	    };

      init();
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
	.controller('PhysiobuddyCalibrateCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup', '$interval', 'physiobuddyCalibratePlot', 'physiobuddyLogic', 'dataHandler', 'hardwareLogic','sound',
    function($scope, $state, $stateParams, $ionicPopup, $interval, physiobuddyCalibratePlot, physiobuddyLogic, dataHandler, hardwareLogic, sound) {

    	var afID;
    	var frameCounts = 0;
    	var currentUrl = $state.current.url;
      	var stateInterval, myPopup, mvcData, mvcRange;

      	var states = {
	        getReady: {
	          name: 'ready',
	          msg: 'Push as hard as you can in XT seconds!',
	          count: 3,
	          nextState: 'measuring'
	        },
	        measuring: {
	          name: 'measuring',
	          msg: 'Keep pushing, XT s remaining!',
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

	    //Once MVC is calculated leave the page and pass on the MVC value
	    function mvcCalculated(mvc){
			//clear the chart
			//physiobuddyCalibratePlot.afterMVC();
			//turn data off and set MVC 
			physiobuddyLogic.settings.mvc = mvc*100;
			flexvolt.api.turnDataOff();
			$state.go('physiobuddyCalibrated');
			$interval.cancel(stateInterval);
	    };

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
					mvcCalculated(mvc);
				}
	    		$scope.physiobuddyMVC.counter = $scope.physiobuddyMVC.state.count;
	    	}
	    	//Display Seconds countdown
	    	$scope.physiobuddyMVC.msg = $scope.physiobuddyMVC.state.msg.replace('XT',''+$scope.physiobuddyMVC.counter);
	    	// console.log('calibrate counter' + $scope.physiobuddyMVC.msg);
       		physiobuddyCalibratePlot.addText($scope.physiobuddyMVC.msg);
	    	sound.beep();
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
    		flexvolt.api.turnDataOn();
       	 	$scope.calibrating = true;
        	$scope.physiobuddyMVC.channel = 0;
        	$scope.physiobuddyMVC.state = states.getReady;
	        $scope.physiobuddyMVC.counter = $scope.physiobuddyMVC.state.count;
	        $scope.physiobuddyMVC.msg = $scope.physiobuddyMVC.state.msg.replace('XT',''+$scope.physiobuddyMVC.counter);
	        physiobuddyCalibratePlot.addText($scope.physiobuddyMVC.msg);
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

	        var dataOut = [];
	        if (dataIn[0].length === 0){
	        	dataIn[0].value = 0
	        }

	        dataOut = dataIn[0];
	        console.log(dataOut);

	        physiobuddyCalibratePlot.update(dataOut);
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
	                physiobuddyCalibratePlot.init('#physiobuddyCalibrateWindow', physiobuddyLogic.settings, 1000);
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
	          physiobuddyCalibratePlot.resize();
	          $scope.updating  = false;
	          paintStep();
	    };

	      init();
    }])
}())
