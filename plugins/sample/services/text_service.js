
module.exports = function TextServiceModule(pb) {
    
    /**
     * TextService - An example of a service that generates random text.
     * 
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2015 PencilBlue, LLC.  All Rights Reserved
     * @class TextService
     * @constructor
     */
    function TextService() {}

    //constants
    /**
     * A listing of the possible characters that can be a part of the random string 
     * generation
     * @static
     * @readonly
     * @property POSSIBLE
     * @type {String}
     */
    var POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    /**
     * This function is called when the service is being setup by the system.  It is 
     * responsible for any setup that is needed when first created.  The services 
     * are all instantiated at once and are not added to the platform untill all 
     * initialization is complete.  Relying on other plugin services in the 
     * initialization could result in failure.
     * 
     * @static
     * @method init
     * @param cb A callback that should provide one argument: cb(error) or cb(null) 
     * if initialization proceeded successfully.
     */
    TextService.init = function(cb) {
        pb.log.debug("TextService: Initialized");
        cb(null, true);
    };

    /**
     * A service interface function designed to allow developers to name the handle 
     * to the service object what ever they desire. The function must return a 
     * valid string and must not conflict with the names of other services for the 
     * plugin that the service is associated with.
     *
     * @static
     * @method getName
     * @return {String} The service name
     */
    TextService.getName = function() {
        return "textService";
    };

    /**
     * Generates a random string of 5 characters.  The service functions can return 
     * values or use call backs.  There is no standard for how a service should 
     * provide functionality.  The only requirement is that an instance be provided 
     * as the exported object with the understanding that services should be 
     * stateless.  
     * 
     * @method getText
     * @return {String}
     */
    TextService.prototype.getText = function() {

        var text = "";
        for (var i = 0; i < 5; i++) {
            text += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
        }
        return text;
    };

    //exports
    return TextService;
};
