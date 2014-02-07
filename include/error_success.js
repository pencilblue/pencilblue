global.formError = function(request, session, message, redirectLocation, output) {
    
	session.error = message;
    editSession(request, session, [], function(data) {        
        output({redirect: pb.config.siteRoot + redirectLocation});
    });
};

global.displayErrorOrSuccess = function(session, result, output) {
    if(session['error']) {
        result = result.split('^error_success^').join('<div class="alert alert-danger">' + session['error'] + '<a href="javascript:$(\'.alert-danger\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete session['error'];
    }
    else if(session['success']) {
        result = result.split('^error_success^').join('<div class="alert alert-success">' + session['success'] + '<a href="javascript:$(\'.alert-success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete session['success'];
    }
    else {
        result = result.split('^error_success^').join('');
    }
    
    output(session, result);
};
