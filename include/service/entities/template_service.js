function TemplateService(localizationService){
	this.localCallbacks      = {};
	
	this.localizationService;
	if (localizationService) {
		this.localizationService = localizationService;
	}
	else {
		//TODO make default locale configurable
		this.localizationService = new pb.Localization('en-us');
	}
};

var GLOBAL_CALLBACKS = {
	site_root: pb.config.siteRoot
};


TemplateService.prototype.process = function(content, cb) {
	var self      = this;
	var rf        = false;
	var flag      = '';
	
	var getIteratorFunc = function(index) {
		return function(next) {
			
			var curr = content.charAt(index);
			switch (curr) {
			
			case '^':
				if (rf) {
					self.processFlag(flag, function(err, subContent) {						
						if (pb.log.isDebug()) {
							pb.log.debug("TemplateService: Processed flag ["+flag+"]. Content="+(subContent ? subContent.substring(0, 20)+'...': subContent));
						}
						rf   = false;
						flag = '';
						next(null, subContent);
					});
				}
				else {
					rf = true;
					next(null, '');
				}
				break;
			default:
				if (rf) {
					flag += curr;
					next(null, '');
				}
				else {
					next(null, curr);
				}
			}
		};
	};
	var tasks = [];
	for (var i = 0; i < content.length; i++) {
		tasks.push(getIteratorFunc(i));
	};
	async.series(tasks, function(err, contentArray) {
		cb(err, contentArray.join(''));
	});
};

TemplateService.prototype.processFlag = function(flag, cb) {
	var self = this;
	
	//check local
	var tmp;
	if (tmp = this.localCallbacks[flag]) {//local callbacks
		self.handleReplacement(flag, tmp, cb);
		return;
	}
	else if (tmp = GLOBAL_CALLBACKS[flag]) {//global callbacks
		self.handleReplacement(flag, tmp, cb);
		return;
	}
	else if (flag.indexOf('loc_') == 0) {//localization
		cb(null, this.localizationService.get(flag.substring('loc_'.length)));
	}
	else if (flag.indexOf('tmp_') == 0) {//sub-templates
		//TODO implement sub templates
		cb(null, flag);
	}
	else {
		//log result
		if (pb.log.isDebug()) {
			pb.log.debug("TemplateService: Failed to process flag ["+flag+"]");
		}
		cb(null, flag);
	}
};

TemplateService.prototype.handleReplacement = function(flag, replacement, cb) {
	if (typeof replacement === 'function') {
		replacement(flag, cb);
	}
	else {
		cb(null, replacement);
	}
};

TemplateService.prototype.registerLocalCallback = function(key, callbackFunction) {
	this.localCallbacks[key] = callbackFunction;
	return true;
};

TemplateService.registerGlobalCallback = function(key, callbackFunction) {
	GLOBAL_CALLBACKS[key] = callbackFunction;
	return true;
};

//exports
module.exports = TemplateService;
