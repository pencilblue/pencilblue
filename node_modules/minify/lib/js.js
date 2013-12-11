/* сжимаем код через uglify-js */

(function(){
    'use strict';
    
    var main        = global.minify.main,
        Util        = main.util,
        uglify      = main.require('uglify-js'),
        
        ErrorMsg    =   'can\'t load uglify-js          \n' +
                        'npm install uglify-js          \n' +
                        'https://github.com/mishoo/UglifyJS2';
    
    /** 
     * minify js data.
     * if can not minify return pData
     * 
     * @param pData
     */
    exports._uglifyJS = function (pData){
        var lRet;
        if(uglify){
            var lResult = uglify.minify(pData, {fromString: true});
            lRet = lResult.code;
        }
        else{
            lRet = pData;
            Util.log(ErrorMsg);
        }
        
        return lRet;
    };

})();