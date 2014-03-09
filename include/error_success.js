
global.displayErrorOrSuccess = function(session, result, output) {
    if(session['error']) {
        result = result.split('^error_success^').join('<div class="alert alert-danger error_success">' + session['error'] + '<a href="javascript:$(\'.alert-danger\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete session['error'];
    }
    else if(session['success']) {
        result = result.split('^error_success^').join('<div class="alert alert-success error_success">' + session['success'] + '<a href="javascript:$(\'.alert-success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete session['success'];
    }
    else {
        result = result.split('^error_success^').join('');
    }
    
    output(session, result);
};
