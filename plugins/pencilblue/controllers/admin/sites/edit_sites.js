module.exports = function(pb) {

    var util = pb.util;

    function EditSites(){}
    util.inherits(EditSites, pb.BaseController);

    var SUB_NAV_KEY = 'sites_edit';

    EditSites.prototype.render = function(cb) {
        var self = this;
        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY)
        });
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/sites/edit_sites', function(err,result) {
            cb({content: result});
        });

    };

   EditSites.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_sites',
            title: ls.get('MANAGE_SITES'),
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