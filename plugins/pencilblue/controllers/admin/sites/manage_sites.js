/*
 Copyright (C) 2016  PencilBlue, LLC

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
const Promise = require('bluebird');
module.exports = function(pb) {

    const SUB_NAV_KEY = 'sites_manage';
    const SITE_COLLECTION = 'site';
    const PER_PAGE = 50;

    /**
     * Renders a view to display and manage all the sites
     * @constructor
     * @extends BaseController
     */
    class ManageSites extends pb.BaseController {

        constructor() {
            super();
            this.dao = Promise.promisifyAll(new pb.DAO());
        }
        /**
         * Render view to manage sites.
         * @method render
         * @param {Function} cb - callback function
         */
        render(cb) {
            this._getSites()
                .then(([activeSites, inactiveSites, activeCount, inactiveCount]) => {
                    let angularObjects = pb.ClientJs.getAngularObjects({
                        navigation: pb.AdminNavigation.get(this.session, ['site_entity'], this.ls, this.site),
                        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, this.ls, SUB_NAV_KEY),
                        activeSites,
                        inactiveSites,
                        activeCount,
                        inactiveCount,
                        totalPagesActive: Math.ceil(activeCount/PER_PAGE),
                        totalPagesInactive: Math.ceil(inactiveCount/PER_PAGE),
                        tabs: this.tabs
                    });
                    this.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    this.ts.load('admin/sites/manage_sites', function (err, result) {
                        cb({content: result});
                    });
                });
        }

        /**
         * Action to search for a given site.
         * @method search
         * @param {Function} cb - callback function
         */
        search(cb) {
            let siteQuery = this.query.site || '';
            let isActive = this.query.active === 'true';
            let caseInsensitiveQuery = new RegExp(`${siteQuery}`, 'i');
            this._getSitesByCriteria({where: {active: isActive, '$or': [{'uid':siteQuery}, {'displayName': caseInsensitiveQuery}, {'hostname': caseInsensitiveQuery}]}})
                .then(data => cb({content: data}), err => cb(err));
        }

        /** caseInsensitiveQuery
         * Action to paginate for a given site list.
         * @method getPage
         * @param {Function} cb - callback function
         */
        getPage(cb) {
            let isActive = this.query.active === 'true';
            let page = this.query.page || 0;
            page *= PER_PAGE;

            this._getSitesByCriteria({where: {active: isActive}, offset: page, limit: PER_PAGE})
                .then(data => cb({content: data}), err => cb(err));
        }

        _getSites() {
            let activeSites = this._getSitesByCriteria({select: pb.DAO.PROJECT_ALL, where: {active: true}, offset: 0, limit: PER_PAGE});
            let inactiveSites = this._getSitesByCriteria({select: pb.DAO.PROJECT_ALL, where: {active: false}, offset: 0, limit: PER_PAGE});
            let activeCount = this.dao.countAsync(SITE_COLLECTION, {active: true});
            let inactiveCount = this.dao.countAsync(SITE_COLLECTION, {active: false});
            return Promise.all([activeSites, inactiveSites, activeCount, inactiveCount]);
        }

        _getSitesByCriteria(options) {
            return this.dao.qAsync(SITE_COLLECTION, options)
                .each((site) => {
                    let siteService = Promise.promisifyAll(pb.SettingServiceFactory.getServiceBySite(site.uid));
                    return siteService.getAsync('active_theme')
                        .then((theme = '') => {
                            site.activeTheme = theme;
                            return site;
                        });
                });
        }
        get tabs() {
            return [
                {
                    active: 'active',
                    href: '#active_sites',
                    icon: 'font',
                    title: 'Active Sites'
                },
                {
                    href: '#inactive_sites',
                    icon: 'italic',
                    title: 'Inactive Sites'
                }
            ];
        }

        /**
         * Get array of nav items for nav pills.
         * @method getSubNavItems
         * @param {String} key
         * @param {Object} ls
         * @returns {Array} array of nav items
         */
        static getSubNavItems(key, ls) {
            return [{
                name: 'manage_sites',
                title: ls.g('admin.MANAGE_SITES'),
                icon: 'refresh',
                href: '/admin/sites'
            }, {
                name: 'new_site',
                title: '',
                icon: 'plus',
                href: '/admin/sites/new'
            }];
        };
    }




    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageSites.getSubNavItems);

    return ManageSites;
};
