// Change these settings before starting pencilblue for the first time

// The name of your site
global.SITE_NAME = 'pencilblue';

// The URL that people will use to get to your site
global.SITE_ROOT = 'http://localhost:8080';

// The IP address of your server
global.SITE_IP = '127.0.0.1';

// The port that the application will be served on (the standard HTTP port is 80)
global.SITE_PORT = '8080';

// The URL location of your MongoDB server. If MongoDB is installed on the same server as pencilblue, you shouldn't have to modify this value.
global.MONGO_SERVER = 'mongodb://127.0.0.1:27017/';

// The name of the database you want pencilblue to save its data to.
global.MONGO_DATABASE = 'pencil_blue';


// Don't change this setting
global.DOCUMENT_ROOT = __dirname.substr(0, __dirname.indexOf(path.sep+'include'));
