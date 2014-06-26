/**
 * TopMenuService -
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function TopMenuService(){}

//dependencies
var SectionService = pb.SectionService;

TopMenuService.getTopMenu = function(session, localizationService, cb) {

    var getTopMenu = function(session, localizationService, cb) {
	    var tasks = {
			themeSettings: function(callback) {
				pb.settings.get('site_logo', function(err, logo) {
					callback(null, {site_logo: logo, carousel_media: []});
				});
			},

			formattedSections: function(callback) {
				var sectionService = new SectionService();
				sectionService.getFormattedSections(localizationService, function(err, formattedSections) {
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
    getTopMenu(session, localizationService, cb);
};

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
