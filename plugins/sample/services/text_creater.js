function TextCreaterService() {}

//constants
var POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * 
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