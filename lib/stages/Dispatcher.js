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
* Date: 12/9/11
*/

"use strict";

/**
 * do view rendering here rather than in separate compositor??
 */

var Log = require('capsela-util').Log;
var capsela = require('../../');
var fs = require('q-io/fs');
var Q = require('q');

var Dispatcher = capsela.Stage.extend({

    REF_NAMESPACE: 'action_link',

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the given string converted from camel-case to URL style with hyphens.
     * 
     * @param name
     */
    hyphenize: function(name) {

        // replace xY with x-y
        var s = name.replace(/([a-z])([A-Z])/g, function(match, s1, s2) {
            return s1 + '-' + s2.toLowerCase();
        });

        return s.toLowerCase();
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns the given string converted from URL style with hyphens to camel-case.
     *
     * @param name
     */
    dehyphenize: function(name) {

        // replace x-y with xY
        return name.toLowerCase().replace(/(\w)-(\w)/g, function(match, s1, s2) {
            return s1.toLowerCase() + s2.toUpperCase();
        });
    }
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @param baseUrl   the base URL to use when generating links
     * @param baseDir   directory where controller dirs can be found
     * @param config    optional config object, accessible by controllers
     */
    init: function(baseDir, config) {

        this.config = config || {};
        this.cByRoute = {};
        this.cByName = {};
        this.ready = baseDir ? this.setUp(baseDir) : true;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise that's resolved when the stage is ready.
     */
    isReady: function() {
        return this.ready;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    getConfig: function() {
        return this.config;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param reg
     */
    setResolver: function(reg) {
        this._super(reg);
         
        if (reg) {
            reg.register('action_link', this);
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param baseDir   directory where controller dirs can be found
     *
     * @return promise  completion promise
     */
    setUp: function(baseDir) {

        var t = this;

        // go through all subdirs looking for controllers
        return fs.list(baseDir).then(
            function(children) {

                children.forEach(function(name) {
                    t.loadController(baseDir, name);
                });
            }
        );
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Loads the controller in the specified directory and installs it.
     * 
     * @param baseDir
     * @param name
     *
     * @return object   the new controller
     */
    loadController: function(baseDir, name) {

        // load the controller
        this.log(Log.DEBUG, 'loading controller ' + name);

        var homeDir = baseDir + '/' + name;
        var cls = require(homeDir + '/Controller').Controller;

        var c = new cls();
        
        this.addController(c, name, homeDir);

        return c;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Adds the given Controller to this dispatcher.
     * 
     * @param c
     * @param name
     * @param homeDir
     */
    addController: function(c, name, homeDir) {

        // have setters on controller instead?
        c.name = name;
        c.dispatcher = this;
        c.homeDir = homeDir;

        if (name == 'default') {
            c.mountPoint = '';
        }
        else {
            c.mountPoint = this.Class.hyphenize(name);
        }

        this.cByRoute[c.mountPoint] = c;
        this.cByName[c.name] = c;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Resolves references of the form
     * ref:action_link:/controller/action/param1=x/param2=y/
     * to links to controller actions into absolute paths.
     *
     * @param controller
     * @param action
     * @param params
     * @param isLeaf      set to true if the target resource can not have children (otherwise appends slash)
     */
    resolve: function(nid, nss) {

        if (nid != Dispatcher.REF_NAMESPACE) {
            return;
        }

        var pieces = nss.split('/');

        var controller = pieces.shift();

        // allow a leading slash
        if (controller == '') {
            controller = pieces.shift();
        }

        var action = pieces.shift();
        var params = {};
        var isLeaf = true;

        // go through remaining pieces
        pieces.forEach(function(piece) {

            if (piece == '') {
                isLeaf = false;
                return;
            }
            
            var pair = piece.split('=');
            params[pair[0]] = pair[1];
        });

        var parts = [];
        var c;

        if (controller != 'default') {
            c = this.cByName[controller];

            if (!c) {
                throw new Error("controller '" + controller + "' not found");
            }

            parts.push(c.mountPoint);
        }

        if (action != 'default') {
            parts.push(this.Class.hyphenize(action));
        }

        for(var key in params) {
            parts.push(key);

            if (params[key] != null) {
                parts.push(params[key]);
            }
        }

        return '/' + parts.join('/') + (isLeaf ? '' : (parts.length ? '/' : ''));
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Dispatches the request to the appropriate controller action or falls through
     * if none found.
     * 
     * @param request
     *
     * @return response
     */
    service: function(request) {

        var t = this;
        var parts = request.path.split('/');

        parts.shift(); // always has a leading slash

        var controller = this.cByRoute[parts[0]];

        if (controller) {
            parts.shift();
        }
        else {
            controller = this.cByName['default'];
        }

        if (controller) {

            var methodName = parts[0] && this.Class.dehyphenize(parts[0]) + 'Action'
            var method = methodName && controller[methodName];

            if (typeof method == 'function') {
                parts.shift();
            }
            else {
                method = controller['defaultAction'];
            }
            
            if (method) {

                // split remainder of path into key/value pairs
                // and stuff into request params
                
                var i = 0;
                while(i < parts.length) {
                    request.params[parts[i]] = parts[i+1] || '';
                    i += 2;
                }

                return Q.when(method.apply(controller, [request]),
                    function(result) {

                        // fall through if no result
                        if (result == undefined) {
                            return t.pass(request);
                        }

                        return result;
                    });
            }
        }

        // fall through
        return this.pass(request);
    }
});

exports.Dispatcher = Dispatcher;