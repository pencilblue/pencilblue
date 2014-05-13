function ThemesPostController() {}

//dependencies
var FormController = pb.FormController;

//inheritance
util.inherits(ThemesPostController, FormController);


ThemesPostController.prototype.onPostParamsRetrieved = function(post, cb) {
	console.log(util.inspect(post));
	this.redirect(this.url.href, cb);
};

//exports
module.exports = ThemesPostController;
