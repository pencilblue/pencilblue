/**
 * DeletePage - Deletes pages
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeletePage(){}

//inheritance
util.inherits(DeletePage, pb.BaseController);

DeletePage.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/content/pages/manage_pages', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.query('page', {_id: ObjectID(vars['id'])}).then(function(pages) {
        if(pages.length == 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/manage_pages', cb);
            return;
        }
        
        var page = pages[0];
        dao.deleteMatching({_id: ObjectID(vars['id'])}, 'page').then(function(pagesDeleted) {
            if(util.isError(pagesDeleted) || pagesDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/manage_pages', cb);
                return;
            }
            
            self.session.success = page.headline + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
        });
    });
};

//exports
module.exports = DeletePage;
