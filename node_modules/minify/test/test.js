(function(){
    'use strict';
    
    var DIR         = __dirname + '/../',
        LIBDIR      = DIR + 'lib/',
        main        = require(LIBDIR + 'main'),
        
        util        = main.util,
        fs          = main.fs,
        filename    = DIR + 'test/test.js',
        
        minify      = main.rootrequire('minify'),
        uglify      = main.require('uglify-js'),
        
        Data,
        ErrorMsg    =   'can\'t load uglify-js          \n' +
                        'npm install uglify-js          \n' +
                        'https://github.com/mishoo/UglifyJS';
    
    fs.readFile(filename, function(pError, pData) {
        if(pError)
            return util.log(pError);
            
        Data = pData.toString();
        
        minify.optimize(filename,{
            callback : jsCompare
        });
        
    });
    
    
    function jsCompare(pData){
        fs.rmdir('min', function(){
            var lUglify = _uglifyJS(Data),
                lResult = lUglify === pData;
            
           return util.log('uglify-js: ' + lResult);
        });
    }
    
    function _uglifyJS(pData){
        var lRet;
        
        if(uglify){
            var lResult = uglify.minify(pData, {fromString: true});
            lRet = lResult.code;
        }
        else{
            lRet = pData;
            util.log(ErrorMsg);
        }
        
        return lRet;
    }
})();
