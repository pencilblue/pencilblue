/**
 * NotFound - The controller called on a 404
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NotFound(){}

//dependencies
var TopMenu = require('../../include/theme/top_menu');

//inheritance
util.inherits(NotFound, pb.BaseController);

NotFound.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName('404');
    pb.content.getSettings(function(err, contentSettings) {
        TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
            TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
                
                //load template
                self.ts.registerLocal('navigation', navigation);
                self.ts.registerLocal('account_buttons', accountButtons);
                self.ts.load('error/404', function(err, data) {
                    var result = '' + data;

                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: navigation,
                        contentSettings: contentSettings,
                        loggedIn: pb.security.isAuthenticated(self.session),
                        accountButtons: accountButtons
                    }));
                    
                    cb({content: result, code: 404, content_type: 'text/html'});
                });
            });
        });
    });
};

//exports
module.exports = NotFound;
