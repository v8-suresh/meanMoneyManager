'use strict';

// Trackers controller


angular.module('trackers')
    .controller('TrackersController', ['$scope', '$state', '$stateParams', 'Authentication', 'Trackers', 'TrackerLocaleMessages', 'TRACKER_CONST', 'VAULT_CONST', 'INCEXP_CONST', 'AppStatics', 'UserStatics', 'AppMessenger', 'moment', '$q',
        function($scope, $state, $stateParams, Authentication, Trackers, TrackerLocaleMessages, TRACKER_CONST, VAULT_CONST, INCEXP_CONST, AppStatics, UserStatics, AppMessenger, moment, $q) {
            var _this = this;
            _this.appStatics = AppStatics;
            _this.userStatics = UserStatics;
            _this.authentication = Authentication;
            _this.assignedUsers = [];
            _this.assignedUsers.push(Authentication.user);
            var pullMsgs = function(){
            	var deferred = $q.defer();
            	TrackerLocaleMessages.pullMessages().then(function(labels){
        			_this.labelsObj = labels;
        			deferred.resolve(null);
                });
                return deferred.promise;
            };

            var pullTrackers = function () {
                _this.trackers = Trackers.query();
                return _this.trackers.$promise;
            };
            
            var pullTracker = function () {
                $scope.tracker = Trackers.get({
                    trackerId: $stateParams.trackerId
                });
                return $scope.tracker.$promise;
            };
            
            var pullCurrencies = function(){
            	var deferred = $q.defer();
            	var cachedVal = _this.appStatics.getCurrencies();
            	//	If value is already cached by service - then use it otherwise 
            	if(cachedVal){
            		_this.currencies = cachedVal;
            		deferred.resolve(null);
            	} else {
            		_this.appStatics.loadCurrencies().then(function(response){
                        _this.currencies = [];
                        response.map(function(item){
                            _this.currencies.push(item);
                        });
                        deferred.resolve(null);
                    });	
            	}
            	return deferred.promise;
            };
            
            var bootmodule = function () {
//                _this.getLabel = function(key){
//                	return _this.labelsObj[key];
//                };
                _this.getLocalTime = function (time) {
                    return moment(time).toString();
                };
                _this.getOwnerTxt = function (tracker) {
                    return (tracker.owner && tracker.owner._id && (tracker.owner._id === Authentication.user._id)) ? 'Me' :
                        ((tracker.owner && tracker.owner.displayName) ? tracker.owner.displayName : 'No Name');
                };
                _this.getUsersTxt = function (tracker) {
                    var users = '';
                    //TODO - splice owner name from this
                    if (tracker.users && tracker.users.length > 1) {
                        for (var i = 0; i < tracker.users.length; i++) {
                            if(tracker.owner._id === tracker.users[i]._id)	continue;
                            if (users !== '') {
                                users = users + ((i === tracker.users.length - 2) ? ' , ' : ' and ') + 
                                	((tracker.users[i]._id === Authentication.user._id) ? 'Me' : tracker.users[i].displayName);
                            } else {
                                users = tracker.users[i].displayName;
                            }
                        }
                    } else if (tracker.users && tracker.users.length === 1) {
                        users = 'No one else - this is my private tracker';
                    }
                    return users;
                };
                _this.loadVaults = function (trackerId) {
                    $state.go(VAULT_CONST.LIST_VAULTS_STATE_NAME, {trackerId: trackerId});
                };
                _this.loadIncexps = function (trackerId) {
//                    $state.go(INCEXP_CONST.LIST_INCEXPS_STATE_NAME, {trackerId: trackerId});
                    //TODO - find current month and year
                    var now = moment();
                    var month = now.format('MM');
                    var year = now.format('YYYY');
                    $state.go(INCEXP_CONST.LIST_INCEXPS_BY_MONTH_STATE_NAME, {
                    	trackerId: trackerId,
                    	month : month,
                    	year: year
                    });
                };
                _this.loadIncexpsDashboard = function (trackerId) {
//                  $state.go(INCEXP_CONST.DASH_INCEXPS_STATE_NAME, {trackerId: trackerId});
                  //TODO - find current month and year
                  var now = moment();
                  var month = now.format('MM');
                  var year = now.format('YYYY');
                  $state.go(INCEXP_CONST.DASH_INCEXPS_BY_MONTH_STATE_NAME, {
                  	trackerId: trackerId,
                  	month : month,
                  	year: year
                  });
              };
                _this.createTracker = function (size) {
                    _this.tracker = {};
                    $state.go(TRACKER_CONST.CREATE_TRACKER_STATE_NAME);
                };
                _this.editTracker = function (tracker) {
                    $state.go(TRACKER_CONST.EDIT_TRACKER_STATE_NAME, {trackerId: tracker._id});
                };
                _this.cancel = function (tracker) {
                    $state.go(TRACKER_CONST.LIST_TRACKERS_STATE_NAME);
                };
                _this.saveTracker = function (size) {
                    var tracker = new Trackers({
                        displayName: _this.displayName,
                        description: _this.description,
                        currency: _this.currency,
                        owner: _this.owner,
                        // users: _this.users,
                        created: _this.created
                    });
                    tracker.users = [];
                    angular.forEach(_this.assignedUsers, function (value, key) {
                        tracker.users.push(value._id);
                    });
                    tracker.$save(function (response) {
                        $state.go(TRACKER_CONST.LIST_TRACKERS_STATE_NAME);
                        AppMessenger.sendInfoMsg(_this.labelsObj['app.trackers.info.msg.createdTracker']);
                    }, function (errorResponse) {
                        $scope.error = errorResponse.data.message;
                    });
                };
                _this.updateTracker = function (updatedTracker) {
                    var tracker = updatedTracker;
                    var users = [];
                    var owner = tracker.owner._id;
                    angular.forEach(tracker.users, function (value, key) {
                        users.push(value._id);
                    });
                    tracker.owner = owner;
                    tracker.users = users;
                    tracker.$update(function () {
                        $state.go(TRACKER_CONST.LIST_TRACKERS_STATE_NAME);
                        AppMessenger.sendInfoMsg(_this.labelsObj['app.trackers.info.msg.updatedTracker']);
                    }, function (errorResponse) {
                        $scope.error = errorResponse.data.message;
                    });
                };


                _this.remove = function (tracker) {
                    if (tracker) {
                        tracker.$remove(function () {
                            $state.go(TRACKER_CONST.LIST_TRACKERS_STATE_NAME, $stateParams, {reload: true});
                            AppMessenger.sendInfoMsg(_this.labelsObj['app.trackers.info.msg.deletedTracker']);
                        }, function (errorResponse) {
                            $scope.error = errorResponse.data.message;
                        });
                    }
                };

            };
            
            	//Bootstrapping based on application state
            if($state.current.name === TRACKER_CONST.LIST_TRACKERS_STATE_NAME){
            	pullMsgs().then(pullTrackers).then(bootmodule);
            } else if($state.current.name === TRACKER_CONST.CREATE_TRACKER_STATE_NAME){
            	pullMsgs().then(pullCurrencies).then(bootmodule);
            } else if($state.current.name === TRACKER_CONST.EDIT_TRACKER_STATE_NAME){
            	pullMsgs().then(pullCurrencies).then(pullTracker).then(bootmodule);
            }
        }
    ])
;
