module.exports = function Localization() {
    function Localization() {
    }

    Localization.prototype.get = function (aMessage) {
        return aMessage;
    };
    Localization.prototype.g = function (key) {
        return key;
    };

    Localization.best = function (req) {
        return 'USA-OF-COURSE';
    };

    Localization.getDefaultLocale = function () {
        return 'en-US';
    };

    return Localization;
};
