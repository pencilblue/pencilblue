const os      = require('os');
const cluster = require('cluster');

module.exports = (pb) => {

    const PencilBlueServer = require(pb.config.docRoot + '/pencilblueV2')(pb);

    /*****
     * 
     * @type {Array}
     */
    const ListOfWorkers = []; // List of currently connected workers
    const DISCONNECTS = []; // List of times when nodes dropped out of the cluster
    const SHUTDOWN_HOOKS = {};
    const SHUTDOWN_PRIORITY = [];
    const FORCE_PROCESS_EXIT_TIMEOUT = 5 * 1000; // Max time to wait before terminating a node

    let isShuttingDown = false;
    let DISCONNECTS_CNT = 0; // Number of disconnects that have occurred on the cluster

    class PencilbueClusterManager {

        static onStart (config) {
            if (pb.config.cluster.self_managed && cluster.isMaster) {
                return this._onMasterRunning();
            }
            if (!pb.config.cluster.self_managed) {
                pb.log.debug('System: Running in managed mode');
            }
            return new PencilBlueServer(config).startup();
        }

        static registerShutdownHook (name, shutdownHook) {
            if (typeof name !== 'string') {
                throw new Error('A name must be provided for every shutdown hook');
            }
            SHUTDOWN_HOOKS[name] = shutdownHook;
            SHUTDOWN_PRIORITY.push(name); // Priority is FCFS
        }

        static registerSignalHandlers (killProcess) {
            //determine if the process should be killed off
            killProcess = killProcess || pb.util.isNullOrUndefined(killProcess);

            // listen for TERM signal .e.g. kill
            process.on ('SIGTERM', () => {
                this.log(`SIGTERM detected${this.isShuttingDown() ? ' but is already shutting down!' : '...'}`, true);
                if (!this.isShuttingDown()) {
                    this.shutdown(killProcess);
                }
            });

            // listen for INT signal e.g. Ctrl-C
            process.on ('SIGINT', () => {
                this.log(`SIGINT detected${this.isShuttingDown() ? ' but is already shutting down!' : '...'}`, true);
                if (!this.isShuttingDown()) {
                    this.shutdown(killProcess);
                }
            });

            process.on ('uncaughtException', (err) => {
                let shutdownStateMessage = this.isShuttingDown() ? ' but is already shutting down!' : '...';
                this.log(`uncaught Exception detected${shutdownStateMessage} Error Message: ${err.stack}`, true);
                if (!this.isShuttingDown()) {
                    this.shutdown(killProcess);
                }
            });
        };

        static async shutdown (killProcess = true) {
            this.log('Shutting down...'); //notify of shutdown

            let shutdownComplete = false;

            //create fallback so that when services do not shutdown within 5 seconds the process is forced to terminate
            let startForceShutdownTimer = async (ms) => {
                await pb.util.timeout(ms);
                if(!shutdownComplete && killProcess) {
                    this.log('Shutdown completed! However, it was forced...');
                    process.exit();
                }
            };

            //create tasks to shutdown registered services in parallel
            let shutdownTasks = SHUTDOWN_PRIORITY
                .reverse()
                .map(async taskKey => {
                    this.log(`Calling [${taskKey}] shutdown hook`);
                    return SHUTDOWN_HOOKS[taskKey]();
                });

            try {
                startForceShutdownTimer(FORCE_PROCESS_EXIT_TIMEOUT); // Start the timer to force shutdown
                await Promise.all(shutdownTasks); // Run the shut down tasks
                shutdownComplete = true; // If we finish before the force shutdown, turn off its salient feature
                this.log('Shutdown completed Successfully!');

                if (killProcess) {
                    process.exit();
                }
            } catch (err) {
                this.log('Encountered critical error during shutdown... Forcing shutdown now...');
                process.exit();
            }
        };

        /**************************************************
         * Getters for static data members.  
         * In node 12, replace with static getters
         */
        static isShuttingDown() {
            return isShuttingDown;
        }
        static getWorkerId () {
            return cluster.worker ? cluster.worker.id : 'M';
        }

        static _onMasterRunning () {
            let workerCnt = os.cpus().length;
            if (pb.config.cluster.workers && pb.config.cluster.workers !== 'auto') {
                workerCnt = pb.config.cluster.workers;
            }

            //spawn workers
            for (let i = 0; i < workerCnt; i++) {
                ListOfWorkers.push(cluster.fork());
            }

            cluster.on('disconnect', (worker) => this._onWorkerDisconnect(worker));

            this.log(`${workerCnt} workers spawned. Listening for disconnects.`);
        }
        static _onWorkerDisconnect (worker) {
            let oldWorkerId = worker.id;

            this.log(`Worker [${oldWorkerId}] disconnected`, true);

            let isHealthy = this._isClusterHealthy();

            if (isHealthy && !this.isShuttingDown()) {
                // TODO: Remove old workerId from list of workers
                // TODO: add new worker to list of workers
                worker = cluster.fork();
                let newWorkerId = worker ? worker.id : 'FAILED';
                this.log(`Forked worker [${newWorkerId}]`, true);
            }
            else if (!this.isShuttingDown()){
                this.logError(`${pb.config.cluster.fatal_error_count} failures have occurred within ${pb.config.fatal_error_timeout}ms.  Forcing shutdown...`);
                process.kill();
            }
        }
        static _isClusterHealthy () {
            let currTime = new Date().getTime();

            DISCONNECTS_CNT++;
            DISCONNECTS.push(currTime);

            //splice it down if needed.  Remove first element (FIFO)
            if (DISCONNECTS.length > pb.config.cluster.fatal_error_count) {
                DISCONNECTS.splice(0, 1);
            }

            //check for unacceptable failures in specified time frame
            if (DISCONNECTS.length >= pb.config.cluster.fatal_error_count) {
                let range = DISCONNECTS[DISCONNECTS.length - 1] - DISCONNECTS[DISCONNECTS.length - pb.config.cluster.fatal_error_count];
                if (range <= pb.config.cluster.fatal_error_timeout) {
                    return false;
                }
                else {
                    pb.log.silly("System[%s]: Still within acceptable fault tolerance.  TOTAL_DISCONNECTS=[%d] RANGE=[%d]", this.getWorkerId(), DISCONNECTS_CNT, pb.config.cluster.fatal_error_count, range);
                }
            }
            return true;
        }

        static logError (message) {
            pb.log.error(`System[${this.getWorkerId()}]: ${message}`);
        }
        static log (message, isDebug) {
            let level = isDebug ? 'debug' : 'info';
            pb.log[level](`System[${this.getWorkerId()}]: ${message}`);
        }
    }

    return PencilbueClusterManager;
};
