global.initLocalization = function(request, session, output)
{
    var getParameters = getQueryParameters(request);
    if(getParameters['language'])
    {
        session.language = getParameters['language'];
    }
    else if(!session.language)
    {
        session.language = 'en-us';
    }
    
    fs.exists(DOCUMENT_ROOT + 'public/localization/' + session.language + '.js', function(exists)
    {
        if(!exists)
        {
            session.language = 'en-us';
        }
        
        require('./../public/localization/' + session.language);
        
        getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
        {
            if(data.length > 0)
            {
                if(fs.existsSync(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/public/loc/' + session.language + '.js'))
                {
                    require('./../plugins/themes/' + data[0]['value'] + '/public/loc/' + session.language);
                }
            }
        
            editSession(request, session, [], function(data)
            {
                output(true);
            });
        });
    });
};

global.localize = function(sets, text)
{
    for(var key in loc.generic)
    {
        text = text.split('^loc_' + key + '^').join(loc.generic[key]);
    }
    
    for(var i = 0; i < sets.length; i++)
    {
        for(var key in loc[sets[i]])
        {
            text = text.split('^loc_' + key + '^').join(loc[sets[i]][key]);
        }
    }
    
    // If the localization is for HTML output, load the localization into client side JS
    if(text.indexOf('<body') > -1)
    {
        text = text.concat(includeJS(pb.config.siteRoot + '/localization/' + localizationLanguage + '.js'));
    }
    
    return text;
};

/**
 * Localization - Provides functions to translate items based on keys.  Also 
 * assists in the determination of the best language for the given user.
 * @param locale
 */
function Localization(locale){
	this.language = locale;
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
        text = text.concat(includeJS(pb.config.siteRoot + '/localization/' + localizationLanguage + '.js'));
    }
    
    return text;
};

/**
 * Determines the best language to send a user based on the 'accept-language' 
 * header in the request
 * @param request The request object
 * @returns string Locale for the request
 */
Localization.best = function(request){
	var loc = 'en';
	if (request.headers[Localization.ACCEPT_LANG_HEADER]){
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
		Localization.storage[localeDescriptor.locale] = require(localeDescriptor.file);
		
		supportedLocales.push(localeDescriptor.locale);
	}
	
	Localization.supported = new locale.Locales(supportedLocales);
};

//exports
module.exports.Localization = Localization;