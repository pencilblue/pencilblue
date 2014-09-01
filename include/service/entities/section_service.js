/*
	Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Service for managing the site's navigation
 */
function SectionService(){}

var VALID_TYPES = {
	container: true,
	section: true,
	article: true,
	page: true,
	link: true,
};

SectionService.getPillNavOptions = function(activePill) {
    return [
        {
            name: 'new_section',
            title: '',
            icon: 'plus',
            href: '/admin/content/sections/new_section'
        }
    ];
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

SectionService.prototype.updateNavMap = function(section, cb) {
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

SectionService.prototype.deleteChildren = function(parentId, cb) {

	var where = {
		parent: ''+parentId
	};
	var dao = new pb.DAO();
    dao.deleteMatching(where, 'section').then(function(result) {
    	if (util.isError(result)) {
    		cb(result, null);
    		return;
    	}
    	cb(null, result);
    });
};

SectionService.prototype.getFormattedSections = function(localizationService, currUrl, cb) {
    if (pb.utils.isFunction(currUrl)) {
        cb      = currUrl;
        currUrl = null;
    }
    
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
                var section    = SectionService.getSectionData(sectionMap[i].uid, sections, currUrl);

                if(sectionMap[i].children.length == 0) {
                    if(section) {
                        formattedSections.push(section);
                    }
                }
                else {
                    if(section) {
                        section.dropdown = 'dropdown';

						section.children = [];
                        for(var j = 0; j < sectionMap[i].children.length; j++) {
                            var child = SectionService.getSectionData(sectionMap[i].children[j].uid, sections, currUrl);
                            
                            //when the child is active so is the parent.
                            if (child.active) {
                                section.active = true;   
                            }
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
	if (currItem && !pb.utils.isFunction(currItem)) {
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
	if (!pb.validation.validateUrl(navItem.link, true) && navItem.link.charAt(0) !== '/') {
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

SectionService.prototype.save = function(navItem, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {};
    }
    
    //validate
    var self = this;
    self.validate(navItem, function(err, validationErrors) {
        if (util.isError(err)) {
            return cb(err);
        }
        else if (validationErrors.length > 0) {
            return cb(null, validationErrors);
        }

        //persist the changes
        var dao = new pb.DAO();
        dao.update(navItem).then(function(data) {
            if(util.isError(data)) {
                return cb(err);
            }

            //update the navigation map
            self.updateNavMap(navItem, function() {

                //ok, now we can delete the orhphans if they exist
                self.deleteChildren(navItem[pb.DAO.getIdField()], cb);
            });
        });
    });
};

SectionService.getSectionData = function(uid, navItems, currUrl) {
    var self = this;
    for(var i = 0; i < navItems.length; i++) {

    	var navItem = navItems[i];
        if(navItem[pb.DAO.getIdField()].toString() === uid) {
        	SectionService.formatUrl(navItem);
            
            //check for URL comparison
            if (currUrl === navItem.url) {
                navItem.active = true;
            }
            return navItem;
        }
    }
    return null;
};

SectionService.formatUrl = function(navItem) {
	if (pb.utils.isString(navItem.link)) {
		navItem.url = navItem.link;
	}
	else if(navItem.url)
    {
		navItem.url = pb.UrlService.urlJoin('/section', navItem.url);
    }
	else if (navItem.type === 'article') {
		navItem.url = pb.UrlService.urlJoin('/article', navItem.item);
	}
	else if (navItem.type === 'page') {
		navItem.url = pb.UrlService.urlJoin('/page', navItem.item);
	}
	else {
		navItem.url = '#';
	}
};

/**
 * @static
 * @method
 * @param {Localization} ls
 * @return {array}
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
 * @return {Boolean}
 */
SectionService.isValidType = function(type) {
	if (pb.utils.isObject(type)) {
		type = type.type;
	}

	return VALID_TYPES[type] === true;
};

//exports
module.exports = SectionService;
