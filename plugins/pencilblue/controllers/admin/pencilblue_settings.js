/**
 * PencilblueSettings - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function PencilblueSettings(){}

//dependencies
var Media =  require('../../../../controllers/admin/content/media');

//inheritance
util.inherits(PencilblueSettings, pb.BaseController);

PencilblueSettings.prototype.render = function(cb) {
	var self = this;
	
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
        
    	self.ts.registerLocal('image_title', self.ls.get('SITE_LOGO'));
    	self.ts.registerLocal('uploaded_image', settings.site_logo);
    	self.ts.load('admin/pencilblue_settings', function(err, data) {
    		var result = '' + data;
        
    		self.setFormFieldValues(settings);            
            var tabs = [
                {
                    active: 'active',
                    href: '#settings',
                    icon: 'cog',
                    title: self.ls.get('SETTINGS')
                },
                {
                    href: '#carousel',
                    icon: 'picture-o',
                    title: self.ls.get('CAROUSEL')
                }
            ];
                
            Media.getAll(function(media) {
            	
                self.checkForFormRefill(result, function(newResult) {
                    result = newResult;
                    result = result.concat(pb.js.getAngularController({tabs: tabs, media: media}));

                    cb({content: result});
                });
            });
        });
    });
};

//exports
module.exports = PencilblueSettings;
