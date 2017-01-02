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

// dependencies
const url = require('url');
const util = require('../include/util.js');

module.exports = function BaseControllerModule(pb) {
  // pb dependancies
  const SiteService = pb.SiteService;
  /**
   * The snippet of JS code that will ensure that a form is refilled with values
   * from the post
   * @static
   * @private
   * @property FORM_REFILL_PATTERN
   * @type {String}
   */
  const FORM_REFILL_PATTERN = `if(typeof refillForm !== "undefined") {\n
  $(document).ready(function(){\n
  refillForm(%s)});}`;

  /**
   * The snippet of HTML that will display an alert box
   * @static
   * @private
   * @property ALERT_PATTERN
   * @type {String}
   */
  const ALERT_PATTERN = '<div class="alert %s error_success">%s<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';

  /**
   * A mapping that converts the HTTP standard for content-type encoding and
   * what the Buffer prototype expects
   * @static
   * @private
   * @readonly
   * @property ENCODING_MAPPING
   * @type {Object}
   */
  const ENCODING_MAPPING = Object.freeze({
    'UTF-8': 'utf8',
    'US-ASCII': 'ascii',
    'UTF-16LE': 'utf16le',
  });
  /**
   * The base controller provides functions for the majority of
   * the heavy lifing for a controller. It accepts and provides access to
   * extending controllers for items such as the request, response, session, etc.
   * @class BaseController
   * @constructor
   */
  class BaseController {
    constructor() {
      /**
       * Provides a synchronous function means to initialize a controller.  It is
       * meant to be called from the "init" function called by the request handler.
       * @method initSync
       * @param {Object} context See "init" for more details on properties
       */
      this.initSync = (/* context */) => { };
      /**
       *
       * @method requiresClientLocalization
       * @return {Boolean}
       */
      this.requiresClientLocalization = () => true;

      /**
       *
       * @method getSanitizationRules
       * @return {Object}
       */
      this.getSanitizationRules = function getSanitizationRules() {
        return {};
      };

      /**
       * The sanitization rules that apply to Pages and Articles
       * @deprecated Since 0.4.1
       * @static
       * @method getContentSanitizationRules
       */
      this.getContentSanitizationRules = () =>
        pb.BaseObjectService.getContentSanitizationRules();

      /**
       * @deprecated Since 0.4.1
       * @static
       * @method getDefaultSanitizationRules
       */
      this.getDefaultSanitizationRules = () =>
        pb.BaseObjectService.getDefaultSanitizationRules();

      /**
       *
       * @deprecated Since 0.4.1
       * @static
       * @method sanitize
       * @param {String} value
       * @param {Object} [config]
       */
      this.sanitize = (value, config) =>
        pb.BaseObjectService.sanitize(value, config);

      /**
       * Redirects a request to a different location
       * @method redirect
       * @param {String} location
       * @param {Function} cb
       */
      this.redirect = (location, cb) => {
        cb(pb.RequestHandler.generateRedirect(location));
      };

      /**
       * Generates an generic API response object
       * @static
       * @method apiResponse
       * @return {String} JSON
       */
      this.apiResponse = (cd, msg, dta) => {
        let message = msg;
        let data = {};
        if (typeof msg === 'undefined') {
          switch (cd) {
            case BaseController.API_FAILURE:
              message = 'FAILURE';
              break;
            case BaseController.API_SUCCESS:
              message = 'SUCCESS';
              break;
            default:
              message = '';
              break;
          }
        }
        if (typeof dta === 'undefined') {
          data = null;
        } else {
          Object.assign(data, dta);
        }
        const response = { code: cd, message, data };
        return JSON.stringify(response);
      };
    }
    /**
     * Responsible for initializing a controller.  Properties from the
     * RequestHandler are passed down so that the controller has complete access to
     * a variety of request specified properties.  By default the function transfers the options over to instance variables that can be access during rendering.  In addition, the function sets up the template service along with a set of local flags:
     * <ul>
     * <li>locale - The selected locale for the request (NOTE: this may not match the requested language if not supported)</li>
     * <li>error_success - An alert box if one was registered by the controller</li>
     * <li>page_name - The title of the page</li>
     * <li>localization_script - Includes the localization script so that it can be used client side</li>
     * <li>analytics - Inserts the necessary javascript for analytics providers</li>
     * </ul>
     * @method init
     * @param {Object} props The properties needed to initialize the controller
     *  @param {RequestHandler} props.request_handler
     *  @param {Request} props.request The incoming request
     *  @param {Response} props.response The outgoing response
     *  @param {Object} props.session The session object
     *  @param {Localization} props.localization_service The localization service instance for the request
     *  @param {Object} props.path_vars The path variables associated with the URL for the request
     *  @param {Object} props.query The query string variables associated with the URL for the request
     *  @param {Function} cb A callback that takes a single optional argument: cb(Error)
     */
    init(props, cb) {
      /**
       * The instance of the request handler that processed the request
       * @property reqHandler
       * @type {RequestHandler}
       */
      this.reqHandler = props.request_handler;

      /**
       * The current request object
       * @property req
       * @type {Request}
       */
      this.req = props.request;

      /**
       * The current response object
       * @property res
       * @type {Response}
       */
      this.res = props.response;

      /**
       * The session object that represents the calling entity
       * @property session
       * @type {object}
       */
      this.session = props.session;

      /**
       * The deserialized body of the request.  This field is only ever populted if the executing route specifies the
       * "request_body" attribute and provides valid MIME types that map to a registered body parser
       * @property body
       * @type {object|null}
       */
      this.body = props.body;

      /**
       * @deprecated Use this.ls
       * @property localizationService
       * @type {Localization}
       */
      this.localizationService = props.localization_service;

      /**
       * @property ls
       * @type {Localization}
       */
      this.ls = props.localization_service;

      /**
       * The hash of key/value pairs that represent the variables passed in the route path
       * @property pathVars
       * @type {object}
       */
      this.pathVars = props.pathVars;

      /**
       * The hash of key/value pairs that represent the variables passed as query string parameters
       * @property query
       * @type {object}
       */
      this.query = props.query;

      /**
       * The title of the view to be rendered, if there is a view
       * @property pageName
       * @type {string}
       */
      this.pageName = '';
      this.siteObj = props.siteObj;
      this.site = props.site;
      this.siteName = props.siteName;
      this.hostname = SiteService.getHostWithProtocol(this.siteObj.hostname) || pb.config.siteRoot;

      /**
       * The referring URL
       * @deprecated
       * @property referer
       * @type {string}
       */
      this.referer = this.req.headers.referer;

      /**
       * @property ts
       * @type {TemplateService}
       */
      this.ts = this.getTemplateServiceInstance(props);

      /**
       * @property activeTheme
       * @type {String}
       */
      this.activeTheme = props.activeTheme;

      // build out a base service context that can be cloned and passed to any
      // service objects
      /**
       * @property context
       * @type {{req: Request, session: object, ls: Localization, ts: TemplateService, site: string, hostname: string, activeTheme: string, onlyThisSite: boolean, siteObj: object}}
       */
      this.context = {
        req: this.req,
        session: this.session,
        ls: this.ls,
        ts: this.ts,
        site: this.site,
        hostname: this.hostname,
        activeTheme: this.activeTheme,
        onlyThisSite: true,
        siteObj: this.siteObj,
      };

      // call the initSync function
      this.initSync(props);

      cb();
    }
    /**
     * Creates a TemplateService instance
     * @method getTemplateServiceInstance
     * @param {Object} props
     * @return {TemplateService}
     */
    getTemplateServiceInstance(props) {
      // create options
      const tsOpts = {
        ls: this.ls,
        activeTheme: props.activeTheme,
        site: this.site,
      };

      // create instance
      const ts = new pb.TemplateService(tsOpts);

      // configure for common flags
      const model = {
        meta_lang: this.ls.language,
        error_success: (flag, cb) => {
          this.displayErrorOrSuccessCallback(flag, cb);
        },
        page_name: (flag, cb) => {
          cb(null, this.getPageName());
        },
        localization_script: (flag, cb) => {
          this.requiresClientLocalizationCallback(flag, cb);
        },
        analytics: (flag, cb) => {
          pb.AnalyticsManager.onPageRender(this.req, this.session, this.ls, cb);
        },
        wysiwyg: (flag, cb) => {
          const wysiwygId = util.uniqueId();

          this.ts.registerLocal('wys_id', wysiwygId);
          this.ts.load('admin/elements/wysiwyg', (err, data) => {
            cb(err, new pb.TemplateValue(data, false));
          });
        },
        site_root: this.hostname,
        site_name: this.siteName,
        localized_alternate: (flag, cb) => {
          this.onLocalizedAlternateFlagFound(props.routeLocalized, cb);
        },
      };
      ts.registerModel(model);
      return ts;
    }
    /**
     * @method onLocalizedAlternateFlagFound
     * @param {Boolean} routeLocalized
     * @param {Function} cb
     */
    onLocalizedAlternateFlagFound(routeLocalized, cb) {
      if (!routeLocalized) {
        return cb(null, '');
      }

      let val = '';
      Object.keys(this.siteObj.supportedLocales).forEach((locale) => {
        let path = this.req.url;
        const isLocalizedPath = !!this.pathVars.locale && path.indexOf(this.pathVars.locale) >= 0;
        if (this.ls.language === locale && !isLocalizedPath) {
          // skip current language.  We don't need to list it as an alternate
          return;
        }
        const relationship = this.ls.language === locale ? 'canonical' : 'alternate';

        const urlOpts = {
          hostname: this.hostname,
          locale: undefined,
        };
        if (this.ls.language === locale) {
          path = path.replace(`${locale}/`, '').replace(locale, '');
        } else if (isLocalizedPath) {
          path = path.replace(this.pathVars.locale, locale);
        } else {
          urlOpts.locale = locale;
        }
        const serviceUrl = pb.UrlService.createSystemUrl(path, urlOpts);
        val += `<link rel="${relationship}" hreflang="'${locale}" href="${serviceUrl}" />\n`;
      });
      return cb(null, new pb.TemplateValue(val, false));
    }
    /**
     * Retrieves a context object that contains the necessary information for
     * service prototypes
     * @method getServiceContext
     * @return {Object}
     */
    getServiceContext() {
      return util.merge(this.context, {});
    }
    /**
     *
     * @method requiresClientLocalizationCallback
     * @param {String} flag
     * @param {Function} cb
     */
    requiresClientLocalizationCallback(flag, cb) {
      let val = '';
      if (this.requiresClientLocalization()) {
        val = pb.ClientJs.includeJS('/api/localization/script');
      }
      cb(null, new pb.TemplateValue(val, false));
    }

    /**
     *
     * @method formError
     * @param {String} message The error message to be displayed
     * @param {String} redirectLocation
     * @param {Function} cb
     */
    formError(message, redirectLocation, cb) {
      this.session.error = message;
      const uri = pb.UrlService.createSystemUrl(redirectLocation, { hostname: this.hostname });
      cb(pb.RequestHandler.generateRedirect(uri));
    }

    /**
     *
     * @method displayErrorOrSuccessCallback
     * @param {String} flag
     * @param {Function} cb
     */
    displayErrorOrSuccessCallback(flag, cb) {
      if (this.session.error) {
        const error = this.session.error;
        delete this.session.error;
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-danger', this.ls.get(error)), false));
      } else if (this.session.success) {
        const success = this.session.success;
        delete this.session.success;
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-success', this.ls.get(success)), false));
      } else {
        cb(null, '');
      }
    }

    /**
     * Provides a page title.  This is picked up by the template engine when the
     * ^page_name^ key is found in a template.
     * @method getPageName
     * @return {String} The page title
     */
    getPageName() {
      return this.pageName;
    }

    /**
     * Sets the page title
     * @method setPageName
     * @param {String} pageName The desired page title
     */
    setPageName(pageName) {
      this.pageName = pageName;
    }

    /**
     *
     * @method getPostParams
     * @param {Function} cb
     */
    getPostParams(cb) {
      this.getPostData((err, raw) => {
        // Handle error
        if (util.isError(err)) {
          pb.log.error('BaseController.getPostParams encountered an error. ERROR[%s]', err.stack);
          return cb(err, null);
        }

        // lookup encoding
        let encoding = pb.BaseBodyParser.getContentEncoding(this.req);
        encoding = ENCODING_MAPPING[encoding] ? ENCODING_MAPPING[encoding] : 'utf8';

        // convert to string
        const postParams = url.parse(`?${raw.toString(encoding)}`, true).query;

        // In Node v6 a breaking change was introduced into the "querystring" module to prevent reserved words from
        // being passed in as query string parameters and overriding prototype functions.
        // This fix allows for users to continue on with V6 until another viable option comes along
        postParams.hawOwnProperty = Object.prototype.hasOwnProperty;

        return cb(null, postParams);
      });
    }

    /**
     * Parses the incoming payload of a request as JSON formatted data.
     * @deprecated Since 0.8.0.  Will be removed in v1.0
     * @method getJSONPostParams
     * @param {Function} cb
     */
    getJSONPostParams(cb) {
      this.getPostData((err, raw) => {
        // Handle error
        if (util.isError(err)) {
          pb.log.error('BaseController.getJSONPostParams encountered an error. ERROR[%s]', err.stack);
          return cb(err, null);
        }

        // lookup encoding
        let encoding = pb.BaseBodyParser.getContentEncoding(this.req);
        encoding = ENCODING_MAPPING[encoding] ? ENCODING_MAPPING[encoding] : 'utf8';

        let error = null;
        let postParams = null;
        try {
          postParams = JSON.parse(raw.toString(encoding));
        } catch (parseError) {
          error = parseError;
        }
        return cb(error, postParams);
      });
    }

    /**
     *
     * @method getPostData
     * @param {Function} cb
     */
    getPostData(cb) {
      const buffers = [];
      let totalLength = 0;

      this.req.on('data', (data) => {
        buffers.push(data);
        totalLength += data.length;

        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (totalLength > 1e6) {
          // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
          const err = new Error('POST limit reached! Maximum of 1MB.');
          err.code = 400;
          cb(err, null);
        }
      });
      this.req.on('end', () => {
        // create one big buffer.
        const body = Buffer.concat(buffers, totalLength);
        cb(null, body);
      });
    }

    /**
     *
     * @method hasRequiredParams
     * @param {Object} queryObject
     * @param {Array} requiredParameters
     */
    hasRequiredParams(queryObject, requiredParameters) {
      for (let i = 0; i < requiredParameters.length; i += 1) {
        if (typeof queryObject[requiredParameters[i]] === 'undefined' || queryObject[requiredParameters[i]].length === 0) {
          return this.ls.g('generic.FORM_INCOMPLETE');
        }
      }

      if (queryObject.password && queryObject.confirm_password) {
        if (queryObject.password !== queryObject.confirm_password) {
          return this.ls.g('users.PASSWORD_MISMATCH');
        }
      }

      return null;
    }

    /**
     *
     * @method setFormFieldValues
     * @param {Object} post
     */
    setFormFieldValues(post) {
      this.session.fieldValues = post;
      return this.session;
    }

    /**
     *
     * @method checkForFormRefill
     * @param {String} result
     * @param {Function} cb
     */
    checkForFormRefill(result, cb) {
      if (this.session.fieldValues) {
        const content = util.format(FORM_REFILL_PATTERN, JSON.stringify(this.session.fieldValues));
        const formScript = pb.ClientJs.getJSTag(content);
        result = result.concat(formScript); // eslint-disable-line no-param-reassign

        delete this.session.fieldValues;
      }

      cb(null, result);
    }

    /**
     * Sanitizes an object.  This function is handy for incoming post objects.  It
     * iterates over each field.  If the field is a string value it will be
     * sanitized based on the default sanitization rules
     * (BaseController.getDefaultSanitizationRules) or those provided by the call
     * to BaseController.getSanitizationRules.
     * @method sanitizeObject
     * @param {Object} obj
     */
    sanitizeObject(obj) {
      if (!util.isObject(obj)) {
        pb.log.warn('BaseController.sanitizeObject was not passed an object.');
        return;
      }

      const rules = this.getSanitizationRules();
      Object.keys(obj).forEach((prop) => {
        if (util.isString(obj[prop])) {
          const config = rules[prop];
          obj[prop] = // eslint-disable-line no-param-reassign
            pb.BaseObjectService.sanitize(obj[prop], config);
        }
      });
    }
  }

  // constants
  /**
   * The code for a successful API call
   * @static
   * @property API_SUCCESS
   * @type {Integer}
   */
  BaseController.API_SUCCESS = 0;

  /**
   * The code for a failed API call
   * @static
   * @property API_FAILURE
   * @type {Integer}
   */
  BaseController.API_FAILURE = 1;

  return BaseController;
};
