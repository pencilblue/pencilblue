/**
 * NotFound - The controller called on a 404
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NotFound(){}

//inheritance
var TopMenu = require('../../include/theme/top_menu');

NotFound.prototype.render = function(cb) {
	
	pb.templates.load('error/404', '404', null, function(data) {
        result = result.concat(data);
        
        pb.content.getSettings(function(contentSettings) {
            TopMenu.getTopMenu(session, function(themeSettings, navigation, accountButtons) {
                
            	var loggedIn = session.authentication.user ? true : false;
                result       = result.concat(pb.js.getAngularController(
                {
                    navigation: navigation,
                    contentSettings: contentSettings,
                    loggedIn: loggedIn,
                    themeSettings: themeSettings,
                    accountButtons: accountButtons
                }));
                
                var content = self.localizationService.localize(['error'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = NotFound;
