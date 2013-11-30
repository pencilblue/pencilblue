(function(){
    'strict mode';
    
    global.minify = {};
    
    var DIR,
        LIBDIR,
        
        path,
        Util;
    
    /* Constants */
    exports.LIBDIR      = LIBDIR    = __dirname + '/',
    exports.DIR         = DIR       = LIBDIR + '../',

    /* Functions */
    exports.require                 = mrequire,
    exports.librequire              = librequire,
    exports.rootrequire             = rootrequire,
    
    /* Native Modules*/
    exports.crypto                  = require('crypto'),
    exports.fs                      = require('fs'),
    exports.path    = path          = require('path'),
    /* compitability with old versions of node */
    exports.fs.exists               = exports.fs.exists || exports.path.exists;
    
    exports.optimize                = optimize,
    
    /* Needed Modules */
    exports.util    = Util          = require(LIBDIR + 'util');
    exports.mainpackage             = rootrequire('package');
    
    Util.getExtension               = path.extname;
    
    global.minify.main = exports;
    
    var html        = librequire('html'),
        js          = librequire('js'),
        css         = librequire('css');
    
    function optimize(pParams){
        var lRet = Util.checkObjTrue(pParams, ['ext', 'data']),
            p       = pParams;
        
        if(lRet)
            switch(p.ext){
                case '.js': 
                    p.data = js._uglifyJS(p.data);
                    break;
                
                case '.html':
                    p.data = html.htmlMinify(p.data);
                    break;
                
                case '.css':
                    p.data = css._cleanCSS(p.data);
                    break;
            }
        
        return p.data;
    }
    
    
    /**
     * function do safe require of needed module
     * @param {Strin} pSrc
     */
    function mrequire(pSrc){
        var lModule,        
        lError = Util.tryCatch(function(){
            lModule = require(pSrc);
        });
        
        if(lError)
            Util.log(lError);
        
        return lModule;
    }
    
    function rootrequire(pSrc){ return mrequire(DIR + pSrc); }
    
    function librequire(pSrc){ return mrequire(LIBDIR + pSrc); }
    
})();
