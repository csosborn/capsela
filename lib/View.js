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
 * Date: 12/5/11
 */

"use strict";

var Class = require('capsela-util').Class

/*!
 * there are a lot of possibilities for the rendering architecture -
 * e.g. should layouts and resolvers be decorators attached to views?
 * should layout be a separate stage from viewrenderer?
 * what's the best way to indicate no/different layout?
 * i'd say the view should know its layout - it's kind of like an
 * orthogonal class hierarchy, which views descend from which layouts.
 *
 */

var View = Class.extend(
    /** @lends View */ {

},
/** @lends View# */ {
        
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Creates a new static view from the given HTML.
     *
     * @param {string} html
     * 
     * @constructs
     */
    init: function(html) {
        this.template = html;
    },
        
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Renders the view using the given model.
     *
     * @param model     an object
     *
     * @return string
     */
    render: function() {
        return this.template;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns true if this template looks like it's complete.
     */
    isComplete: function() {
        return /^\s*<!doctype|<html/i.test(this.template);
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Registers the given view object or name on this View as a parent.
     *
     * @deprecated because of the new LayoutResponse; this is unnecessarily general
     * @param view
     *
     * @return object   fluent
     */
    setParent: function(view) {
        this.parent = view;
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Returns this view's parent view.
     *
     * @deprecated because of the new LayoutResponse; this is unnecessarily general
     * @return object|string
     */
    getParent: function() {
        return this.parent;
    }
});

exports.View = View;