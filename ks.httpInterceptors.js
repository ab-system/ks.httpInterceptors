angular.module("ks.httpInterceptors", ["toaster"])
    .factory("ajaxErrorHandler", [
        "$q","$injector",
        function ($q, $injector) {
            // Гробальный обработчик ошибок ajax-запросов
            return {
                responseError: function (rejection) {
                    if (rejection.status == 400) {
                        $injector.get('formFactory').showValidationErrors(rejection.data);
                        return $q.reject(rejection);
                    }
                    
                    var $modal = $injector.get('$uibModal');
                    $modal.open(
                    {
                        size: "lg",
                        templateUrl: "/html/ExceptionModal.html",
                        controller:["$scope",
                            function($scope) {
                                $scope.statusText = rejection.statusText;
                                $scope.status = rejection.status;
                                
                                if (angular.isObject(rejection.data)) {
                                    angular.extend($scope, rejection.data);

                                    if ($scope.Exception)
                                        $scope.Exception = JSON.stringify($scope.Exception, null, 2).replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
                                    
                                } else {
                                    $scope.showFrame = true;
                                    setTimeout(function() {
                                        var contents = $("#errorFrame").contents();
                                        var body = contents.find("body");
                                        body.html(rejection.data);
                                    }, 0);
                                }
                                
                            }
                        ]
                    });

                    return $q.reject(rejection);
                }
            };
        }
    ])
    .factory("saveRequestHandler", [
        "$controller","toaster",
        function ($controller, toaster) {
            /// <summary>
            /// если в конфиге запроса есть парамерт isSave, то после успешного результата покажет сообщение об успехе
            /// </summary>
            /// <returns type=""></returns>
            var saveRequestHandler = {
                request: function(config) {
                    if (config.isSave) {
                        config.lockScreen = true;
                    }
                    return config;
                },

                response: function(response) {
                    if (response.config.isSave) {
                        if (response.data && response.data.Data && (response.data.Data.StatusCode || response.data.Data.ReasonPhrase)) {
                            return response;
                        }
                        var saveSuccessMessage = "Сохранение объекта прошло успешно",
                            saveAndSendCaSuccessMessage = "Сохранение и отправка объекта в ЦА прошли успешно";

                        var successPopup = function(message) {
                            toaster.pop({
                                type: "success",
                                body: message,
                                toastId:'saveSuccess'
                            });
                        };
                        successPopup(saveSuccessMessage);
                    }
                    return response;
                }
            };
            return saveRequestHandler;
        }
    ])
    .factory("lockScreenRequestHandler", [
        "$q", "longOperationService",
        function($q, longOperationService) {
            /// <summary>
            /// Отображает крутилку если в опциях запроса была lockScreen
            /// </summary>
            /// <param name="$rootScope"></param>
            /// <param name="$q"></param>
            /// <returns type=""></returns>
            var saveRequestHandler = {
                request: function(config) {
                    if (config.lockScreen)
                        longOperationService.beginLoad();
                    return config;
                },
                requestError: function(rejection) {
                    if (rejection.config && rejection.config.lockScreen) {
                        longOperationService.endLoad();
                    }
                    return $q.reject(rejection);
                },
                response: function(response) {
                    if (response.config && response.config.lockScreen) {
                        longOperationService.endLoad();
                    }
                    return response;
                },
                responseError: function(rejection) {
                    if (rejection.config && rejection.config.lockScreen) {
                        longOperationService.endLoad();
                    }
                    return $q.reject(rejection);
                }
            };
            return saveRequestHandler;
        }
    ])
    .config([
        function () {
            /// <summary>
            /// Убирает часовые пояса у дат, считаем, что все находятся в UTC
            /// </summary>
            var offsetMiliseconds = new Date().getTimezoneOffset() * 60000;
            var nativeToJSON = Date.prototype.toJSON;
            Date.prototype.toJSON = function() {
                return nativeToJSON.apply(new Date(+this - offsetMiliseconds));
            }
        }
    ]);