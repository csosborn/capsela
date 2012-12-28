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
 * Date: 1/9/12
 */

"use strict";

var jsontemplate = require('../../deps/json-template');

var capsela = require('../../');

var JsonTemplate = capsela.View.extend({
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param template
     */
    init: function(template) {

        this._super(template);
        this.env = {};

        // load any outbound params from the template

        var matches = template.match(/^\s*<!--ENV\s*(.*)\s*-->\s*(\S[\s\S]*)/);

        if (matches) {

            try {
                this.env = JSON.parse(matches[1]);
            }
            catch(err) {
                throw new Error("error parsing template: " + err.message);
            }

            // the template is the remainder
            this.template = matches[2];
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    getEnv: function() {
        return this.env;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the result of rendering this template using the given params.
     *
     * @param params
     *
     * @return string
     */
    render: function(params) {

        var p = {};
        var key;

        for (key in this.env) {
            p[key] = this.env[key];
        }

        for (key in params) {
            p[key] = params[key];
        }

        // todo inject the environment into params
        return jsontemplate.expand(this.template, p, {undefined_str: ''});
    }
});

exports.JsonTemplate = JsonTemplate;