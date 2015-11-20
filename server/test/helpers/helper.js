"use strict"

var Bookshelf = require('../../src/lib/bookshelf');
var User = require('../../src/models/user');
var API = require('../../src/lib/api');
var Auth = require('../../src/auth/auth');
var Server = require('../../src/server');
var co = require('co');
var Config = require('../../config.json');

/**
 * Helper instance that holds server state until after is run.
 */
class Helper {
    constructor() {
        this.apiRoute = Config.apiRoute;
        this.server = null;
    }


    /**
     * Sets up the server.
     * @returns {*|Promise}
     */
    startup() {
        this.server = new Server(Config);
        var instance = this;
        return co(function* () {
            process.env.NODE_ENV = 'test';

            yield Bookshelf.knex.migrate.latest();
            yield Bookshelf.knex.seed.run();

            yield instance.server.initialize();
            return instance.server;
        });
    }

    /**
     * Destroys and reverts persistent changes to the server.
     * @returns {*|Promise}
     */
    teardown() {
        var instance = this;
        return co(function* () {
            // Delete all data
            yield Bookshelf.knex('project_permissions').del();
            yield Bookshelf.knex('tasks').del();
            yield Bookshelf.knex('lists').del();
            yield Bookshelf.knex('boards').del();
            yield Bookshelf.knex('projects').del();
            yield Bookshelf.knex('users').del();

            if (instance.server) {
                yield instance.server.stop();
                instance.server = null;
            }
        });
    }

    /**
     * Generate the authorization header string.
     * @param {String} username the username to use.
     * @param {String} password the password of the user.
     * @returns {string} the generated header.
     */
    generateSimpleAuthHeader(username, password) {
        return 'Basic ' + (new Buffer(username + ':' + password, 'utf8')).toString('base64');
    }

    /**
     * Injects as a promise.
     * @param {*} data the data to inject.
     * @returns {Promise} the promise with the response.
     */
    inject(data) {
        var server = this.server.server;
        return new Promise(function (resolve, reject) {
            server.inject(data, function (response) {
                resolve(response);
            });
        });
    }
}

module.exports = Helper;