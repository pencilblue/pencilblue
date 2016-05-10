/*
Copyright (C) 2016  PencilBlue, LLC

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

module.exports = function(pb) {

    //pb dependencies
    var util              = pb.util;
    var BaseController    = pb.BaseController;
    var ValidationService = pb.ValidationService;
    var UrlService        = pb.UrlService;

    /**
     * Allows interaction with the user's locale.  Specifically, it allows for
     * the setting of the user's locale for the current session
     * @class LocaleViewController
     * @constructor
     * @extends BaseController
     */
    function LocaleViewController(){}
    util.inherits(LocaleViewController, BaseController);

    /**
     * Sets the user's locale for the session and then redirects them back to
     * where they came from
     * @method setLocale
     * @param {Function} cb
     */
    LocaleViewController.prototype.setLocale = function(cb) {
        var self = this;

        //try to get the new locale by querystring then check to see if it was passed via body
        var locale = this.query.locale;
        if (!ValidationService.isNonEmptyStr(locale, true) && util.isObject(this.body)) {
            locale = this.body.locale;
        }

        //calculate the redirect.  Referrer if provided otherwise head home
        var redirect = this.req.headers.referer;
        if (!ValidationService.isNonEmptyStr(redirect, true)) {
            redirect = UrlService.createSystemUrl('/', { hostname: this.hostname });
        }

        //when new locale is provided then set it in the session
        if (util.isString(locale)) {
            this.session.locale = locale;
        }

        //redirect back to where you came from
        this.redirect(redirect, cb);
    };

    //exports
    return LocaleViewController;
};
