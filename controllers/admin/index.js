/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function AdminIndexController(){}

//inheritance
util.inherits(AdminIndexController, pb.BaseController);

AdminIndexController.prototype.render = function(cb) {
	var self = this;
	
	//gather all the data
	this.gatherData(function(err, data) {
		if (util.isError(err)) {
			//throw err;
		}
		
		var name        = self.localizationService.get('ARTICLES');
    	var contentInfo = [
           {
        	   name: name, 
        	   count: data.articleCount, 
        	   href: '/admin/content/articles/manage_articles',
		   },
        ];
    	
    	name = self.localizationService.get('PAGES');
    	contentInfo.push({name: name, count: data.pageCount, href: '/admin/content/pages/manage_pages'});
    	
    	var angular = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService),
                contentInfo: contentInfo,
                cluster: data.clusterStatus
            }
        );
    	
    	self.setPageName(self.localizationService.get('DASHBOARD'));
        self.templateService.load('admin/index', function(error, result) {
        	
        	result = result.replace('^angular_script^', angular);
            cb({content: result});
        });
	});
};

AdminIndexController.prototype.gatherData = function(cb) {
	var tasks = {
		
		//article count
		articleCount: function(callback) {
			var dao    = new pb.DAO();
	        dao.count('article', pb.DAO.ANYWHERE, callback);
		},
	
		//page count
		pageCount: function(callback) {
			var dao    = new pb.DAO();
	        dao.count('page', pb.DAO.ANYWHERE, callback);
		},
		
		//cluster status
		clusterStatus: function(callback) {
			var service = new pb.ServerRegistration();
			service.getClusterStatus(function(err, clusterObj) {
				var cluster = [];
				if (clusterObj) {
					for (var prop in clusterObj) {
						try {
							cluster.push(JSON.parse(clusterObj[prop]));
						}
						catch(e){}
					}
				}
				callback(err, cluster);
			});
		}
	};
	async.parallel(tasks, cb);
};

//exports
module.exports = AdminIndexController;
