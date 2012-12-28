/*!
 * Copyright (C) 2011 by the Capsela contributors
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
 * Date: 10/28/11
 */

"use strict";

var Stage = require('../../').Stage;
var Q = require('q');

var DEFAULT_SESSION_ID_KEY = '_sid';
var DEFAULT_SESSION_TIMEOUT = 86400;

var SessionManager = Stage.extend({
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @param store     session store to use
     * @param sidKey    the key to use for session cookies and querystring params
     * @param timeout   session idle timeout, in seconds
     */
    init: function(store, sidKey, timeout) {

        this.store = store || new SessionStore();
        this.sidKey = sidKey || DEFAULT_SESSION_ID_KEY;
        this.sessionTimeout = timeout || DEFAULT_SESSION_TIMEOUT;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Attaches a session object to the given http request.
     *
     * @param request   http request object
     */
    service: function(request) {

        var t = this;

        // try to get the session ID from a cookie
        var sid = request.getCookie(this.sidKey);

        // fall back on a querystring param
        if (!sid) {
            sid = request.getParams()[this.sidKey];
        }

        var result = {};

        return this.establish(sid, result)
        .then(
            function(session) {

                // put the session on the request and pass it on
                request.session = session;

                return Q.when(t.pass(request),
                    function(response) {

                        if (!response) {
                            return;
                        }

                        // see if we need to set a cookie header

                        if (session.isEnded()) {
                            new Cookie(t.sidKey).unsetIn(response);
                            return t.store.destroy(request.session).then(
                                function() {
                                    return response;
                                }
                            );
                        }
                        else {
                            // save the session
                            return t.store.save(session).then(
                                function() {

                                    // see if the session was created for this request
                                    if (result.created) {

                                        // if there is a specific cookie path restriction noted in the
                                        // request, use it; otherwise default to '/'.
                                        // todo this is hacky
                                        var cookie = new Cookie(t.sidKey, session.getId(), null, null, null, request.cookiePath || '/');

                                        // initialize the cookie
                                        t.initCookie && t.initCookie(cookie);

                                        cookie.setIn(response);
                                    }

                                    return response;
                                }
                            );
                        }
                    });
            });
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for a new session.
     *
     * @param sid       the session ID
     * @param result    a result object
     *
     * @return promise
     */
    establish: function(sid, result) {

        var t = this;

        function createSession() {
            var session = new Session();
            result.created = true;
            return Q.resolve(session);
        };

        if (sid) {

            return t.store.load(sid).then(
                function(session) {

                    // see if the session exists and hasn't timed out
                    if (session && session.stillValid(t.sessionTimeout)) {
                        return session;
                    }
                    else {
                        // referenced session could not be found; establish a new session
                        return createSession();
                    }
                });
        }
        else {
            // session ID not provided
            return createSession();
        }
    }
});

exports.SessionManager = SessionManager;

var Cookie = require('../Cookie').Cookie;
var Session = require('../../').Session;
var SessionStore = require('../../').SessionStore;
var Response = require('../../').Response;