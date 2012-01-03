/**
 * Copyright (c) 2011 Sitelier Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Author: Seth Purcell
 * Date: Feb 10, 2011
 */

"use strict";
/*global require: false, __dirname: false, global: false, process: false, exports: true, Buffer: false, module: false, setInterval: true */

var testbench = require('../../TestBench');
var testCase = require('nodeunit').testCase;

var capsela = require('capsela');
var SessionManager = capsela.stages.SessionManager;
var SessionStore = capsela.SessionStore;
var Session = capsela.Session;
var Request = capsela.Request;
var Response = capsela.Response;
var Cookie = capsela.Cookie;

var Q = require('qq');

// save the originals
var originals = {
    datenow: Date.now,
    setInterval: setInterval
};

var ss = new SessionStore();
var sm = new SessionManager(ss);

module.exports = testCase({

    tearDown: function(cb) {

        // restore originals
        Date.now = originals.datenow;
        setInterval = originals.setInterval;
        cb();
    },

    "test init without store": function(test) {

        test.throws(function() {
            new SessionManager();
        });

        test.done();
    },

    "test pass returns nothing": function(test) {

        var session = new Session();

        var mockStore = {

            createSession: function() {
                return session;
            },

            save: function(saved, cb) {
                test.equal(saved, session);
                cb();
            }
        };

        var sm = new SessionManager(mockStore);

        sm.pass = function(request) {};

        // add session to request
        var request = new Request();

        Q.when(sm.service(request),
            function(response) {
                test.equal(response, undefined);
                test.done();
            });
    },

    "test establish with no id": function(test) {

        var mockSession = {};

        var mockStore = {

            createSession: function() {
                return mockSession;
            }
        };

        var sm = new SessionManager(mockStore);
        var result = {};

        sm.establish(undefined, result).then(
            function(session) {
                test.ok(result.created);
                test.equal(session, mockSession);
                test.done();
            });
    },

    "test establish w/valid session ID": function(test) {

        test.expect(4);

        var mockSession = {
            stillValid: function() {
                test.ok(true);
                return true;
            }
        };

        var mockStore = {

            load: function(id) {
                test.equal(id, 'the-xx');
                return Q.ref(mockSession);
            }
        };
        
        var sm = new SessionManager(mockStore, 'the-xx');
        var result = {};
        
        sm.establish('the-xx', result).then(
            function(session) {
                test.ok(!result.created);
                test.equal(session, mockSession);
                test.done();
            });
    },

    "test establish w/expired session ID": function(test) {

        test.expect(4);

        var mockSession = {
            stillValid: function() {
                test.ok(true);
                return false;
            }
        };

        var newSession = {};

        var mockStore = {

            load: function(id) {
                test.equal(id, 'the-xx');
                return Q.ref(mockSession);
            },
            
            createSession: function() {
                return Q.ref(newSession);
            }
        };

        var sm = new SessionManager(mockStore, 'the-xx');
        var result = {};
        
        sm.establish('the-xx', result).then(
            function(session) {
                test.ok(result.created);
                test.equal(session, newSession);
                test.done();
            });
    },

    "test process saves non-ended session": function(test) {

        test.expect(1);

        var session = new Session();

        var mockStore = {

            save: function(saved) {
                test.equal(saved, session);
                return Q.ref();
            },

            load: function(sid) {
                return Q.ref(session);
            }
        };

        var sm = new SessionManager(mockStore);
        var response = new Response();
        
        sm.pass = function(request) {
            return response;
        }

        response.setHeader = function(name, value) {

            // make sure header was NOT set
            test.ok(false, "set header called for some reason");
        };

        // add session to request
        var request = new Request('GET', '/', {
            'cookie': 'sks-session-id=' + session.getId()
        });

        Q.when(sm.service(request), function() {
            test.done();
        });
    },

    "test postprocess kills ended session": function(test) {

        test.expect(3);

        var session = new Session();

        var mockStore = {

            save: function(saved) {
                test.equal(saved, session);
                return Q.ref();
            },

            load: function(sid) {
                return Q.ref(session);
            },

            destroy: function(destroyed) {
                test.equal(destroyed, session);
                return Q.ref();
            }
        };

        var sm = new SessionManager(mockStore);
        var response = new Response();

        sm.pass = function(request) {
            var d = Q.defer();
            request.session.end(function() {
                d.resolve(response);
            });
            return d.promise;
        };

        var request = new Request('GET', '/', {
            'cookie': 'sks-session-id=' + session.getId()
        });

        response.setHeader = function(name, value) {
            // make sure header was set
            test.equal('Set-Cookie', name);
            test.equal('sks-session-id=aloha; Expires=Thu, 01 Jan 1970 05:30:00 GMT', value);
        };
        
        Q.when(sm.service(request), function() {
            test.done();
        });
    }
});

// make sure if roles change that all extant sessions reflect this!