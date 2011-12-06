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
 * Date: Feb 26, 2011
 */

"use strict";

var fs = require('q-fs');
var path = require('path');
var Stage = require('capsela').Stage;
var Q = require('qq');

var FileServer = Stage.extend({

    TYPES: {

        'txt':  {type: 'text', subtype: 'plain'},
        'html': {type: 'text', subtype: 'html'},
        'xml':  {type: 'text', subtype: 'xml'},
        'css':  {type: 'text', subtype: 'css'},
        'js':   {type: 'text', subtype: 'javascript'}, // yeah, yeah, i know
        'json': {type: 'application', subtype: 'json'},
        'png':  {type: 'image', subtype: 'png'},
        'svg':  {type: 'image', subtype: 'svg+xml'},
        'jpg':  {type: 'image', subtype: 'jpeg'},
        'jpeg': {type: 'image', subtype: 'jpeg'},
        'gif':  {type: 'image', subtype: 'gif'},
        'tiff': {type: 'image', subtype: 'tiff'},
        'ico':  {type: 'image', subtype: 'x-icon'}
    }
    
},
{
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a file server for the specified directory.
     *
     * @param baseUrl       the path to look for in request URLs
     * @param directory     the path of the directory to map onto baseUrl
     * @param fallThrough   set to true to fall through instead of returning 404
     *                      if base URL matches but not full URL
     * @param defaultFile         the filename to serve as directory indexes (optional)
     */
    init: function(baseUrl, directory, fallThrough, defaultFile) {
        this.baseUrls = [];
        this.basePaths = [];
        this.fallThrough = fallThrough;
        this.defaultFile = defaultFile;
        this.addPath(baseUrl, directory);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Add an additional path mapping.
     * 
     * @param baseUrl
     * @param directory
     */
    addPath: function(baseUrl, directory) {
        
        this.baseUrls.push(baseUrl.charAt(0) == '/' ? baseUrl : '/' + baseUrl);
        this.basePaths.push(directory);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * todo this whole thing could probably use restructuring
     */
    service: function(request) {

        var t = this;
        var reqPath = request.path;

        // bounce malicious paths - not very sophisticated; could be legal
        // todo do we need to decodeURIComponent request.url or does node do that?
        if (reqPath.indexOf('..') >= 0) {
            return new ErrorResponse(new Error("can't use .. in path"), 403);
        }

        // notFound becomes true if the request names a directory for which there is a
        // mapping, but the request file isn't there. If true, the response will be 404.
        // Otherwise fall through to the next layer.
        var notFound = false;

        // try the baseUrl/basePath combination with the given index. Calls self recursively
        // until there are no more mappings or the file is found.
        function tryPath(index) {

            if (index >= t.baseUrls.length) {
                
                // no more mappings
                if (notFound && !t.fallThrough) {
                    return new ErrorResponse(new Error('file not found'), 404);
                }
                else {
                    return t.pass(request);
                }
            }

            var baseUrl = t.baseUrls[index];

            if (reqPath != baseUrl) {

                // normalize with trailing slash
                baseUrl += baseUrl.charAt(baseUrl.length - 1) == '/' ? '' : '/';

                if (reqPath.indexOf(baseUrl) != 0) {
                    // doesn't match; pass through
                    return tryPath(index+1);
                }
            }

            var filePath = t.basePaths[index] + '/';

            if (reqPath.length == baseUrl.length) {
                filePath += t.defaultFile;
            }
            else {
                filePath += reqPath.substr(baseUrl.length);
            }

            // see if the file exists (and is in fact a file, not a directory)
            
            return fs.stat(filePath).then(
                function(stats) {
                    if (stats && stats.isFile()) {

                        var checkTime = request.getHeader('if-modified-since');
                        var response;

                        if (checkTime&& stats.mtime.getTime() <= Date.parse(checkTime)) {
                            response = new Response(304);
                        }
                        else {
                            response = new FileResponse(filePath, stats);
                        }

                        // todo move these to FileResponse or caching layer
                        
                        response.setHeader('Expires',
                            new Date(Date.now() + 365 * 86400 * 1000).toUTCString()); // give it a year, per RFC 2616 section 14.21

                        response.setHeader('Last-Modified', stats.mtime.toUTCString());

                        return response;
                    }
                    else {
                        notFound = true;
                        return tryPath(index+1);
                    }
                },
                function(err) {
                    notFound = true;
                    return tryPath(index+1);
                });
        }
        
        return tryPath(0);
    }
});

exports.FileServer = FileServer;

var Response = require('capsela').Response;
var ErrorResponse = require('capsela').ErrorResponse;
var FileResponse = require('capsela').FileResponse;