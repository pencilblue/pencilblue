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
 * Interface for the admin dashboard
 * @class AdminIndexController
 * @constructor
 */
function AdminIndexController(){}

//inheritance
util.inherits(AdminIndexController, pb.BaseController);

/**
 * @see BaseController#render
 */
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

    	var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService),
                contentInfo: contentInfo,
                cluster: data.clusterStatus,
                access: self.session.authentication.admin_level
            }
        );
    	self.setPageName(self.localizationService.get('DASHBOARD'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/index', function(error, result) {
            cb({content: result});
        });
	});
};

/**
 * Gather all necessary data for rendering the dashboard.
 * <ul>
 * <li>Article count</li>
 * <li>Page Count</li>
 * <li>Cluster Status</li>
 * </ul>
 * @method gatherData
 * @param {Function} cb A callback that provides two parameters: cb(Error, Object)
 */
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
			service.getClusterStatus(function(err, cluster) {
				callback(err, cluster);
			});
		}
	};
	async.parallel(tasks, cb);
};

//exports
module.exports = AdminIndexController;
