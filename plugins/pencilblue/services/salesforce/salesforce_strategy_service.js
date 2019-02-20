const request = require('request-promise');
const Promise = require('bluebird');
let state, salesforceAPIUrl;
const isSandbox = process.env.USE_SALESFORCE_SANDBOX === 'true';
const OAUTH_TOKEN_SERVICE = '/services/oauth2/token';
const OAUTH_AUTHORIZE_SERVICE = '/services/oauth2/authorize';
if (isSandbox) {
    salesforceAPIUrl = process.env.SALESFORCE_SANDBOX_API_URL;
    state = 'webServerSandbox';
} else {
    salesforceAPIUrl = process.env.salesforceAPIUrl;
    state = 'webServerProd';
}

let salesforceOAUTHTokenService = salesforceAPIUrl + OAUTH_TOKEN_SERVICE,
    salesforceOAUTHAuthorizeService = salesforceAPIUrl + OAUTH_AUTHORIZE_SERVICE;

module.exports = function(pb) {

    class SalesforceStrategyService {
        constructor() {
            this.siteQueryService = new pb.SiteQueryService();
        }

        static getName() {
            return 'SalesforceStrategyService';
        }

        async getSalesforceLoginSettings(req) {
            try {
                const settings = await this.getSalesforceSettings(req);
                const options = {
                    url: `${salesforceOAUTHAuthorizeService}?client_id=${settings.salesforce_client_id}&redirect_uri=https://${req.headers.host}/login/salesforce/callback&response_type=code&state=${state}`,
                    method: 'POST'
                };
                return options;
            } catch (e) {
                pb.log.error('Something went wrong during salesforce SSO strategy: ', e);
                return null;
            }
        }

        async getSalesforceSettings(req) {
            let pluginService = new pb.PluginService({
                site: req.site
            });
            pluginService = Promise.promisifyAll(pluginService);
            const settings = await pluginService.getSettingsKVAsync('tn_auth');
            if (settings.app_url && settings.app_url !== '') {
                salesforceOAUTHTokenService = settings.app_url + OAUTH_TOKEN_SERVICE;
                salesforceOAUTHAuthorizeService = settings.app_url + OAUTH_AUTHORIZE_SERVICE;
                salesforceAPIUrl = settings.app_url;
            }
            return settings;
        }
    };

    return SalesforceStrategyService;
};