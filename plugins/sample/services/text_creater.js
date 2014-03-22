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
 * Generates a random string of 5 characters.  The service functions can return 
 * values or use call backs.  There is no standard for how a service should 
 * provide functionality.  The only requirement is that an instance be provided 
 * as the exported object with the understanding that services should be 
 * stateless.  
 */
TextCreator.getText = function(cb) {
	
	var text = "";
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * POSSIBLE.length));
    }
    cb(null, text);
};

//exports
module.exports = TextCreaterService;