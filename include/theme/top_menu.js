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
 * Service for top menu navigation.
 * NOTE: This is not for administrative pages.
 *
 * @module Services
 * @submodule Theme
 * @class TopMenuService
 * @constructor
 */
function TopMenuService(){}

//dependencies
var SectionService = pb.SectionService;

/**
 * Retrieves the theme settings, navigation data structure, and account buttons.  
 *
 * @method getTopMenu
 * @param {Object} session The current user's session
 * @param {Localization} localizationService An instance of Localization to 
 * translate default items
 * @param {Object} [options] An optional argument to provide more flexibility 
 * to the menu construction.
 * @param {String} [options.currUrl] The current request URL.
 * @param {Function} cb Callback function that takes three parameters. The 
 * first are the theme's settings, the second is the navigation structure, and 
 * the third is the account button structure.
 */
TopMenuService.getTopMenu = function(session, localizationService, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {
            currUrl: null
        };
    }
    else if (!pb.utils.isObject(options)) {
        throw new Error('The options parameter must be an object');
    }

    var getTopMenu = function(session, localizationService, options, cb) {
	    var tasks = {
			themeSettings: function(callback) {
				pb.settings.get('site_logo', function(err, logo) {
					callback(null, {site_logo: logo});
				});
			},

			formattedSections: function(callback) {
				var sectionService = new SectionService();
				sectionService.getFormattedSections(localizationService, options.currUrl, function(err, formattedSections) {
					callback(null, formattedSections);
				});
			},

			accountButtons: function(callback) {
				TopMenuService.getAccountButtons(session, localizationService, callback);
			}
	    };
    	async.parallel(tasks, function(err, result) {
    		cb(result.themeSettings, result.formattedSections, result.accountButtons);
    	});
    };
    getTopMenu(session, localizationService, options, cb);
};

/**
 * Retrieves the information needed to draw account buttons
 *
 * @method getAccountButtons
 * @param {Object}   session
 * @param {Object}   ls      The localization service
 * @param {Function} cb      Callback function
 */
TopMenuService.getAccountButtons = function(session, ls, cb) {
	pb.content.getSettings(function(err, contentSettings) {
		//TODO handle error

        var accountButtons = [];

        if(contentSettings.allow_comments) {
            if(pb.security.isAuthenticated(session)) {
                accountButtons = [
                    {
                        icon: 'user',
                        title: ls.get('ACCOUNT'),
                        href: '/user/manage_account'
                    },
                    {
                        icon: 'rss',
                        title: ls.get('SUBSCRIBE'),
                        href: '/feed'
                    },
                    {
                        icon: 'power-off',
                        title: ls.get('LOGOUT'),
                        href: '/actions/logout'
                    }
                ];

            }
            else {
                accountButtons =
                [
                    {
                        icon: 'user',
                        title: ls.get('ACCOUNT'),
                        href: '/user/sign_up'
                    },
                    {
                        icon: 'rss',
                        title: ls.get('SUBSCRIBE'),
                        href: '/feed'
                    }
                ];
            }
        }
        else {
            accountButtons =
            [
                {
                    icon: 'rss',
                    title: ls.get('SUBSCRIBE'),
                    href: '/feed'
                }
            ];
        }
        cb(null, accountButtons);
    });
};

/**
 * Returns a bootstrap ready ul list for a nav element
 *
 * @method getBootstrapNav
 * @param {Object}   navigation     Navigation object
 * @param {Object}   accountButtons Account buttons object
 * @param {Function} cb             Callback function
 */
TopMenuService.getBootstrapNav = function(navigation, accountButtons, cb)
{
	var ts = new pb.TemplateService();
    ts.load('elements/top_menu/link', function(err, linkTemplate) {
        ts.load('elements/top_menu/dropdown', function(err, dropdownTemplate) {
            ts.load('elements/top_menu/account_button', function(err, accountButtonTemplate) {

            	var bootstrapNav = ' ';
                for(var i = 0; i < navigation.length; i++)
                {
                    if(navigation[i].dropdown)
                    {
                        var subNav = ' ';
                        for(var j = 0; j < navigation[i].children.length; j++)
                        {
                            if(!navigation[i].children[j]) {
                                continue;
                            }

                            var childItem = linkTemplate;
                            childItem = childItem.split('^active^').join((navigation[i].children[j].active) ? 'active' : '');
                            childItem = childItem.split('^url^').join(navigation[i].children[j].url);
                            childItem = childItem.split('^name^').join(navigation[i].children[j].name);

                            subNav = subNav.concat(childItem);
                        }

                        var dropdown = dropdownTemplate;
                        dropdown = dropdown.split('^navigation^').join(subNav);
                        dropdown = dropdown.split('^active^').join((navigation[i].active) ? 'active' : '');
                        dropdown = dropdown.split('^name^').join(navigation[i].name);

                        bootstrapNav = bootstrapNav.concat(dropdown);
                    }
                    else
                    {
                        var linkItem = linkTemplate;
                        linkItem = linkItem.split('^active^').join((navigation[i].active) ? 'active' : '');
                        linkItem = linkItem.split('^url^').join(navigation[i].url);
                        linkItem = linkItem.split('^name^').join(navigation[i].name);

                        bootstrapNav = bootstrapNav.concat(linkItem);
                    }
                }

                var buttons = ' ';
                for(i = 0; i < accountButtons.length; i++)
                {
                    var button = accountButtonTemplate;
                    button = button.split('^active^').join((accountButtons[i].active) ? 'active' : '');
                    button = button.split('^url^').join(accountButtons[i].href);
                    button = button.split('^title^').join(accountButtons[i].title);
                    button = button.split('^icon^').join(accountButtons[i].icon);

                    buttons = buttons.concat(button);
                }

                cb(bootstrapNav, buttons);
            });
        });
    });
};

//exports
module.exports = TopMenuService;
