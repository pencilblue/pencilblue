/**
 * Get articles within indices, for real time pagination
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function GetArticles(){}

//inheritance
util.inherits(GetArticles, pb.FormController);
                   
GetArticles.prototype.render = function(cb) {
	var self = this;
	var get = this.query;
	
	if(!get['limit'] || get['limit'].length == 0)
	{
	    get['limit'] = 1;
	}
	if(!get['offset'])
	{
	    get['offset'] = 0;
	}
	
	var limit = parseInt(get['limit']);
	var offset = parseInt(get['offset']);

    var dao = new pb.DAO();
    var order = [['publish_date', pb.DAO.DESC], ['created', pb.DAO.DESC]];
    var where = {};
	where.publish_date = {$lt: new Date()};
	if(get['draft'] != '1') {
	    where.draft = 0;
    }
    dao.query('article', where, pb.DAO.SELECT_ALL, order, limit, offset).then(function(articles) {
		if (util.isError(articles)) {
			cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'database error')});
            return;
		}
		
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', articles)});
        return;
    });
};

//exports 
module.exports = GetArticles;
