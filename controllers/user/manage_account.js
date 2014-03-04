/**
 * ManageAccount - UI for account management
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageAccount(){}

//inheritance
util.inherits(ManageAccount, pb.FormController);

ManageAccount.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('user/manage_account', '^loc_MANAGE_ACCOUNT^', null, function(data) {
        var result = '' + data;
        
        var dao = new pb.DAO();
        dao.query('pencilblue_theme_settings').then(function(data) {
            if(util.isError(data) || data.length == 0) {
                result = result.split('^site_logo^').join(pb.config.siteRoot + '/img/logo_menu.png');
            }
            else {
                result = result.split('^site_logo^').join(data[0].site_logo);
            }
        
            if(self.session.account_subsection) {
                result = result.concat(pb.js.getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "' + self.session.account_subsection + '")'));
            }
            else {
                result = result.concat(pb.js.getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "profile")'));
            }
        
            var content = self.localizationService.localize(['users'], result);
            cb({content: content});
        });
    });
};

//exports
module.exports = ManageAccount;
