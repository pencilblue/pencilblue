const _ = require('lodash')
const ErrorUtils = require('../../error/error_utils');

const replaceAndRedirect = (req, pattern, replacement) => {
    let newPath = req.url.replace(pattern, replacement);
    return req.handler.doRedirect(newPath);
};

module.exports = pb => ({
    localizedRouteCheck: (req, res) => {
        const locale = _.get(req, 'pathVars.locale');
        if (!locale) {
            return;
        }
        const isLocale = /^[a-z]{2}-([A-Z]{2,3}|(419))$/i; // Regex to match a locale en-US for sv-SE etc
        if (!isLocale.test(locale)) {
            throw ErrorUtils.notFound();
        }

        if (req.siteObj.supportedLocales[locale]) {
            return;
        }

        const correctedLocale = pb.Localization.normalizeLocale(locale);

        if (req.siteObj.supportedLocales[correctedLocale]) {
            return replaceAndRedirect(req, locale, correctedLocale);
        }

        return replaceAndRedirect(req, locale, req.siteObj.defaultLocale);

    },
    initializeLocalization: (req, res) => {
        const locale = _.get(req, 'pathVars.locale')
        req.handler.localizationService = req.localizationService = req.handler.deriveLocalization({
            session: req.session,
            routeLocalization: locale
        });
    }
})
