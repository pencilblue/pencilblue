module.exports = function(pb) {

    var util = pb.util;

    function EditSites(){}
    util.inherits(EditSites, pb.BaseController);

    var SUB_NAV_KEY = 'sites_edit';

    EditSites.prototype.render = function(cb) {
        var self = this;
        var id = this.pathVars.siteid;
        var dao = new pb.DAO();
        dao.loadByValue('uid', id, 'site', function(err, data) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY)
            });
            self.ts.registerLocal('display_name', data.displayName.toString());
            self.ts.registerLocal('host_name', data.hostname.toString());
            self.ts.registerLocal('siteid', id.toString());
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/sites/edit_sites', function(err,result) {
                 cb({content: result});
            });
        });

    };

   EditSites.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'edit_sites',
            title: ls.get('EDIT_SITE'),
            icon: 'chevron-left',
            href: '/admin/sites'
        }, {
            name: 'new_site',
            title: '',
            icon: 'plus',
            href: '/admin/sites/new'
        }];
    };

    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditSites.getSubNavItems);

    return EditSites;
};