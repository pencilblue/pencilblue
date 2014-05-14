function MediaService(){}

MediaService.prototype.isValidFilePath = function(mediaPath, cb) {
	var absolutePath = path.join(DOCUMENT_ROOT, 'public', mediaPath);
	fs.exists(absolutePath, function(exists) {
		cb(null, exists);
	});
};

//exports
module.exports = MediaService;
