var User = require('../models/user');
var Auth = require('../lib/auth');
var Boom = require('boom');
var Bcrypt = require('bcrypt');
var API = require('../lib/api');
var moment = require('moment-timezone');

var userHandler = {
    /**
     * Registers a user and populates with default data.
     * @param request
     * @param reply
     */
    register: function(request, reply) {
        "use strict";

        var username = request.payload['username'].toLowerCase();
        var password = request.payload['password'];
        var timezone = request.payload['timezone'] || API.defaultTimeZone;

        // Check to make sure the username does not already exist
        var replied;
        User.forge({username: username}).fetch()
            .then(function(user) {
                if (user) throw new Error();
            })
            .catch(function(e) {
                replied = reply(Boom.unauthorized('Username already exists'));
                throw(e);
            })
            .then(function() {
                return Auth.hash(password);
            })
            .then(function(hash) {
                return User.forge({
                    username: username,
                    password: hash,
                    timezone: timezone
                }).save()
            })
            .then(function(user) {
                return API.populateUser(user).then(function() {
                    reply(API.makeData({
                        id: user.get('id'),
                        username: user.get('username'),
                        timezone: user.get('timezone')
                    }));
                });
            })
            .catch(function(e) {
                if (!replied) reply(Boom.badRequest());
            });
    },

    /**
     * Log in as a user.
     * @param request
     * @param reply
     */
    login: function(request, reply) {
        "use strict";

        var username = request.payload['username'].toLowerCase();
        var password = request.payload['password'];

        // Check to make sure the username exists
        User.forge({username: username}).fetch()
            .then(function(user) {
                if (!user) {
                    reply(Boom.unauthorized());
                } else {
                    Bcrypt.compare(password, user.get('password'), function(err, isValid) {
                        if (err) {
                            reply(Boom.badImplementation());
                        } else if (isValid) {
                            //reply(user.get('username') + ' has been found.');
                            reply(API.makeStatusMessage('user-login', true, Auth.generateToken(user.get('id'))));
                        } else {
                            reply(Boom.unauthorized());
                        }
                    });
                }
            });
    },

    /**
     * Logs out the user.
     * @param request
     * @param reply
     */
    logout: function(request, reply) {
        "use strict";

        if (request.auth.isAuthenticated) {
            if (request.auth.strategy === 'simple') {
                reply(API.makeStatusMessage('user-logout', true, 'Logged out')).code(401);
            } else {
                reply(API.makeStatusMessage('user-logout', true, 'Logged out'));
            }
        } else {
            reply(API.makeStatusMessage('user-logout', true, 'Not logged in'));
        }
    },

    /**
     * Removes the given user.
     * @param request
     * @param reply
     */
    remove: function(request, reply) {
        "use strict";

        var id = request.params.id;
        // Cannot delete when not owner
        // TODO: Support admin deletion
        if (request.auth.credentials.id !== id) {
            reply(Boom.unauthorized());
            return;
        }
        User.forge({id: id}).fetch({require: true})
            .then(function(user) {
                return user.destroyDeep();
            })
            .then(function() {
                reply(API.makeStatusMessage('user-delete', true, 'User deleted')).redirect(API.route + '/user/logout');
            })
            .catch(function(e) {
                reply(Boom.notFound());
            });
    },

    /**
     * Retrieve info about the use.
     * @param request
     * @param reply
     */
    retrieve: function(request, reply) {
        "use strict";

        var id = request.params.id;
        // Do not allow non owning user to retrieve user data
        // TODO: Add partial retrieval of user page when not owner
        if (!request.auth.isAuthenticated || id !== request.auth.credentials.id) {
            reply(Boom.unauthorized());
            return;
        }

        var user;
        User.forge({id: id}).fetch({require: true})
            // Update the user if needed
            .then(function(v) {
                user = v;
                return API.updateUserTasks(user);
            })
            // Retrieve the user data
            .then(function() {
                return user.retrieveAsData();
            })
            .then(function(data) {
                reply(API.makeData(data));
            })
            .catch(function(err) {
                reply(Boom.notFound());
            });
    },

    /**
     * Updates the user.
     * @param request
     * @param reply
     */
    update: function(request, reply) {
        var force = request.payload['force'];
        User.forge({id: request.auth.credentials.id}).fetch({require: true})
            // Update the user if needed
            .then(function(user) {
                return API.updateUserTasks(user, force);
            })
            .then(function() {
                reply(API.makeStatusMessage('user-update', true, 'User updated'));
            })
            .catch(function(err) {
                reply(Boom.notFound());
            });
    }
};

module.exports = userHandler;