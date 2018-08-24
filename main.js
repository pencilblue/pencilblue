const Promise = require('bluebird');
const Configuration = require('./include/config.js');

const pb = createPencilblueInstance(Configuration.load());

function createPencilblueInstance(config) {
    let pb = require('./include')(config);
    Object.keys(pb).forEach((key) => pb[key] = Promise.promisifyAll(pb[key]));
    return pb;
}

let app = new pb.Router();

app.addMiddlewareBeforeAll({name: 'logger', action: async (ctx, next) => {
   let start = console.time();
   pb.log.info("Starting up...");
   await next();
   let end = console.time();
   pb.log.info("Ending...");
   pb.log.info(`took ${(end-start)} seconds?`);
}});

app.addMiddlewareAfterAll({name: 'render', action: async (ctx) => {
   ctx.body = "This is my hello world => " + ctx.req.url;
   pb.log.info('Rendering...');
}});
const RouteLoader = require('./include/koa/RouteHandler')(pb);
let routeLoader = new RouteLoader();
routeLoader.getCoreRouteList(app);

// app.registerRoute({path: '/', method: 'get'});
// app.registerRoute({path: '/search', method: 'get'});

app.listen(3000);
