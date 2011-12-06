/**
 * Copyright (C) 2011 Sitelier Inc.
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
 * Date: 11/16/11
 */

"use strict";

var Stage = require('capsela').Stage;
var Q = require('qq');

var ErrorHandler = Stage.extend({

},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @param template  the JSON template to use for the error page
     */
    init: function(template) {
        this.template = template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param request
     */
    service: function(request) {

        var t = this;

        return Q.when(this.pass(request),
            function(response) {

                // intercept errors
                if (response && response instanceof ErrorResponse) {
                    return new TemplateResponse(
                        t.template, {
                            error: response.error,
                            code: response.statusCode
                        }, response.statusCode
                    );
                }

                return response;
            });
    }
});

exports.ErrorHandler = ErrorHandler;

var ErrorResponse = require('../ErrorResponse').ErrorResponse;
var TemplateResponse = require('../TemplateResponse').TemplateResponse;