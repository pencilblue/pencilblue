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
	
	this.setPageName(this.ls.get('MANAGE_ACCOUNT'));
	this.ts.registerLocal('site_logo', function(flag, cb) {
		
		var dao = new pb.DAO();
        dao.query('pencilblue_theme_settings').then(function(data) {
        	var logoPath;
	        if(data && data.length == 0) {
	            logoPath = path.join(pb.config.siteRoot, 'img', 'logo_menu.png');
	        }
	        else {
	            logoPath = data[0].site_logo;
	        }
	        cb(util.isError(data) ? data : null, logoPath);
        });
	});
	this.ts.load('user/manage_account', function(err, data) {
        var result = '' + data;
        
        if(self.session.account_subsection) {
            result = result.concat(pb.js.getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "' + self.session.account_subsection + '")'));
        }
        else {
            result = result.concat(pb.js.getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "profile")'));
        }

        cb({content: result});
    });
};

//exports
module.exports = ManageAccount;
