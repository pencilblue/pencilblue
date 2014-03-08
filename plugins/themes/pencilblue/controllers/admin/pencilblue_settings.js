/**
 * PencilblueSettings - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function PencilblueSettings(){}

//dependencies
var Media =  require('../../../../../controllers/admin/content/media');

//inheritance
util.inherits(PencilblueSettings, pb.BaseController);

PencilblueSettings.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/pencilblue_settings', null, null, function(data) {
        var result = '' + data;
        
        var dao = new pb.DAO();
        dao.query('pencilblue_theme_settings').then(function(data) {
            
        	var settings;
            if(util.isError(data) || data.length == 0) {
                settings = {
                    site_logo: pb.config.siteRoot + '/img/logo_menu.png',
                    carousel_media: []
                };
            }
            else {
                settings = data[0];
                settings.carousel = settings.carousel_media.join(',');
            }
            
            self.setFormFieldValues(settings);
            result = result.split('^image_title^').join('^loc_SITE_LOGO^');
            result = result.split('^uploaded_image^').join(settings.site_logo);
            
            var tabs = [
                {
                    active: 'active',
                    href: '#settings',
                    icon: 'cog',
                    title: '^loc_SETTINGS^'
                },
                {
                    href: '#carousel',
                    icon: 'picture-o',
                    title: '^loc_CAROUSEL^'
                }
            ];
                
            Media.getAll(function(media) {
            	
                self.prepareFormReturns(result, function(newResult) {
                    result = newResult;
                    result = result.concat(pb.js.getAngularController({tabs: tabs, media: media}));
            
                    var content = self.localizationService.localize(['admin', 'themes', 'media', 'pencilblue_settings'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = PencilblueSettings;
