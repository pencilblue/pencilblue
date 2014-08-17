function loadLibrariesDefaults(defaults) {
    for(var key in defaults) {
        $('#' + key).attr('value', defaults[key]);
    }
}
