const replaceAndRedirect = (ctx, pattern, replacement) => {
    let newPath = ctx.url.replace(pattern, replacement);
    ctx.status = 301;
    return ctx.redirect(newPath);
};

const splitLocale = (locale) => {
    let [language = '', countryCode = ''] = locale.split('-');
    language = language.toLowerCase();
    countryCode = countryCode.toUpperCase();
    return { language, countryCode };
};

const normalizeLocale = (locale) => {
    const { language, countryCode } = splitLocale(locale);
    return `${language}-${countryCode}`;
};

module.exports = pb => ({
    localizedRouteCheck: async (ctx, next) => {
        const locale = ctx.params.locale;
        let siteObj = ctx.req.siteObj;
        if (!locale) { // If we dont have a locale in the route, don't worry about it
            return await next();
        }
        const isLocale = /^[a-z]{2}-([A-Z]{2,3}|(419))$/i; // Regex to match a locale en-US for sv-SE etc
        if (!isLocale.test(locale)) {
            throw pb.Errors.notFound();
        }

        if (siteObj.supportedLocales[locale]) {
            return await next();
        }

        const correctedLocale = normalizeLocale(locale);

        if (siteObj.supportedLocales[correctedLocale]) {
            return replaceAndRedirect(ctx, locale, correctedLocale);
        }

        return replaceAndRedirect(ctx, locale, siteObj.defaultLocale);
    },
    initializeLocalization: async (ctx, next) => {
        let opts = {};
        let routeLocale = ctx.params.locale || '';
        let localeSources = [routeLocale, ctx.session.locale];

        localeSources = localeSources.concat(ctx.acceptsLanguages());

        if (ctx.req.siteObj) {
            opts.supported = Object.keys(ctx.req.siteObj.supportedLocales);
            opts.site = ctx.req.site;
            localeSources.push(ctx.req.siteObj.defaultLocale);
        }
        let localePrefStr = localeSources.reduce(function (prev, curr, i) {
            return prev + (curr ? (!!i && !!prev ? ',' : '') + curr : '');
        }, '');

        opts.activeTheme = ctx.req.activeTheme;
        ctx.req.localizationService = new pb.Localization(localePrefStr, opts);

        await next();
    }
});
