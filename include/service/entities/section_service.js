function SectionService(){}

//constants
var VALID_TYPES = {
	container: true,
	section: true,
	article: true,
	page: true,
	link: true,
};

SectionService.getPillNavOptions = function(activePill) {
    var pillNavOptions = [
        {
            name: 'new_section',
            title: '',
            icon: 'plus',
            href: '/admin/content/sections/new_section'
        }
    ];
    
    if (typeof activePill !== 'undefined') {
        for (var i = 0; i < pillNavOptions.length; i++) {
            
        	if (pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    return pillNavOptions;
};

SectionService.prototype.removeFromSectionMap = function(section, sectionMap, cb) {
	if (!cb) {
		cb         = sectionMap;
		sectionMap = null;
	}
	
	//ensure we have an ID
	if (pb.utils.isObject(section)) {
		section = section._id.toString();
	}
	
	//provide a function to abstract retrieval of map
	var sectionMapWasNull = sectionMap ? false : true;
	var getSectionMap = function (sectionMap, callback) {
		if (util.isArray(sectionMap)) {
			callback(null, sectionMap);
		}
		else {
			pb.settings.get('section_map', callback);
		}
	};
	
	//retrieve map
	var self = this;
	getSectionMap(sectionMap, function(err, sectionMap) {
		if (util.isError(err)) {
			cb(err, false);
			return;
		}
		else if (sectionMap == null) {
			cb(new Error("The section map is null and therefore cannot have any sections removed", false));
			return;
		}
		
		//update map
		var orphans = self._removeFromSectionMap(section, sectionMap);
			
		//when the section map was not provided persist it back
		if (sectionMapWasNull) {
			pb.settings.set('section_map', sectionMap, function(err, result) {
				cb(err, orphans);
			});
		}
		else {
			cb(null, orphans);
		}
	});
};

SectionService.prototype._removeFromSectionMap = function(sid, sectionMap) {
	
	//inspect the top level
	var orphans = [];
	for (var i = sectionMap.length - 1; i >= 0; i--) {
		
		var item = sectionMap[i];
		if (item.uid === sid) {
			sectionMap.splice(i, 1);
			pb.utils.arrayPushAll(item.children, orphans);
		}
		else if (util.isArray(item.children)) {
			
			for (var j = item.children.length - 1; j >= 0; j--) {
				
				var child = item.children[j];
				if (child.uid === sid) {
					item.children.splice(j, 1);
				}
			}
		}
	}
	return orphans;
};

SectionService.prototype.updateSectionMap = function(section, cb) {
	var self = this;
	
	//do validation
	if (!pb.utils.isObject(section) || !section._id) {
		cb(new Error("A valid section object must be provided", false));
		return;
	}
		   
	//retrieve the section map
    var sid = section._id.toString();
    pb.settings.get('section_map', function(err, sectionMap) {
    	if (util.isError(err)) {
    		cb(err, false);
    		return;
    	}
    	
    	//create it if not already done
    	var mapWasNull = sectionMap == null;
        if(mapWasNull) {
        	sectionMap = [];
        }
        
        //remove the section from the map
        self._removeFromSectionMap(sid, sectionMap);
        
        //make a top level item if there is no parent or the map was originally 
        //empty (means its impossible for there to be a parent)
        if (mapWasNull || !section.parent) {
            sectionMap.push({uid: sid, children: []});
        }
        else {//set as child of parent in map
            
        	for (var i = 0; i < sectionMap.length; i++) {
                if (sectionMap[i].uid == section.parent) {
                    sectionMap[i].children.push({uid: sid});
                    break;
                }
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

SectionService.prototype.getFormattedSections = function(localizationService, cb) {
	pb.settings.get('section_map', function(err, sectionMap) {
        if (util.isError(err) || sectionMap == null) {
        	cb(err, []);
        	return;
        }

        //retrieve sections
        var dao = new pb.DAO();
        dao.query('section').then(function(sections) {
            //TODO handle error
        	
        	var formattedSections = [];
            for(var i = 0; i < sectionMap.length; i++) {
                var section = SectionService.getSectionData(sectionMap[i].uid, sections);

                if(sectionMap[i].children.length == 0) {
                    if(section) {
                        //TODO: figure out how to tell if were in one of these sections
                        formattedSections.push(section);
                    }
                }
                else {
                    if(section) {
                        section.dropdown = 'dropdown';

                        var sectionHome = pb.utils.clone(section);
                        if(typeof loc !== 'undefined') {
                            sectionHome.name = sectionHome.name + ' ' + localizationService.get('HOME');
                        }
                        
                        delete sectionHome.children;
                        section.children = [sectionHome];

                        for(var j = 0; j < sectionMap[i].children.length; j++) {
                            var child = SectionService.getSectionData(sectionMap[i].children[j].uid, sections);
                            section.children.push(child);
                        }

                        formattedSections.push(section);
                    }
                }
            }
            cb(null, formattedSections);
        });
	});
};

SectionService.prototype.getParentSelectList = function(currItem, cb) {
	cb = cb || currItem;
	
	var where = {
		type: 'container',
	};
	if (!pb.utils.isFunction(currItem)) {
		where._id = pb.DAO.getNotIDField(currItem);
	}
	
	var select = {
		_id: 1,
		name: 1
	};
	var order = [
        ['name', pb.DAO.ASC]
    ];
	var dao = new pb.DAO();
	dao.query('section', where, select, order).then(function(navItems) {
		if (util.isError(navItems)) {
			cb(navItems, null);
			return;
		}
		cb(null, navItems);
	});
};

SectionService.trimForType = function(navItem) {
	if (navItem.type === 'container') {
		navItem.parent = null;
		navItem.url    = null;
		navItem.editor = null;
		navItem.item   = null;
		navItem.link   = null;
	}
	else if (navItem.type === 'section') {
		navItem.item = null;
		navItem.link = null;
	}
	else if (navItem.type === 'article' || navItem.type === 'page') {
		navItem.link   = null;
		navItem.url    = null;
		navItem.editor = null;
	}
	else if (navItem.type === 'link') {
		navItem.editor = null;
		navItem.url    = null;
		navItem.item   = null;
	}
};

SectionService.prototype.validate = function(navItem, cb) {
	var self   = this;
	var errors = [];
	if (!pb.utils.isObject(navItem)) {
		errors.push({field: '', message: 'A valid navigation item must be provided'});
		cb(null, errors);
		return;
	}
	
	//verify type
	if (!SectionService.isValidType(navItem.type)) {
		errors.push({field: 'type', message: 'An invalid type ['+navItem.type+'] was provided'});
		cb(null, errors);
		return;
	}
	
	//name
	this.validateNavItemName(navItem, function(err, validationError) {
		if (util.isError(err)) {
			cb(err, errors);
			return;
		}
		
		if (validationError) {
			errors.push(validationError);
		}
		
		//description
		if (!pb.validation.validateNonEmptyStr(navItem.name, true)) {
			errors.push({field: 'name', message: 'An invalid name ['+navItem.name+'] was provided'});
		}
		
		//compile all errors and call back
		var onDone = function(err, validationErrors) {
			pb.utils.arrayPushAll(validationErrors, errors);
			cb(err, errors);
		};
		
		//validate for each type of nav item
		switch(navItem.type) {
		case 'container': 
			onDone(null, errors);
			break;
		case 'section':
			self.validateSectionNavItem(navItem, onDone);
			break;
		case 'article':
		case 'page':
			self.validateContentNavItem(navItem, onDone);
			break;
		case 'link':
			self.validateLinkNavItem(navItem, onDone);
			break;
		default:
			throw new Error("An invalid nav item type made it through!");
		}
	});
};

SectionService.prototype.validateLinkNavItem = function(navItem, cb) {
	var errors = [];
	if (!pb.validation.validateUrl(navItem.link, true)) {
		errors.push({field: 'link', message: 'A valid link is required'});
	}
	process.nextTick(function() {
		cb(null, errors);
	});
};

SectionService.prototype.validateNavItemName = function(navItem, cb) {
	if (!pb.validation.validateNonEmptyStr(navItem.name, true) || navItem.name === 'admin') {
		cb(null, {field: 'name', message: 'An invalid name ['+navItem.name+'] was provided'});
		return;
	}
	
	var where = {
		name: navItem.name	
	};
	var dao = new pb.DAO();
	dao.unique('section', where, navItem._id, function(err, unique) {
		var error = null;
		if (!unique) {
			error = {field: 'name', message: 'The provided name is not unique'};
		}
		cb(err, error);
	});
};

SectionService.prototype.validateContentNavItem = function(navItem, cb) {
	var self   = this;
	var errors = [];
	var tasks  = [
	    
	    //parent
	    function(callback) {
	    	self.validateNavItemParent(navItem.parent, function(err, validationError) {
	    		if (validationError) {
	    			errors.push(validationError);
	    		}
	    		callback(err, null);
	    	});
	    },
	    
	    //content
	    function(callback) {
		    self.validateNavItemContent(navItem.type, navItem.item, function(err, validationError) {
				if (validationError) {
					errors.push(validationError);
				}
				callback(err, null);
			});
	    }
    ];
	async.series(tasks, function(err, results) {
		cb(err, errors);
	});
};

SectionService.prototype.validateSectionNavItem = function(navItem, cb) {
	var self   = this;
	var errors = [];
	var tasks  = [
        
        //url
	    function(callback) {
	    	
	    	var urlService = new pb.UrlService();
	    	urlService.existsForType({type: 'section', id: navItem._id, url: navItem.url}, function(err, exists) {
	    		if (exists) {
	    			errors.push({field: 'url', message: 'The url key ['+navItem.url+'] already exists'});
	    		}
	    		callback(err, null);
	    	});
	    },
	    
	    //parent
	    function(callback) {
	    	self.validateNavItemParent(navItem.parent, function(err, validationError) {
	    		if (validationError) {
	    			errors.push(validationError);
	    		}
	    		callback(err, null);
	    	});
	    },
	    
	    //editor
	    function(callback) {
		    self.validateNavItemEditor(navItem.editor, function(err, validationError) {
				if (validationError) {
					errors.push(validationError);
				}
				callback(err, null);
			});
	    }
    ];
	async.series(tasks, function(err, results) {
		cb(err, errors);
	});
};

SectionService.prototype.validateNavItemParent = function(parent, cb) {
	
	var error = null;
	if (!pb.validation.validateNonEmptyStr(parent, false)) {
		error = {field: 'parent', message: 'The parent must be a valid nav item container ID'};
		cb(null, error);
		return;
	}
	else if (parent) {
		
		//ensure parent exists
		var where = pb.DAO.getIDWhere(parent);
		where.type = 'container';
		var dao = new pb.DAO();
		dao.count('section', where, function(err, count) {
			if (count !== 1) {
				error = {field: 'parent', message: 'The parent is not valid'};
			}
			cb(err, error);
		});
	}
	else {
		cb(null, null);
	}
};

SectionService.prototype.validateNavItemContent = function(type, content, cb) {
	
	var error = null;
	if (!pb.validation.validateNonEmptyStr(content, true)) {
		error = {field: 'item', message: 'The content must be a valid ID'};
		cb(null, error);
		return;
	}
		
	//ensure content exists
	var where = pb.DAO.getIDWhere(content);
	var dao   = new pb.DAO();
	dao.count(type, where, function(err, count) {
		if (count !== 1) {
			error = {field: 'item', message: 'The content is not valid'};
		}
		cb(err, error);
	});
};

SectionService.prototype.validateNavItemEditor = function(editor, cb) {
	
	var error = null;
	if (!pb.validation.validateNonEmptyStr(editor, true)) {
		error = {field: 'editor', message: 'The editor must be a valid user ID'};
		cb(null, error);
		return;
	}

	var service = new pb.UserService();
	service.hasAccessLevel(editor, ACCESS_EDITOR, function(err, hasAccess) {
		if (!hasAccess) {
			error = {field: 'editor', message: 'The editor is not valid'};
		}
		cb(err, error);
	});
};

SectionService.getSectionData = function(uid, navItems) {
    var self = this;
    for(var i = 0; i < navItems.length; i++) {
    	
    	var navItem = navItems[i];
        if(navItem._id.equals(ObjectID(uid))) {
        	if (pb.utils.isString(navItem.link)) {
        		navItem.url = navItem.link;
        	}
        	else if(navItem.url && !pb.UrlService.isExternalUrl(navItem.url, self.req))
            {
        		navItem.url = pb.UrlService.urlJoin('/section', navItem.url);
    	    }
        	else {
        		navItem.url = '#';
        	}
            return navItem;
        }
    }

    return null;
};

/**
 * @static
 * @method
 * @param {Localization} ls
 * @returns {array}
 */
SectionService.getTypes = function(ls) {
	if (!ls) {
		ls = new pb.Localization();
	}
	
	return [
	    {
	    	value: "container",
	    	label: ls.get('CONTAINER')
	    },
	    {
	    	value: "section",
	    	label: ls.get('SECTION')
	    },
	    {
	    	value: "article",
	    	label: ls.get('ARTICLE')
	    },
	    {
	    	value: "page",
	    	label: ls.get('PAGE')
	    },
	    {
	    	value: "link",
	    	label: ls.get('LINK')
	    },
    ];
};

/**
 * @static
 * @method isValidType
 * @param {String}|{Object} type
 * @returns {Boolean}
 */
SectionService.isValidType = function(type) {
	if (pb.utils.isObject(type)) {
		type = type.type;
	}
	
	return VALID_TYPES[type] === true;
};

//exports
module.exports = SectionService;