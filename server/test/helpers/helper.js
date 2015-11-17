var User = require('../../src/models/user');
var API = require('../../src/lib/api');
var Auth = require('../../src/auth/auth');
var Server = require('../../src/server');

module.exports = {
    apiRoute: '/api/v1',

    testUsers: ['test_user1', 'test_user2', 'test_user3', 'test_user4'],
    password: 'testpw0',

    server: null,

    /**
     * Starts the server.
     * @returns {Promise}
     */
    initializeServer: function() {
        var instance = this;
        return Server.initialize().then(function(server) {
            instance.server = server;
            return server;
        });
    },

    //TODO: Add fixtures
    /**
     * Remove all test users.
     * @returns {Promise} the promise when all users have been removed.
     */
    removeAllTestUsers: function() {
        "use strict";

        var instance = this;
        var promises = [];
        for (var i = 0; i < this.testUsers.length; i++) {
            promises.push(User.forge({username: instance.testUsers[i]}).fetch()
                .then(function(user) {
                    if (user) {
                        return user.destroyDeep();
                    }
                }));
        }
        return Promise.all(promises);
    },

    createAllTestUsers: function() {
        "use strict";

        var users = [];
        var instance = this;
        var promises = [];
        for (var i = 0; i < this.testUsers.length; i++) {
            var wrapper = function(i) {
                return Promise.resolve()
                    .then(function() {
                        return Auth.hash(instance.password)
                    })
                    .then(function(hash) {
                        return User.forge({username: instance.testUsers[i], password: hash}).save();
                    })
                    .then(function(user) {
                        users.push(user);
                        return API.populateUser(user);
                    })
            };
            promises.push(wrapper(i));
        }
        return Promise.all(promises).then(function() {
            return users;
        })
    },

    /**
     * Generate the authorization header string.
     * @param {String} username the username to use.
     * @param {String} password the password of the user.
     * @returns {string} the generated header.
     */
    generateSimpleAuthHeader: function(username, password) {
        return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64');
    },

    /**
     * Injects as a promise.
     * @param {*} data the data to inject.
     * @returns {Promise} the promise with the response.
     */
    inject: function(data) {
        var server = this.server;
        return new Promise(function(resolve, reject) {
            server.inject(data, function(response) {
                resolve(response);
            });
        });
    }
};