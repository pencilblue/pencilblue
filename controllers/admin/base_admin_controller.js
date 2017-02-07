/*
 Copyright (C) 2015  PencilBlue, LLC

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
'use strict';

//dependencies
var AdminSubnavService = require('../../include/service/admin/admin_subnav_service');
var BaseController = require('../base_controller');
var SettingServiceFactory = require('../../include/system/settings');
var SiteQueryService = require('../../include/service/entities/site_query_service');

/**
 * This class serves as a base class for all the controllers used in the admin control panel
 * @extends BaseController
 */
class BaseAdminController extends BaseController {
    constructor() {
        super();
    }

    /**
    * Initializes the admin controller with site-related info
    * @param {Object} context
    * @param {Function} cb
    */
    initSync(context) {
        this.siteQueryService = new SiteQueryService({site: this.site, onlyThisSite: true});
        this.settings = SettingServiceFactory.getServiceBySite(this.site, true);
    }

    /**
     * Centralized place to obtain the pills to be displayed on top of the admin controller
     * @param {string} navKey
     * @param {Localization} localizationService
     * @param {*} activePill
     * @param {Object} [data]
     * @return {Object} pill objects for admin console with site pill at the beginning
     */
    getAdminPills(navKey, localizationService, activePill, data) {
        var pills = AdminSubnavService.get(navKey, localizationService, activePill, data);
        return AdminSubnavService.addSiteToPills(pills, this.siteName);
    }
}

  module.exports = BaseAdminController;

