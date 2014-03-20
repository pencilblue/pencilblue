function HelloWorld(){}

//dependencies
var samplePlugin = pb.plugins.sample;
var textCreater  = samplePlugin.text_creater;

//inheritance
util.inherits(HelloWorld, pb.BaseController);

HelloWorld.prototype.render = function(cb) {
	var content = {
		content_type: "text/html",
		code: 200
	};
	pb.templates.load(path.join('sample', 'index'), "Hello World", null, function(template) {
		
		textCreater.getText(function(err, text){
			
			template = template.split('^sample_text^').join(text);
			content.content = template;
			cb(content);
		});
	});
	cb(content);
};

HelloWorld.getRoutes = function(cb) {
	var routes = [
		{
	    	method: 'get',
	    	path: "/sample",
	    	auth_required: false,
	    	permissions: ["sample_view"],
	    	content_type: 'text/html'
		}
	];
	cb(null, routes);
};

//exports
module.exports = HelloWorld;