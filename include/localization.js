/**
 * Localization - Provides functions to translate items based on keys.  Also 
 * assists in the determination of the best language for the given user.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function Localization(request){
	this.language = Localization.best(request).toString().toLowerCase();
}

Localization.SEP                = '^';
Localization.PREFIX             = Localization.SEP + 'loc_';
Localization.ACCEPT_LANG_HEADER = 'accept-language';

Localization.storage   = {};
Localization.supported = null;

/**
 * Localizes a string by searching for keys within the template and replacing 
 * them with the specified values.
 * @param sets
 * @param text
 * @returns The text where keys have been replaced with translated values
 */
Localization.prototype.localize = function(sets, text){
	if (pb.log.isSilly()) {
		pb.log.silly('Localization: Localizing text - Locale ['+this.language+'] Sets '+JSON.stringify(sets));
	}
	
	//get i18n from storage
	var loc = Localization.storage[this.language];
    for (var key in loc.generic) {
        text = text.split('^loc_' + key + '^').join(loc.generic[key]);
    }
    
    for (var i = 0; i < sets.length; i++) {
        for(var key in loc[sets[i]])  {
            text = text.split('^loc_' + key + '^').join(loc[sets[i]][key]);
        }
    }
    
    // If the localization is for HTML output, load the localization into client side JS
    if (text.indexOf('<body') > -1)  {
        text = text.concat(pb.js.includeJS(pb.config.siteRoot + '/localization/' + localizationLanguage + '.js'));
    }
    
    return text;
};

/**
 * Translates a single key.  The key should not be enclosed by the special '^' 
 * character.
 * 
 * @param key
 * @param defaultVal
 * @returns
 */
Localization.prototype.get = function(key, defaultVal) {
	if (pb.log.isSilly()) {
		pb.log.silly('Localization: Localizing key ['+key+'] - Locale ['+this.language+']');
	}
	
	//get i18n from storage
	var tmp;
	var val = null;
	var loc = Localization.storage[this.language];
	for (var category in loc) {
		tmp = loc[category][key];
		if (tmp !== undefined) {
			val = tmp;
			break;
		}
	}
	
	if (val === null) {
		val = defaultVal ? defaultVal : key;
	}
	return val;
};

/**
 * Determines the best language to send a user based on the 'accept-language' 
 * header in the request
 * @param request The request object
 * @returns string Locale for the request
 */
Localization.best = function(request){
	var loc = 'en-us';
	if (typeof request == 'string') {
		var locales = new locale.Locales(request);
		loc = locales.best(Localization.supported);
	}
	else if (request.headers[Localization.ACCEPT_LANG_HEADER]){
		var locales = new locale.Locales(request.headers[Localization.ACCEPT_LANG_HEADER]);
		loc = locales.best(Localization.supported);
	}
	return loc;
};

/**
 * Initializes the location.  Loads all language packs into memory for fast 
 * retrieval and sets the supported locales for determining what language to 
 * send the user based on their list of acceptable languages.
 */
Localization.init = function() {
	var supportedLocales = [];
	Localization.storage = {};
	for (var i = 0; i < pb.config.locales.supported.length; i++) {
		
		var localeDescriptor = pb.config.locales.supported[i];
		Localization.storage[localeDescriptor.locale.toLowerCase()] = require(localeDescriptor.file);
		
		supportedLocales.push(localeDescriptor.locale);
	}
	
	pb.log.debug("Localization: Supporting - " + JSON.stringify(supportedLocales));
	Localization.supported = new locale.Locales(supportedLocales);
};

//exports
module.exports.Localization = Localization;
