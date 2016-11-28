/*
 Copyright (C) 2017  PencilBlue, LLC

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

module.exports = function SamplePluginModule(pb) {
  /**
   * SamplePlugin - A sample for exemplifying what the main module file should
   * look like.
   * @class SamplePlugin
   * @constructor
   */
  function SamplePlugin(){}

  /**
   * Called when the application is being installed for the first time.
   * @static
   * @method onInstallWithContext
   * @param {object} context
   * @param {string} context.site
   * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
   * The result should be TRUE on success and FALSE on failure
   */
  SamplePlugin.onInstallWithContext = function(context, cb) {
    cb(null, true);
  };

  /**
   * Called when the application is uninstalling this plugin.  The plugin should
   * make every effort to clean up any plugin-specific DB items or any in function
   * overrides it makes.
   * @static
   * @method onUninstallWithContext
   * @param {object} context
   * @param {string} context.site
   * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
   * The result should be TRUE on success and FALSE on failure
   */
  SamplePlugin.onUninstallWithContext = function (context, cb) {
    cb(null, true);
  };

  /**
   * Called when the application is starting up. The function is also called at
   * the end of a successful install. It is guaranteed that all core PB services
   * will be available including access to the core DB.
   * @static
   * @method onStartupWithContext
   * @param {object} context
   * @param {string} context.site
   * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
   * The result should be TRUE on success and FALSE on failure
   */
  SamplePlugin.onStartupWithContext = function (context, cb) {
    cb(null, true);
  };

  /**
   * Called when the application is gracefully shutting down.  No guarantees are
   * provided for how much time will be provided the plugin to shut down or which
   * services will be available at shutdown
   * @static
   * @method onShutdown
   * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
   * The result should be TRUE on success and FALSE on failure
   */
  SamplePlugin.onShutdown = function(cb) {
    cb(null, true);
  };

  //exports
  return SamplePlugin;
};
