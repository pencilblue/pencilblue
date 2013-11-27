Minify v0.2.3 [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]
===============
[NPMIMGURL]:                https://badge.fury.io/js/minify.png
[BuildStatusIMGURL]:        https://secure.travis-ci.org/coderaiser/minify.png?branch=master
[DependencyStatusIMGURL]:   https://gemnasium.com/coderaiser/minify.png
[FlattrIMGURL]:             http://api.flattr.com/button/flattr-badge-large.png
[NPM_INFO_IMG]:             https://nodei.co/npm/minify.png?downloads=true&&stars
[NPMURL]:                   //npmjs.org/package/minify
[BuildStatusURL]:           //travis-ci.org/coderaiser/minify  "Build Status"
[DependencyStatusURL]:      //gemnasium.com/coderaiser/minify "Dependency Status"
[FlattrURL]:                https://flattr.com/submit/auto?user_id=coderaiser&url=github.com/coderaiser/minify&title=minify&language=&tags=github&category=software

[Minify](http://coderaiser.github.io/minify "Minify") - a minifier of js, css, html and img files,
used in [Cloud Commander](http://cloudcmd.io "Cloud Commander") project.

[![Flattr][FlattrIMGURL]][FlattrURL]

Install
---------------
[![NPM_INFO][NPM_INFO_IMG]][NPMURL]

You can install minify just like that:

    npm i minify
or
    
    git clone git://github.com/coderaiser/minify

Command Line
---------------
For use in command line just write something like:

```
minify <input-file> <output-file>
```
or just 

```
minify <input-file>>
```

to see output in screen.

API
---------------
**Minify** module contains some api for interacting from another js files.

To use **Minify** functions it sould be connected first. It's doing like always.

```js
minify = require('minify');
```
All of minification functions save files in **./min** directory with
extension **.min** (*.min.js, *.min.css, *.min.html).
If directory could be created **minify.MinFolder** would countain stirng 'min/',
in any other case - '/'.

**optimize**(*pFiles_a*) - function which minificate js, html and
css-files.
 - **pFiles_a**                     - varible, wich contain array of file
names or string, if name single.
 - **pOptions**(optional)           - object contain main options.

**Examples**:

```js
minify.optimize('client.js');
```

```js
minify.optimize('client.js', {
    callback: func(pMinData){}
});
```

if a couple files:

```js
minify.optimize(['client.js',
    'style.css']);
```

if post processing needed 

```js
minify.optimize({
    'client.js' : function(pFinalCode){}
});
```

if post image converting needed (works with css only)

```js
minify.optimize([{'style.css': {img: true, merge: true} },
    'index.html']);
```    

if only need the name of minified file (from min directory)

```js
minify.optimize('client.js', {
    returnName  : true
    callback    : function(pParams){
        var lName = pParams && pParams.name;
        console.log(lName)
    }
});
```

**MinFolder** - varible thet contains folder name, where minimized files stored.
                (could not be changed for now).
                
Additional modules:
---------------
- [UglifyJS] (https://github.com/mishoo/UglifyJS)
- [clean-css] (https://github.com/GoalSmashers/clean-css)
- [html-minifier] (https://github.com/kangax/html-minifier)
- [css-b64-images] (https://github.com/Filirom1/css-base64-images)

Install addtitional modules:

    npm i uglify-js clean-css html-minifier css-b64-images

Contributing
---------------
If you would like to contribute - send pull request to dev branch.
Getting dev version of **Minify**:

    git clone git://github.com/coderaiser/minify.git
    git checkout dev

Version history
---------------
- *2013.11.08*, **[v0.2.3](//github.com/coderaiser/minify-archive/raw/master/minify-v0.2.3.zip)**
- *2013.10.01*, **[v0.2.2](//github.com/coderaiser/minify-archive/raw/master/minify-v0.2.2.zip)**
- *2013.08.01*, **[v0.2.1](//github.com/coderaiser/minify-archive/raw/master/minify-v0.2.1.zip)**
- *2013.04.22*, **[v0.2.0](//github.com/coderaiser/minify-archive/raw/master/minify-v0.2.0.zip)**
- *2013.03.01*, **[v0.1.9](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.9.zip)**
- *2012.12.12*, **[v0.1.8](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.8.zip)**
- *2012.10.01*, **[v0.1.7](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.7.zip)**
- *2012.08.24*, **[v0.1.6](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.6.zip)**
- *2012.08.06*, **[v0.1.5](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.5.zip)**
- *2012.07.27*, **[v0.1.4](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.4.zip)**
- *2012.07.19*, **[v0.1.3](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.3.zip)**
- *2012.07.14*, **[v0.1.2](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.2.zip)**
- *2012.07.11*, **[v0.1.1](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.1.zip)**
- *2012.00.00*, **[v0.1.0](//github.com/coderaiser/minify-archive/raw/master/minify-v0.1.0.zip)**
