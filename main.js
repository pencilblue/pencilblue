const listOfServers = [];

const cluster = require('cluster');
const { cpus } = require('os');
const { resolve } = require('path');
const pbServer = resolve('server');

const boringCluster = (opts = {}) => {
    const { workers = cpus().length, name = '' } = opts;

    if (cluster.isMaster) {
        Array(workers).fill(null).forEach(() => {
            generateWorker();
        });

        cluster.on('exit', (worker) => {
            let deadWorkerPid = worker.process.pid;
            console.log(`${name || ''} ${deadWorkerPid} died; forking.`.trim());

            // Remove the dead server from the list of working servers
            let deadServerIdx = listOfServers.findIndex((server) => server.process.pid === deadWorkerPid);
            listOfServers.splice(deadServerIdx, 1);

            generateWorker();
        })
    } else {
        let server = require(pbServer);
        // When a child process receives a message, call the action with the data
        process.on('message', (msg) => {
            server[msg.action](msg.data);
        });
    }
};

function generateWorker () {
    let worker = cluster.fork();

    // When a master thread receives a message, broadcast it to the child processes
    worker.on('message', (message) => {
        // send command to the command service/broker
        listOfServers.forEach((worker) => {
            worker.send(message);
        });
    });

    listOfServers.push(worker);
}

boringCluster({ name: 'My PencilBlue', workers: 2 });
