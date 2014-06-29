/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Service for creating JavaScript tags
 *
 * @module Services
 * @class ClientJS
 * @constructor
 */
function ClientJS(){}

/**
 * Creates a basic AngularJS controller with a repeat directive for templatizing
 *
 * @method getAngularController
 * @param {Object} objects     Object to be passed into AngularJS scope
 * @param {Array}  modules     Array of AngularJS module names
 * @param {String} directiveJS JavaScript to run after on-finish-render directive
 */
ClientJS.getAngularController = function(objects, modules, directiveJS) {
    if(typeof modules === 'undefined' || modules.length == 0)
    {
        modules = ['ngRoute'];
    }

    var angularController;
    if(typeof directiveJS === 'undefined') {
        angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ');';
    }
    else {
        angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ').directive("onFinishRender", function($timeout){return {restrict: "A",link: function(scope, element, attr){if (scope.$last === true){$timeout(function(){' + directiveJS + '})}}}});';
    }

    var scopeString = '';
    for(var key in objects) {
        if(typeof objects[key] === 'string') {
            if(objects[key].indexOf('function(') == 0) {
                scopeString = scopeString.concat('$scope.' + key + ' = ' + objects[key] + ";\n");
                continue;
            }
        }
        scopeString = scopeString.concat('$scope.' + key + ' = ' + JSON.stringify(objects[key], null, pb.log.isSilly() ? ' ' : undefined) + ";\n");
    }

    angularController = angularController.concat('function PencilBlueController($scope, $sce) {' + scopeString + "};\n");
    angularController = angularController.concat('pencilblueApp.config(["$compileProvider",function(e){e.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/)}]);');

    return pb.js.getJSTag(angularController);
};

/**
 * Creates a JS tag that loads the specified url
 *
 * @method includeJS
 * @param {String} url
 */
ClientJS.includeJS = function(url) {
    return new pb.TemplateValue('<script type="text/javascript" src="' + url + '"></script>', false);
};

/**
 * Puts the supplied JS code string into a script tag
 *
 * @method getJSTag
 * @param {String} jsCode
 */
ClientJS.getJSTag = function(jsCode) {
    return new pb.TemplateValue('<script type="text/javascript">\n' + jsCode + '\n</script>', false);
};

//exports
module.exports.ClientJS = ClientJS;
