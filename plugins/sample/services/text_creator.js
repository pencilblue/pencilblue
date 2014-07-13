/**
 * TextCreaterService - An example of a service that generates random text.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */
function TextCreaterService() {}

//constants
var POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * This function is called when the service is being setup by the system.  It is 
 * responsible for any setup that is needed when first created.  The services 
 * are all instantiated at once and are not added to the platform untill all 
 * initialization is complete.  Relying on other plugin services in the 
 * initialization could result in failure.
 * 
 * @param cb A callback that should provide one argument: cb(error) or cb(null) 
 * if initialization proceeded successfully.
 */
TextCreaterService.init = function(cb) {
	pb.log.debug("TextCreaterService: Initialized");
	cb(null, true);
};

/**
 * Generates a random string of 5 characters.  The service functions can return 
 * values or use call backs.  There is no standard for how a service should 
 * provide functionality.  The only requirement is that an instance be provided 
 * as the exported object with the understanding that services should be 
 * stateless.  
 */
TextCreaterService.getText = function(cb) {
	
	var text = "";
    for (var i = 0; i < 5; i++) {
        text += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
    }
    cb(null, text);
};

//exports
module.exports = TextCreaterService;