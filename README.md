[PencilBlue](http://pencilblue.org)
=====

First and foremost:  If at any point you have questions, comments or concerns you can find us hanging out on twitter [@getpencilblue](https://twitter.com/GetPencilBlue) and on our [Sub-Reddit](http://www.reddit.com/domain/pencilblue.org/).  We're always happy to help and pull requests (plugin or core) are always welcome.  

##### Full featured online publishing and CMS for Node.js
###### To learn how to build websites with PencilBlue, read our [tutorials](https://pencilblue.org/section/tutorials).

The first open source content management system to meet all the needs of a modern website:

 - Full blogging capabilities, out of the box
 - Relational data creation and management, through the admin interface
 - An expansive plugin framework that allows for modification of even core platform functionality
 - Designed for the cloud, with built in support for server clustering and high availability websites
 - Built in support for some of the latest and most popular web technologies, including MongoDB, Redis, Bootstrap, AngularJS, and jQueryUI
 - 100% mobile ready through responsive web design
 - Touch friendly, drag and drop website management experience that's easy for non-technical users to learn

### [Read the Quickstart Guide](https://github.com/pencilblue/pencilblue/wiki/Quickstart-Guide)

Installation
-----

The instructions below assume that Node.js and MongoDB are installed on your machine. If they are not then please visit http://nodejs.org and http://www.mongodb.org to install them.

##### PencilBlue Command-line interface
 1. Install the pencilblue-cli module: ```sudo npm install -g pencilblue-cli```
 2. Run ```pencilblue install [directory]``` where [directory] is the directory you want PencilBlue to be installed to.
 3. Follow the install instructions
 4. After the installation is done, ```cd``` into the folder where you installed PencilBlue
 5. Run ```pencilblue start```

##### Manual installation
 1. Clone the PencilBlue repository
 2. ```cd``` into the cloned repository's folder
 3. Run ```npm install``` to retrieve PencilBlue's dependencies. Depending on your system access privileges, you may have to run  ```sudo npm install```
 4. (Optional) Install [Redis](http://redis.io/) for caching
 5. (Optional) Create a custom configuration file using the provided ```sample.config.json```. The file can reside in two places: within the root folder of your installation as ```config.json``` or at ```/etc/pencilblue/config.json```. The installation root takes precedence. If running all services locally, no configuration file is needed, but a configuration file is necessary for overriding specific settings.
 6. Start PencilBlue. You can simply run ```node pencilblue```, but we recommend using [nodemon](https://www.npmjs.org/package/nodemon) for development and [forever](https://www.npmjs.org/package/forever) for production. Nodemon will restart PencilBlue on file changes and forever will ensure that PencilBlue is always running.
 ```
 # development
 nodemon pencilblue

 OR

 # production
 sudo forever start pencilblue.js
 ```
 7. Navigate to the site root you specified in a configuration file or http://localhost:8080 by default.
