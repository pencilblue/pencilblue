// const serveInstance = require('./new_main');
//
// const Configuration = require('./include/config.js');
//
// module.exports = new serveInstance(Configuration.load()).startup();
const cluster = require('cluster') // node builtin cluster
const Koa = require('koa')
const port = 3000
const app = new Koa();

function log(msg) {
    console.log(`Server [${cluster.worker.id}] ${msg}`);
}

class TestPbServer {
    constructor () {
        app.use(async (ctx, next) => {
            log('starting request');
            await next();
        });

        app.use(async (ctx, next) => {
            if(ctx.query.data)
                this.dataStore.push(ctx.query.data);
            await next();
        });
        app.use(async (ctx, next) => {
            log('starting sync....');
            let payload = {
                action: 'syncData',
                data: this.dataStore
            };
            process.send(payload);
            log('sync finished....');
            await next();
        })

        app.use(async (ctx, next) => {
            ctx.body = JSON.stringify(this.dataStore);
            log('ending');
        });

// all your application-specific stuff goes here
        app.listen(port, () => {
            log(`Cluster worker is listening on ${port}`)
        });

        this.dataStore = [];
    }

    syncData ( data) {
        this.dataStore = data;
        log('updated data');
    }
}

module.exports = new TestPbServer();
