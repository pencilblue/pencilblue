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
	
	pb.templates.load('error/404', '404', null, function(data) {
        var result = '' + data;
        
        pb.content.getSettings(function(err, contentSettings) {
            TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
                TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons)
                {
                    result = result.split('^navigation^').join(navigation);
                    result = result.split('^account_buttons^').join(accountButtons);
                    
                	var loggedIn = false;
                	if (self.session && self.session.authentication) {
                		if (self.session.authentication.user) {
                			loggedIn = true;
                		}
                	} 
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: navigation,
                        contentSettings: contentSettings,
                        loggedIn: loggedIn,
                        themeSettings: themeSettings,
                        accountButtons: accountButtons
                    }));
                    
                    var content = self.localizationService.localize(['error'], result);
                    cb({content: content, code: 404, content_type: 'text/html'});
                });
            });
        });
    });
};

//exports
module.exports = NotFound;
