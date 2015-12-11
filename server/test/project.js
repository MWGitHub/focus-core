var assert = require('chai').assert;
var Helper = require('./helpers/helper');
var co = require('co');
var moment = require('moment-timezone');
var _ = require('lodash');

describe('project', function() {
    /**
     * @type {Helper}
     */
    var helper;

    beforeEach(function(done) {
        helper = new Helper();
        helper.startup().then(function() {
            done();
        });
    });

    afterEach(function(done) {
        helper.teardown().then(function() {
            done();
        });
    });

    it('should create a project and set admin on creator', function(done) {
        co(function* () {
            var user = helper.userSeeds[0];
            var token = (yield helper.login(user.username, user.password)).result.data.token;

            // Test with only title given
            var payload = {
                method: 'POST',
                url: helper.apiRoute + '/projects',
                headers: {
                    authorization: token
                },
                payload: {
                    title: 'test-project'
                }
            };
            var response = yield helper.inject(payload);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project');
            assert.equal(response.result.data.attributes.is_public, false);

            // Test with title and public given
            var clone = _.cloneDeep(payload);
            clone.payload.is_public = true;
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project');
            assert.equal(response.result.data.attributes.is_public, true);

            // Test with public given as false
            clone = _.cloneDeep(payload);
            clone.payload.is_public = false;
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project');
            assert.equal(response.result.data.attributes.is_public, false);

            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should not create an invalid project', function(done) {
        co(function* () {
            var user = helper.userSeeds[0];
            var token = (yield helper.login(user.username, user.password)).result.data.token;

            // Test with title too short
            var payload = {
                method: 'POST',
                url: helper.apiRoute + '/projects',
                headers: {
                    authorization: token
                },
                payload: {
                    title: ''
                }
            };
            var response = yield helper.inject(payload);
            assert.equal(response.statusCode, Helper.Status.error);

            // Test with title too long
            var clone = _.cloneDeep(payload);
            clone.payload.title = _.pad('', 1000, 'a');
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            // Public flag invalid
            clone = _.cloneDeep(payload);
            clone.payload.is_public = 'yes';
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            // Should not be allowed to create a project when not logged in
            response = yield helper.inject({
                method: 'POST',
                url: helper.apiRoute + '/projects',
                payload: {
                    title: 'valid'
                }
            });
            assert.equal(response.statusCode, Helper.Status.unauthorized);

            done();
        }).catch(function(e) {
            done(e);
        })
    });

    it('should update the project', function(done) {
        co(function* () {
            var user = helper.userSeeds[0];
            var token = (yield helper.login(user.username, user.password)).result.data.token;

            var payload = {
                method: 'POST',
                url: helper.apiRoute + '/projects/0/update',
                headers: {
                    authorization: token
                },
                payload: {
                }
            };

            // Change title of project
            var clone = _.cloneDeep(payload);
            clone.payload.title = 'test-project';
            var response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project');
            assert.equal(response.result.data.attributes.is_public, false);

            // Change the public flag
            clone = _.cloneDeep(payload);
            clone.payload.is_public = true;
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project');
            assert.equal(response.result.data.attributes.is_public, true);

            // Change the title again
            clone = _.cloneDeep(payload);
            clone.payload.title = 'test-project-again';
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project-again');
            assert.equal(response.result.data.attributes.is_public, true);

            // Change the public flag back to false
            clone = _.cloneDeep(payload);
            clone.payload.is_public = false;
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'test-project-again');
            assert.equal(response.result.data.attributes.is_public, false);

            // Change both the title and public flag
            clone = _.cloneDeep(payload);
            clone.payload.title = 'another';
            clone.payload.is_public = true;
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'another');
            assert.equal(response.result.data.attributes.is_public, true);

            // No payload given should do nothing
            response = yield helper.inject(payload);
            assert.equal(response.statusCode, Helper.Status.valid);
            assert.equal(response.result.data.attributes.title, 'another');
            assert.equal(response.result.data.attributes.is_public, true);

            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should disallow invalid updates', function(done) {
        co(function* () {
            var user = helper.userSeeds[0];
            var token = (yield helper.login(user.username, user.password)).result.data.token;

            var payload = {
                method: 'POST',
                url: helper.apiRoute + '/projects/0/update',
                headers: {
                    authorization: token
                },
                payload: {
                }
            };

            // Change title of the project to be too long
            var clone = _.cloneDeep(payload);
            clone.payload.title = _.pad('', 1000, 'a');
            var response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            // Change title of the project to be too short
            clone = _.cloneDeep(payload);
            clone.payload.title = '';
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            // Change flag of the project to be invalid
            clone = _.cloneDeep(payload);
            clone.payload.is_public = 'wrong';
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            // Change both parameters to be invalid
            clone = _.cloneDeep(payload);
            clone.payload.title = '';
            clone.payload.is_public = 'wrong';
            response = yield helper.inject(clone);
            assert.equal(response.statusCode, Helper.Status.error);

            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should disallow updating project title of non-admins', function(done) {
        co(function* () {
            assert(false);
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should allow viewing of projects for valid users', function(done) {
        co(function* () {
            assert(false);
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should not allow viewing of private projects to users without access', function(done) {
        co(function* () {
            assert(false);
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should allow admins to delete projects', function(done) {
        co(function* () {
            assert(false);
            done();
        }).catch(function(e) {
            done(e);
        });
    });

    it('should not allow non-admins to delete projects', function(done) {
        co(function* () {
            assert(false);
            done();
        }).catch(function(e) {
            done(e);
        });
    });
});