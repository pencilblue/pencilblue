/**
 * Client Side javascript used for the plugins index page.
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */


function uninstallPlugin(pid) {
	doPluginAPIAction('uninstall', pid);
};

function installPlugin(pid) {
	doPluginAPIAction('install', pid);
}

function resetSettings(pid) {
	doPluginAPIAction('reset_settings', pid);
}

function doPluginAPIAction(action, identifier) {
	$('#progress_console').val('');
	$('#progress_modal').modal({});
	$.post("/api/plugins/"+action+"/"+encodeURIComponent(identifier), 
		function(data) {
			$('#modal_label').val('Completed');
			$('#progress_console').val($('#progress_console').val()+"\n"+data.message);
			$('#progress_bar').removeClass('active');
			
			setTimeout(window.location.reload, 3000);
		}
	)
	.fail(function(err) {
		$('#modal_label').val('Completed');
		$('#progress_bar').removeClass('active');
		
		var data = null;
		try {
			data = JSON.parse(err.resonseText);
		}
		catch(e){
			data = {data: ['An error occurred while attempting to complete the action. STATUS='+err.status+'']};
		}
		
		//process errors
		for(var i = 0; i < data.data.length; i++) {
			$('#progress_console').val($('#progress_console').val()+"\n"+data.data[i]);
		}
	});
}