
const Configuration = require('./include/config.js');
const Promise = require('bluebird');

function createPencilBlueInstance(config) {
    let pb = require('./include')(config);
    Object.keys(pb).forEach((key) => pb[key] = Promise.promisifyAll(pb[key]));
    return pb;
}


let pb;

class PencilBlueCluster {
    constructor (config) {
        this.config = config;
        pb = createPencilBlueInstance(config);
        pb.system.registerSignalHandlers(true);
        this.pb = pb;
    }
    async startup() {
        await pb.system.onStart(this.config);
    }
}




//start system only when the module is called directly
if (require.main === module) {
    new PencilBlueCluster(Configuration.load()).startup();
}

module.exports = PencilBlueCluster;
