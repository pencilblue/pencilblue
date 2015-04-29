var AWS = require('aws-sdk');
var LINQ = require('node-linq').LINQ;

//deploy to east region on test stack
AWS.config.region = 'us-east-1';

//OpsWorks Parameters for deployment
var StackId = process.env.AWS_StackId;
var AppId = process.env.AWS_AppId;
var LayerId = process.env.AWS_LayerId;

var opsWorks = new AWS.OpsWorks();

getInstanceIds(function(instanceIds){
  if(instanceIds.length < 1){
    throw new NoEC2InstanceAvailableError("No instances are online for deployment");
  }
  else{
    var deployParams = {
        Command:{
            Name: 'deploy'
        },
        StackId: StackId,
        AppId: AppId,
        InstanceIds: instanceIds
    };
    createDeployment(deployParams);
  }
});

//Get Instance IDs from stack matching desired LayerId
function getInstanceIds(cb){
    opsWorks.describeInstances({LayerId: LayerId}, function(err, data){
        if(err){
            console.log(StackId + ' ' + LayerId);
            console.log(err, err.stack);
        }
        else{
            var instanceIds = new LINQ(data.Instances).Select(function(instance){
                return instance.InstanceId;
            }).ToArray();
            console.log('Deploying to these instances: ' + instanceIds);
            cb(instanceIds);
        }
    });
}

//Run the deloyment
function createDeployment(deployParams){
    opsWorks.createDeployment(deployParams, function(err, data){
        if(err){ 
            console.log(err, err.stack);
        }
        else{
            console.log("Deployment Id: " + data.DeploymentId);
            watchDeployment(data.DeploymentId);
        }
    });
}
//Hold the thread until deployment is finished.
function watchDeployment(deploymentId){
    opsWorks.describeDeployments({DeploymentIds: [deploymentId]}, function(err, data){
        if(err){
            console.log(err, err.stack);
        }
        else{
            console.log(data);
            if(data.Deployments[0].Status.toLowerCase() === 'running'){
                var timeout = 60000;
                console.log('Deployment in progress, waiting for ' + timeout + ' ms.');
                setTimeout(function(){
                    watchDeployment(deploymentId);
                }, timeout);  
            }
            else{
                console.log('Deployment Finished.  Status: ' + data.Deployments[0].Status);
                if(data.Deployments[0].Status.toLowerCase() === 'failed'){
                    throw new DeploymentFailedException("Deployment failed");
                }
                else{
                    healthCheck();
                }
            }
        }
    });
}

//Hold the thread until load balancer reports healthy instances (will check 2 times in 15 second intervals)
var healthChecksRemaining = 10;
function healthCheck(){
    var elb = new AWS.ELB();
    setTimeout(function(){
        elb.describeInstanceHealth({LoadBalancerName: env.AWS_ELB_NAME}, function(err, data){
            if (err){
                console.log(err, err.stack); // an error occurred
            }
            else{
                var unhealthyInstances = new LINQ(data.InstanceStates).Where(function(instanceState){ 
                    return instanceState.State === 'OutOfService' || instanceState.State === 'Unknown';
                }).ToArray();
                if(unhealthyInstances && unhealthyInstances.length > 0){
                    healthChecksRemaining --;
                    console.log('Unhealthy Instance Count: ' + unhealthyInstances.length);
                    if(healthChecksRemaining < 1){
                        throw new UnhealthyEC2InstanceError("Instance Unhealthy after 5 consecutive health checks");
                    }
                    else{
                        healthCheck();
                    }
                }
                else{
                    console.log('Instance is healthy, moving on to nightwatch.');
                }
            }
        }); 
    }, 30000);
}

//Exception for when no ec2 instances are available
function NoEC2InstanceAvailableError(message){
    this.message = message;
    this.name = "NoEC2InstanceAvailableError";
}

//Exceptions for when deployment fails
function DeploymentFailedException(message){
    this.message = message;
    this.name = "DeploymentFailedException";
}

//Exception for unhealthy EC2 Instances after deployment 
function UnhealthyEC2InstanceError(message){
    this.message = message;
    this.name = "UnhealthyEC2InstanceError";
}