/**
 * Organizes the site's sections via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SectionMap(){}

//inheritance
util.inherits(SectionMap, pb.BaseController);

SectionMap.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('section', pb.DAO.ANYWHERE).then(function(sections) {
		
		//when no sections exist redirect to create page
        if(sections.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
            return;
        }

        pb.settings.get('section_map', function(err, sectionMap) {
            if(sectionMap == null) {console.log('here');
            	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
                return;
            }
            
	        pb.templates.load('admin/content/sections/section_map', '^loc_SECTION_MAP^', null, function(data) {
                var result = data;

                self.displayErrorOrSuccess(result, function(newResult) {
 
                    result    = newResult;
                    var pills = require('../sections').getPillNavOptions('section_map');
                    pills.unshift(
                    {
                        name: 'section_map',
                        title: '^loc_SECTION_MAP^',
                        icon: 'refresh',
                        href: '/admin/content/sections/section_map'
                    });
                    
                    var objects     = {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'sections']),
                        pills: pills,
                        sections: SectionMap.getOrderedSections(sections, sectionMap)
                    };
                    var angularData = pb.js.getAngularController(objects);
                    result          = result.concat(angularData);
                    
                    var content = self.localizationService.localize(['admin', 'sections'], result);
                    cb({content: content});
                });
            });
        });
    });
};

SectionMap.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section'}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/sections/new_section'});
                return;
            }
            
            var sections = data;
            
            getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
            {
                if(data.length == 0)
                {
                    output({redirect: pb.config.siteRoot + '/admin/content/sections/new_section'});
                    return;
                }
                
                var sectionMap = data[0].value;
        
                initLocalization(request, session, function(data)
                {
                    getHTMLTemplate('admin/content/sections/section_map', '^loc_SECTION_MAP^', null, function(data)
                    {
                        result = result.concat(data);
                                
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            var pills = require('../sections').getPillNavOptions('section_map');
                            pills.unshift(
                            {
                                name: 'section_map',
                                title: '^loc_SECTION_MAP^',
                                icon: 'refresh',
                                href: '/admin/content/sections/section_map'
                            });
                            
                            result = result.concat(pb.js.getAngularController(
                            {
                                navigation: getAdminNavigation(session, ['content', 'sections']),
                                pills: pills,
                                sections: SectionMap.getOrderedSections(sections, sectionMap)
                            }));
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
};

SectionMap.getOrderedSections = function(sections, sectionMap)
{
    var orderedSections = [];

    for(var i = 0; i < sectionMap.length; i++)
    {
        var parentSection = null;
        
        for(var j = 0; j < sections.length; j++)
        {
            if(sectionMap[i].uid == sections[j]._id)
            {
                parentSection = sections[j];
                parentSection.children = [];
                break;
            }
        }
        
        if(!parentSection)
        {
            continue;
        }
        
        for(var o = 0; o < sectionMap[i].children.length; o++)
        {
            for(var j = 0; j < sections.length; j++)
            {
                if(sectionMap[i].children[o].uid == sections[j]._id)
                {
                    parentSection.children.push(sections[j]);
                    break;
                }
            }
        }
        
        orderedSections.push(parentSection);
    }
    
    return orderedSections;
};

//exports
module.exports = SectionMap;
