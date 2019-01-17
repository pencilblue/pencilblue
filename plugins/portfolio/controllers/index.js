/*
 Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var path = require('path');

module.exports = function IndexModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var TopMenu       = pb.TopMenuService;
    var MediaLoader   = pb.MediaLoader;

    /**
     * Index The home page controller of the portfolio theme.
     * @class Index
     * @author Blake Callens <blake@pencilblue.org>
     * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
     */
    function Index() {}
    util.inherits(Index, pb.BaseController);

    Index.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.siteQueryService = new pb.SiteQueryService({site: self.site});
            cb();
        });
    };

    /**
     * This is the function that will be called by the system's RequestHandler.  It
     * will map the incoming route to the ones below and then instantiate this
     * prototype.  The request handler will then proceed to call this function.
     * Its callback should contain everything needed in order to provide a response.
     *
     * @param cb The callback.  It does not require a an error parameter.  All
     * errors should be handled by the controller and format the appropriate
     *  response.  The system will attempt to catch any catastrophic errors but
     *  makes no guarantees.
     */
    Index.prototype.render = function(cb) {
        var self = this;

        var content = {
            content_type: "text/html",
            code: 200
        };

        var options = {
            currUrl: this.req.url,
            site: self.site
        };
        TopMenu.getTopMenu(self.session, self.ls, options, function(themeSettings, navigation, accountButtons) {
            TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
                var pluginService = new pb.PluginService({site: self.site});

                pluginService.getSettings('portfolio', function(err, portfolioSettings) {
                    var homePageKeywords = '';
                    var homePageDescription = '';
                    for(var i = 0; i < portfolioSettings.length; i++) {
                        switch(portfolioSettings[i].name) {
                            case 'home_page_keywords':
                                homePageKeywords = portfolioSettings[i].value;
                                break;
                            case 'home_page_description':
                                homePageDescription = portfolioSettings[i].value;
                                break;
                            default:
                                break;
                        }
                    }
                    self.ts.registerLocal('meta_keywords', homePageKeywords);
                    self.ts.registerLocal('meta_desc', homePageDescription);
                    self.ts.registerLocal('meta_title', self.siteName);
                    self.ts.registerLocal('meta_lang', pb.config.localization.defaultLocale);
                    self.ts.registerLocal('current_url', self.req.url);
                    self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
                    self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
                    self.ts.load('landing_page', function(err, template) {
                        if(util.isError(err)) {
                            content.content = '';
                        }
                        else {
                            content.content = template;
                        }

                        var opts = {
                            where: {settings_type: 'home_page'}
                        };
                        self.siteQueryService.q('portfolio_theme_settings', opts, function(err, settings) {
                            if (util.isError(err)) {
                                self.reqHandler.serveError(err);
                            }
                            if(settings.length > 0) {
                                settings = settings[0];
                            }

                            //remove any callouts that are blank. If the home page
                            //settings for the plugin have not been set it is
                            //possible for the setting to be empty.  Therefore we
                            //must put in a fall back plan of an empty array.
                            var callouts = settings.callouts || [];
                            for(var i = callouts.length - 1; i >= 0; i--) {
                                if(typeof callouts[i].copy === 'undefined' || !callouts[i].copy.length) {
                                    callouts.splice(i, 1);
                                }
                            }
                            content.content = content.content.split('^display_callouts^').join(callouts.length ? '' : 'display: none');

                            var colWidth = Math.floor(12 / callouts.length) + '';
                            self.ts.registerLocal('col_width', colWidth);
                            self.ts.load('elements/callout', function(err, template) {
                                if(util.isError(err)) {
                                    template = '';
                                }

                                var calloutsHTML = '';
                                for(var i = 0; i < callouts.length; i++) {
                                    var calloutTemplate = template.split('^copy^').join(callouts[i].copy);
                                    if(callouts[i].headline && callouts[i].headline.length) {
                                        if(callouts[i].link && callouts[i].link.length) {
                                            calloutTemplate = calloutTemplate.split('^headline^').join('<h3><a href="' + callouts[i].link + '">' + callouts[i].headline + '</a></h3>');
                                        }
                                        else {
                                            calloutTemplate = calloutTemplate.split('^headline^').join('<h3>' + callouts[i].headline + '</h3>');
                                        }
                                    }
                                    else {
                                        calloutTemplate = calloutTemplate.split('^headline^').join('');
                                    }

                                    calloutsHTML += calloutTemplate;
                                }


                                if(!settings.page_layout) {
                                    settings.page_layout = '';
                                }
                                var mediaLoader = new MediaLoader({site: self.site, onlyThisSite: self.onlyThisSite});
                                mediaLoader.start(settings.page_layout, function(err, layout) {
                                    content.content = content.content.split('^layout^').join(layout);
                                    content.content = content.content.split('^hero_image^').join(settings.home_page_hero ? settings.home_page_hero : '');
                                    content.content = content.content.split('^callouts^').join(calloutsHTML);

                                    var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
                                    content.content = content.content.concat(angularData);

                                    cb(content);
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    /**
     * Provides the routes that are to be handled by an instance of this prototype.
     * The route provides a definition of path, permissions, authentication, and
     * expected content type.
     * Method is optional
     * Path is required
     * Permissions are optional
     * Access levels are optional
     * Content type is optional
     *
     * @param cb A callback of the form: cb(error, array of objects)
     */
    Index.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/',
                auth_required: false,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return Index;
};
