module.exports = function SiteFormModule(pb) {

    var util = pb.util;

    function SiteForm(){}
    util.inherits(SiteForm, pb.BaseController);

    var SUB_NAV_KEY = 'sites_edit';

    SiteForm.prototype.render = function(cb) {
        var self = this;
        var isNew = true;
        var id = this.pathVars.siteid;
        var dao = new pb.DAO();
        dao.loadByValue('uid', id, 'site', function(err, data) {
            if (data) {
                isNew = false;
                var display = data.displayName.toString();
                var host = data.hostname.toString();
                var isActive = data.active;
                var uid = data.uid;
            }

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                tabs: [{ active: 'active', href: '#editSite', icon: 'cog', title: self.ls.get('EDIT_SITE') }],
                displayName: display,
                hostname: host,
                isNew: isNew,
                isActive: isActive,
                uid: uid
            });

            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/sites/site_form', function(err,result) {
                cb({content: result});
            });
        });

    };

    SiteForm.getSubNavItems = function(key, ls, data) {
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

    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SiteForm.getSubNavItems);

    return SiteForm;
};