var opcua = require("node-opcua");
var async = require("async");

var client = new opcua.OPCUAClient();
var endpointUrl = "opc.tcp://localhost:4334/UA/SensorServer";

var the_session, the_subscription;

async.series([
  // step 1 : connect to
  function(callback) {
    client.connect(endpointUrl,function (err) {
      if(err) {
        console.log(" cannot connect to endpoint :" , endpointUrl );
      } else {
        console.log("connected !");
      }
      callback(err);
    });
  },
  // step 2 : createSession
  function(callback) {
    client.createSession( function(err,session) {
      if(!err) {
        the_session = session;
      }
      callback(err);
    });
  },

  // read plantId
  function(callback) {
    getVariableValue("PlantId", callback);
  },

  // read plantId
  function(callback) {
    getVariableValue("LineId", callback);
  },

  function(callback) {
    subscribe("Counter", callback)
  }


],
  function(err) {
      if (err) {
          console.log(" failure ",err);
      } else {
          console.log("done!");
      }
      client.disconnect(function(){});
  });

function getNodeIdFrom(browseName, posCall) {
  the_session.translateBrowsePath([opcua.makeBrowsePath("RootFolder",`/Objects/1:CounterSensor/1:${browseName}`)],function (err, results) {
    if (!err) {
      results.forEach(result => {
        if(result.targets[0] && result.targets[0].targetId) {
          posCall(result.targets[0].targetId.toString());
        }
      });
    }
  });
}

function getVariableValue(browseName, callback) {
  getNodeIdFrom(browseName, function(nodeId){
     the_session.readVariableValue(nodeId, function(err,dataValue) {
         if (!err) {
             console.log(` ${browseName} = ` , dataValue.value.value.toString());
         }
         callback(err);
     });
  })
}

function subscribe(browseName, callback) {
  getNodeIdFrom(browseName, function(nodeId){
    the_subscription=new opcua.ClientSubscription(the_session,{
        requestedPublishingInterval: 5000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 5,
        maxNotificationsPerPublish: 20,
        publishingEnabled: true,
        priority: 10
    });

    the_subscription.on("started",function(){
        console.log("subscription started for 2 seconds - subscriptionId=",the_subscription.subscriptionId);
    }).on("keepalive",function(){
        console.log("keepalive");
    }).on("terminated",function(){
    });

    setTimeout(function(){
        the_subscription.terminate(callback);
    },100000);

    // install monitored item
    var monitoredItem  = the_subscription.monitor({
        nodeId: opcua.resolveNodeId(nodeId),
        attributeId: opcua.AttributeIds.Value
    },
    {
        samplingInterval: 500,
        discardOldest: false,
        queueSize: 10
    },
    opcua.read_service.TimestampsToReturn.Both
    );
    console.log("-------------------------------------");

    monitoredItem.on("changed",function(dataValue){
       console.log(` ${browseName} = `,dataValue.value.value);
    });
  });
}

