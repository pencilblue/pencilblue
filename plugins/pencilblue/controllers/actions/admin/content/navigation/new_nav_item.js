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
 * Creates a nav item
 */

function NewNavItem(){}

//inheritance
util.inherits(NewNavItem, pb.BaseController);

NewNavItem.prototype.render = function(cb){
    var self = this;

    this.getJSONPostParams(function(err, post) {

        var navItem = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);

        //ensure a URL was provided
        if(!navItem.url && navItem.name) {
            navItem.url = navItem.name.toLowerCase().split(' ').join('-');
        }

        //strip unneeded properties
        pb.SectionService.trimForType(navItem);

        //validate
        var navService = new pb.SectionService();
        navService.save(navItem, function(err, result) {
            if(util.isError(err)) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                });
                return;
            }
            else if(util.isArray(result) && result.length > 0) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, NewNavItem.getHtmlErrorMsg(result))
                });
                return;
            }

            self.checkForNavMapUpdate(navItem, function() {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, navItem.name + ' ' + self.ls.get('CREATED'), true)});
            });
        });
    });
};

NewNavItem.prototype.checkForNavMapUpdate = function(navItem, cb) {
    var service = new pb.SectionService();
    service.updateNavMap(navItem, cb);
};

NewNavItem.getHtmlErrorMsg = function(validationErrors) {
    var html = '';
    for (var i = 0; i < validationErrors.length; i++) {
        if (i > 0) {
            html += '<br/>';
        }
        html += validationErrors[i].field + ':' + validationErrors[i].message;
    }
    return html;
};

//exports
module.exports = NewNavItem;
