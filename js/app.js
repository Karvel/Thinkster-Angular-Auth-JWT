(function()
{
    function authInterceptor(API, auth)
    {
        return {
            //automatically attach uthorization header
            request: function(config)
            {
                var token = auth.getToken();

                if(config.url.indexOf(API) === 0 && token)
                {
                    config.headers.Authorization = 'Bearer ' + token;
                }//end if

                return config;
            },

            //If a token was sent back, save it
            response: function(res) {
                if(res.config.url.indexOf(API) === 0  && res.data.token)
                {
                    auth.saveToken(res.data.token);
                }//end if

                return res;
            },
        };
    }//end authInterceptor

    function authService($window)
    {
        var self = this;

        self.parseJwt = function(token)
        {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            return JSON.parse($window.atob(base64));
        };//end self.parseJwt

        self.saveToken = function(token)
        {
            $window.localStorage['jwtToken'] = token;
        };//end self.saveToken

        self.getToken = function()
        {
            return $window.localStorage['jwtToken'];
        };//end self.getToken

        self.isAuthed = function()
        {
            var token = self.getToken();
            if(token) {
                var params = self.parseJwt(token);
                return Math.round(new Date().getTime() / 1000) <= params.exp;
            }//end if
            else {
                return false;
            }//end else
        };//end self.isAuthed

        self.logout = function()
        {
            $window.localStorage.removeItem('jwtToken');
        };//end self.logout
    }//end authService

    function userService($http, API, auth)
    {
        var self = this;

        self.getQuote = function()
        {
            return $http.get(API + '/auth/quote');
        };//end self.getQuote

        self.register = function(username, password)
        {
            return $http.post(API + '/auth/register',
            {
                username: username,
                password: password
            });
        };//end self.register

        self.login = function(username, password)
        {
            return $http.post(API + '/auth/login',
            {
                username: username,
                password: password
            });
        };//end self.login
    }

    function MainCtrl(user, auth)
    {
        var self = this;

        function handleRequest(res)
        {
            var token = res.data ? res.data.token : null;
            if (token)
            {
                console.log('JWT:', token);
            }//end if
            self.message = res.data.message;
        }//end handleRequest

        self.login = function()
        {
            user.login(self.username, self.password)
                .then(handleRequest, handleRequest);
        };//end self.login
        self.register = function()
        {
            user.register(self.username, self.password)
                .then(handleRequest, handleRequest);
        };//end self.register
        self.getQuote = function()
        {
            user.getQuote()
                .then(handleRequest, handleRequest);
        };//end self.getQuote
        self.logout = function()
        {
            auth.logout && auth.logout();
        };
        self.isAuthed = function()
        {
            return auth.isAuthed ? auth.isAuthed() : false;
        };//end self.isAuthed
    }

    angular.module('app', [])
        .factory('authInterceptor', authInterceptor)
        .service('user', userService)
        .service('auth', authService)
        .constant('API', 'http://test-routes.herokuapp.com')
        .config(function($httpProvider) {
            $httpProvider.interceptors.push('authInterceptor');
        })
        .controller('Main', MainCtrl);
})();
