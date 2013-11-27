/* сжимаем код через htmlMinify */

(function(){
    'use strict';
    
    var main        = global.minify.main,
        Util        = main.util,
        Minifier    = main.require('html-minifier'),
        
        ErrorMsg    = 'can\'t load html-minifier        \n'     +
                      'npm install html-minifier        \n'     +
                      'https://github.com/kangax/html-minifier',
        
        Options     = {
            removeComments:                 true,
            removeCommentsFromCDATA:        true,
            removeCDATASectionsFromCDATA:   true,
            collapseWhitespace:             true,
            collapseBooleanAttributes:      true,
            removeAttributeQuotes:          true,
            removeRedundantAttributes:      true,
            useShortDoctype:                true,
            removeEmptyAttributes:          true,
            /* оставляем, поскольку у нас
             * в элемент fm генерируеться
             * таблица файлов
             */
            removeEmptyElements:            false,
            removeOptionalTags:             true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
        };
    
    /** 
     * minify html data.
     * if can not minify return pData
     * 
     * @param pData
     */
    exports.htmlMinify = function(pData){
        var lRet, lData = pData;
        
        if(Minifier)
            lRet = Util.tryCatch(function(){
                lData = Minifier.minify(pData, Options);
            });
        else
            Util.log(ErrorMsg);
        
        return lData;
    };
})();
