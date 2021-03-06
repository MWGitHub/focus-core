/**
 * Interacts with the API server.
 */
import request from 'reqwest';
import AuthStore from '../stores/AuthStore';
import Config from '../../config.json';

var baseURL = Config.apiBaseURL;
var contentType = 'application/x-www-form-urlencoded';

var API = {
    methods: {
        get: 'GET',
        post: 'POST',
        del: 'DELETE',
        put: 'PUT',
        patch: 'PATCH'
    },

    status: {
        register: {
            usernameTaken: 440
        }
    },

    /**
     * Routes to interact with the API server.
     */
    routes: {
        url: baseURL,
        user: baseURL + '/users',
        register: baseURL + '/users',
        login: baseURL + '/users/login',
        ageUser: baseURL + '/users/age',
        updateUser: baseURL + '/users/{id}/update',

        projectRetrieve: baseURL + '/projects/{id}',
        boardRetrieve: baseURL + '/boards/{id}',
        listRetrieve: baseURL + '/lists/{id}',

        taskCreate: baseURL + '/tasks',
        taskRetrieve: baseURL +  '/tasks/{id}',
        taskUpdateTitle: baseURL + '/tasks/{id}/update/',
        taskUpdatePosition: baseURL + '/tasks/{id}/update/',
        taskDelete: baseURL + '/tasks/{id}/delete',
        getStaleness: baseURL + '/stale/{id}'
    },

    parseRoute: function(route, tokens) {
        //var r = /({\w+})/g;
        for (var key in tokens) {
            if (!tokens.hasOwnProperty(key)) next;
            route = route.replace('{' + key +'}', tokens[key]);
        }
        return route;
    },

    /**
     * Retrieves data that requires authentication from a given URL.
     * @param {String} url the URL to retrieve the data from.
     * @param {*} data JSON data to use as queries.
     * @param {Function<*>?} success the success callback with the data retrieved.
     * @param {Function<Error>?} error the error callback with the error.
     */
    retrieveAuthDataFrom: function(url, data, success, error) {
        if (!AuthStore.isLoggedIn()) {
            if (error) error(new Error('Not logged in'));
            return;
        }

        var options = {
            url: url,
            method: 'GET',
            contentType: contentType,
            crossOrigin: true,
            data: data || {},
            success: function(resp) {
                if (success) success(resp);
            },
            error: function(err) {
                if (error) error(err);
            }
        };
        options.data.token = AuthStore.getJWT();
        request(options);
    },

    /**
     * Posts an action to the given URL.
     * @param {String} url the url to post to.
     * @param {String} method the method to use.
     * @param {*} data the JSON data to post.
     * @param {Function<*>?} success the success callback with the data retrieved.
     * @param {Function<Error>?} error the error callback with the error.
     */
    doAuthActionTo: function(url, method, data, success, error) {
        if (!AuthStore.isLoggedIn()) {
            if (error) error(new Error('Not logged in'));
            return;
        }

        var opt = {
            url: url + '?token=' + AuthStore.getJWT(),
            method: method,
            contentType: contentType,
            crossOrigin: true,
            success: function (resp) {
                if (success) success(resp);
            },
            error: function (err) {
                if (error) error(err);
            }
        };
        if (data) opt.data = data;
        request(opt);
    }
};

export default API;