/**
 * Index - The home page controller of the portfolio theme.
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function Index() {}

//dependencies
var PluginService = pb.PluginService;
var TopMenu       = require(DOCUMENT_ROOT + '/include/theme/top_menu');

//inheritance
util.inherits(Index, pb.BaseController);

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

    TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {

            self.ts.registerLocal('navigation', navigation);
            self.ts.registerLocal('account_buttons', accountButtons);
            self.ts.load('index', function(err, template) {
                if(util.isError(err)) {
                    content.content = '';
                }
                else {
                    content.content = template;
                }

                self.ps = new PluginService();

                self.ps.getSettings('portfolio', function(error, settings) {
                    var callouts = self.getCallouts(settings);
                    var layout = self.getLayout(settings);

                    for(var i = 0; i < callouts.length; i++) {
                        if(!callouts[i].copy.length) {
                            callouts.splice(i, 1);
                            i--;
                            continue;
                        }
                    }

                    if(!callouts.length) {
                        content.content = content.content.split('^display_callouts^').join('display: none');
                    }
                    else {
                        content.content = content.content.split('^display_callouts^').join('');
                    }

                    self.ts.registerLocal('col_width', (12 / callouts.length).toString());
                    self.ts.load('elements/callout', function(err, template) {
                        if(util.isError(err)) {
                            template = '';
                        }

                        var calloutsHTML = '';
                        for(var i = 0; i < callouts.length; i++) {
                            var calloutTemplate = template.split('^copy^').join(callouts[i].copy);
                            if(callouts[i].headline && callouts[i].headline.length) {
                                calloutTemplate = calloutTemplate.split('^headline^').join('<h3>' + callouts[i].headline + '</h3>');
                            }
                            else {
                                calloutTemplate = calloutTemplate.split('^headline^').join('');
                            }

                            calloutsHTML += calloutTemplate;
                        }

                        content.content = content.content.split('^layout^').join(layout);
                        content.content = content.content.split('^callouts^').join(calloutsHTML);

                        cb(content);
                    });
                });
            });
        });
    });
};

Index.prototype.getCallouts = function(settings) {
    var callouts = [{}, {}, {}];

    for(var i = 0; i < settings.length; i++)
    {
        if(settings[i].name === 'index_page_callout_1_headline') {
            callouts[0].headline = settings[i].value;
            continue;
        }
        if(settings[i].name === 'index_page_callout_1_copy') {
            callouts[0].copy = settings[i].value;
            continue;
        }
        if(settings[i].name === 'index_page_callout_2_headline') {
            callouts[1].headline = settings[i].value;
            continue;
        }
        if(settings[i].name === 'index_page_callout_2_copy') {
            callouts[1].copy = settings[i].value;
            continue;
        }
        if(settings[i].name === 'index_page_callout_3_headline') {
            callouts[2].headline = settings[i].value;
            continue;
        }
        if(settings[i].name === 'index_page_callout_3_copy') {
            callouts[2].copy = settings[i].value;
            continue;
        }
    }

    return callouts;
};

Index.prototype.getLayout = function(settings) {
    for(var i = 0; i < settings.length; i++)
    {
        if(settings[i].name === 'index_page_layout') {
            return settings[i].value;
        }
    }

    return '';
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
module.exports = Index;
