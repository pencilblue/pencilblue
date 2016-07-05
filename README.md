[![dependencies](https://david-dm.org/pencilblue/pencilblue.png)](https://david-dm.org/pencilblue/pencilblue) [![Coverage Status](https://coveralls.io/repos/pencilblue/pencilblue/badge.svg?branch=master)](https://coveralls.io/r/pencilblue/pencilblue?branch=master) [![Build Status](https://travis-ci.org/pencilblue/pencilblue.svg?branch=master)](https://travis-ci.org/pencilblue/pencilblue) [![bitHound Overall Score](https://www.bithound.io/github/pencilblue/pencilblue/badges/score.svg)](https://www.bithound.io/github/pencilblue/pencilblue) [![Join the chat at https://gitter.im/pencilblue/pencilblue](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pencilblue/pencilblue?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[PencilBlue](http://pencilblue.org)
=====

### A full featured Node.js CMS and blogging platform (plugins, server cluster management, data-driven pages)

First and foremost:  If at any point you have questions, comments or concerns you can find us hanging out on twitter [@getpencilblue](https://twitter.com/GetPencilBlue) and on our [subreddit](http://www.reddit.com/domain/pencilblue.org/).  We're always happy to help and pull requests (plugin or core) are always welcome.  

###### To learn how to build websites with PencilBlue, read our [tutorials](https://github.com/pencilblue/pencilblue/wiki/Quickstart-Guide).

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

[![LAUNCH ON OpenShift](http://launch-shifter.rhcloud.com/launch/LAUNCH ON.svg)](https://hub.openshift.com/quickstarts/deploy/159-pencilblue)

The instructions below assume that Node.js [0.11, 6] and MongoDB [2, 3) are installed on your machine. If they are not then please visit http://nodejs.org and http://www.mongodb.org to install them.

##### PencilBlue Command-line interface
 1. Install the pencilblue-cli module: ```sudo npm install -g pencilblue-cli```
 2. Run ```pbctrl install [directory]``` where [directory] is the directory you want PencilBlue to be installed to.
 3. Follow the install instructions
 4. After the installation is done, ```cd``` into the folder where you installed PencilBlue
 5. Run ```pbctrl start```

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

##### Roadmap
**0.5.0 Release:**

Target Date: Mid-December 2015
New Features:
* Multisite support
* #501 - Route localization

The full list can be found [here](https://github.com/pencilblue/pencilblue/milestones/0.5.0).

Features in progress:
Check out our [Waffle](https://waffle.io/pencilblue/pencilblue) board.

##### Help & Support
Aways start with our wiki or [code level documentation](http://pencilblue.github.io/).  The source never lies.  Additionally, always feel free to leave questions on our issues page or reach out to us on Twitter at [@GetPencilBlue](https://twitter.com/GetPencilBlue).

**Submitting Issues:**
When submitting an issue or request for help please provide the following information.

1. Step by step instructions to reproduce
2. Configuration overrides (minus any credentials)
3. Environment details: Linux, windows, hosting provider, local, etc.
4. Log output. Set your logging.level configuration property to "silly".

**Submitting a Pull Request:**

1. Provide a detailed description of what changed.  
2. Reference any related issues by number so they can be tracked and linked back to the PR.
3. Document any new functions so they show up in our auto-generated documentation
4. Create tests for any new functionality
5. RUN ```npm test```
6. Bug fixes should be merged to master & features should be merged to the next release branch
