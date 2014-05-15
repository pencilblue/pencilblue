function SectionService(){}

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

SectionService.getSectionData = function(uid, sections) {
    var self = this;
    for(var i = 0; i < sections.length; i++) {
        if(sections[i]._id.equals(ObjectID(uid))) {
            if (sections[i].url.indexOf('/') === 0) {
        		//do nothing.  This is a hack to get certain things into the
        		//menu until we re-factor how our navigation structure is built.
        	}
        	else if(!pb.utils.isExternalUrl(sections[i].url, self.req))
            {
        	    sections[i].url = pb.utils.urlJoin('/section', sections[i].url);
    	    }
            return sections[i];
        }
    }

    return null;
};

//exports
module.exports = SectionService;