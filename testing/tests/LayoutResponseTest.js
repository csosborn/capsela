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
 * Date: 11/8/11
 */

"use strict";

var testbench = require(__dirname + '/../TestBench');
var MonkeyPatcher = require('capsela-util').MonkeyPatcher;
var Pipe = require('capsela-util').Pipe;
var mp = new MonkeyPatcher();

var capsela = require('../../');
var View = capsela.View;
var LayoutResponse = capsela.LayoutResponse;

module.exports["basics"] = {

    tearDown: function(cb) {
        mp.tearDown();
        cb();
    },

    "test init w/name": function(test) {

        var response = new LayoutResponse('my-view', {}, 701);

        test.equal(response.view, 'my-view');
        test.equal(response.layout, 'layout');
        test.equal(response.statusCode, 701);
        test.equal(response.getContentType(), 'text/html; charset=utf-8');

        test.done();
    },

    "test init w/view": function(test) {

        var mockView = {};
        var response = new LayoutResponse(mockView, {}, 401, 'blueprint');

        test.equal(response.view, mockView);
        test.equal(response.statusCode, 401);
        test.equal(response.layout, 'blueprint');
        test.equal(response.getContentType(), 'text/html; charset=utf-8');
        test.done();
    },

    "test sendBody": function(test) {

        var vm = {};
        var response = new LayoutResponse('my-view', vm, 701, 'bogans');
        var pipe = new Pipe();

        // test fluent interface
        test.equal(response.setRenderer({
            render: function(view, model) {

                if (view == 'bogans') {
                    test.equal(model.child, vm);
                    return 'layout: ' + model.content;
                }
                else if (view == 'my-view') {
                    test.equal(model, vm);
                    return 'result';
                }
            }
        }), response);

        pipe.getData('utf8').then(
            function(data) {
                test.equal(data, 'layout: result');
                test.done();
            }
        );

        response.sendBody(pipe);
    }
};