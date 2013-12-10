/* сжимаем код через clean-css */
(function(){
    'use strict';
    
    var main        = global.minify.main,
        Util        = main.util,
        Clean       = main.require('clean-css'),
        
        ErrorMsg    = 'can\'t load clean-css \n'                +
                      'npm install clean-css\n'                 +
                      'https://github.com/GoalSmashers/clean-css';
    
    /**
     * minify css data.
     * if can not minify return pData
     * 
     * @param pData
     */
    exports._cleanCSS = function(pData){
        if(!Clean)
            Util.log(ErrorMsg);
        else
            pData =  new Clean().minify(pData);
        
        return pData;
    };
})();
