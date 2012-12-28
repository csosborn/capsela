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
 * Date: Feb 28, 2011
 */

"use strict";

var testbench = require('../../TestBench');

var fs = require('fs');

var capsela = require('../../../');
var Response = capsela.Response;
var Request = capsela.Request;
var Stage = capsela.Stage;
var ErrorHandler = capsela.stages.ErrorHandler;
var Q = require('q');

module.exports = {

    "test passthrough": function(test) {

        var request = new Request();
        var handler = new ErrorHandler();
        var response = new Response();

        handler.setNext(
            function(request) {
                return response;
            });

        Q.when(handler.service(request),
            function(res) {
                test.equal(res, response);
                test.done();
            });
    },

    "test catch empty response": function(test) {

        var request = new Request();
        var handler = new ErrorHandler();
        
        Q.when(handler.service(request),
            function(response) {

                test.equal(response.statusCode, 404);
                test.equal(response.view, 'error');
                test.done();
            }).done();
    },

    "test catch empty promise": function(test) {

        var request = new Request();
        var handler = new ErrorHandler();

        handler.setNext(
            function(request) {
                return Q.resolve();
            });

        Q.when(handler.service(request),
            function(response) {

                test.equal(response.statusCode, 404);
                test.equal(response.view, 'error');
                test.done();
            }).done();
    },

    "test catch thrown error": function(test) {

        var request = new Request();
        var handler = new ErrorHandler();
        var error = new Error("file not found");

        error.code = 404;

        handler.setNext(
            function(request) {
                throw error;
            });

        Q.when(handler.service(request),
            function(response) {
                test.equal(response.view, 'error');
                test.deepEqual(response.model, {
                    error: error
                });
                test.equal(response.statusCode, 404);
                test.done();
            }).done();
    }
};