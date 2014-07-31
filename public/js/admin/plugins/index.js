/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip(
        {
            'placement': 'bottom'
            //'trigger': 'click'
        }
    ).css(
        {
            'cursor': 'pointer'
        }
    );
});

function uninstallPlugin(pid) {
	doPluginAPIAction('uninstall', pid, onUninstallSuccess);
};

function onUninstallSuccess(data) {
    var jobId = data.data;

    //poll for logs
    var loghandle = null;
    var starting  = 0;
    var console   = $('#progress_console');
    var doLogRetrieve = function() {

        doJobAPIAction('getLogs', jobId, {starting: starting}, function(data) {
            if (!data || !data.data || data.data.length === undefined) {
                return;
            }

            var toAppend = '';
            var nextStarting = starting;
            for (var i = 0; i < data.data.length; i++) {

                var item = data.data[i];
                var line = '\n'+item.created+':['+item.worker_id+'] '+item.message;
                toAppend += line;

                var date = new Date(item.created).getTime();
                if (date > nextStarting) {
                    nextStarting = date;
                }
            }
            console.val(console.val()+toAppend);

            //offset so we don't get repeats
            starting = nextStarting + 1;

            //check for more log entries
            loghandle = setTimeout(doLogRetrieve, 2000);
        });
    };
    doLogRetrieve();

    //check for job completion
    var progressBar    = $('#bar');
    var retrieveHandle = null;
    var doJobRetrieve  = function() {

        doJobAPIAction('get', jobId, {}, function(data) {
            if (!data || !data.data) {
                return;
            }

            //set progress bar
            if (!isNaN(data.data.progress)) {
                progressBar.css('width', data.data.progress+'%');
            }

            //verify status
            if (data.data.status === 'RUNNING') {
                retrieveHandle = setTimeout(doJobRetrieve, 1000);
            }
            else {

                //allow any trailing logs to come in
                setTimeout(function() {
                    clearTimeout(loghandle);

                    var line = data.data.status;
                    if (data.data.error) {
                        line += ': '+data.data.error;
                    }
                    data.message = line;
                    defaultSuccessCallback(data);
                }, 1500);
            }
        });
    };
    doJobRetrieve();
}

function installPlugin(pid) {
	doPluginAPIAction('install', pid, onUninstallSuccess);
}

function resetSettings(pid) {
	doPluginAPIAction('reset_settings', pid);
}

function initialize(pid) {
	doPluginAPIAction('initialize', pid);
}

function setTheme() {
	doPluginAPIAction('set_theme', $('#active_theme').val());
}

function defaultSuccessCallback(data) {
    $('#modal_label').val('Completed');
    $('#progress_console').val($('#progress_console').val()+'\n'+data.message);
    $('#progress_bar').removeClass('active');
    $('#progress_footer').show();
}

function defaultFailureCallback(err) {
    $('#modal_label').val('Completed');
    $('#progress_bar').removeClass('active');

    var data = null;
    try {
        data = JSON.parse(err.responseText);
    }
    catch(e){
        data = {
            message: 'An error occurred while attempting to complete the action. STATUS='+err.status+'',
            data: []
        };
    }

    //process errors
    var output = data.message;
    for(var i = 0; i < data.data.length; i++) {
        output += "\n"+data.data[i];
    }
    $('#progress_console').val($('#progress_console').val()+output);
    $('#progress_footer').show();
}

function doPluginAPIAction(action, identifier, successCb, failureCb) {
    successCb = successCb || defaultSuccessCallback;
    failureCb = failureCb || failureCb;


	$('#progress_modal').modal({});
	$.post("/api/plugins/"+action+"/"+encodeURIComponent(identifier), successCb)
	.fail(failureCb);
}

function doJobAPIAction(action, identifier, data, successCb, failureCb) {
    successCb = successCb || defaultSuccessCallback;
    failureCb = failureCb || failureCb;


	$('#progress_modal').modal({});
	$.post("/api/jobs/"+action+"/"+encodeURIComponent(identifier), JSON.stringify(data), successCb, 'json')
	.fail(failureCb);
}
