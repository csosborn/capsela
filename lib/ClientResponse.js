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
 * Date: Mar 2, 2011
 */

"use strict";

var Response = require('./Response').Response;
var SafeStream = require('capsela-util').SafeStream;

var ClientResponse = Response.extend(
/** @lends ClientResponse */ {
},
/** @lends ClientResponse# */ {
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new HTTP client response.
     *
     * @constructs
     * @extends Response
     * 
     * @param statusCode
     * @param headers
     * @param bodyStream    readable stream providing the response body
     */
    init: function(statusCode, headers, bodyStream) {

        this._super(statusCode, headers);
        this.bodyStream = bodyStream; // could potentially be wrapped in a SafeStream
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns this response's readable body stream.
     */
    getBodyStream: function() {
        return this.bodyStream;
    }
});

exports.ClientResponse = ClientResponse;
