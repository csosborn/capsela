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

var Redirect = Response.extend(
    /** @lends Redirect */ {
},
/** @lends Redirect# */ {
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new empty response with the given status code.
     *
     * @constructs
     * @extends Response
     * @param location
     * @param code
     */
    init: function(location, code) {

        this._super(code || 301);

        if (!location) {
            throw new Error("can't redirect without location");
        }

        if (!/^https?:\/\//.test(location)) {
            throw new Error("the redirect location must be an absolute URL, including scheme");
        }

        this.setHeader('Location', location);
    }
});

exports.Redirect = Redirect;
