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

module.exports = function(pb) {
    const { startTime, endTime } = require('./timing')(pb);
    const { errorHandler } = require('./errors')(pb);
    const { parseUrl, sessionCheck, checkPublicRoute, checkModuleRoute, systemSetupCheck, setMimeType } = require('./system')(pb);
    const { deriveSite, deriveActiveTheme, deriveRoute, inactiveAccessCheck } = require('./routing')(pb);
    const { requiresAuthenticationCheck, authorizationCheck, ipFilterCheck } = require('./auth')(pb);
    const { localizedRouteCheck, initializeLocalization } = require('./localization')(pb);
    const { instantiateController, initializeController, render, writeResponse } = require('./controller')(pb);

    const stack = [
        startTime,
        parseUrl,
        sessionCheck,
        checkModuleRoute,
        checkPublicRoute,
        errorHandler,
        deriveSite,
        deriveActiveTheme,
        deriveRoute,
        initializeLocalization,
        localizedRouteCheck,
        inactiveAccessCheck,
        systemSetupCheck,
        requiresAuthenticationCheck,
        authorizationCheck,
        ipFilterCheck,
        instantiateController,
        initializeController,
        render,
        writeResponse,
        setMimeType,
        endTime
    ];

    return {
        getAll: () => stack.map(fn => ({
            name: fn.name,
            action: fn
        }))
    }
};
