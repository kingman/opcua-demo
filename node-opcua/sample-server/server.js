const opcua = require("node-opcua");

const server = new opcua.OPCUAServer({
    port: 4334, // the port of the listening socket of the server
    resourcePath: "UA/SensorServer", // this path will be added to the endpoint resource name
     buildInfo : {
        productName: "MySampleServer1",
        buildNumber: "7658",
        buildDate: new Date(2019,3,28)
    },
    alternateHostname: "localhost"
});

function post_initialize() {
    console.log("initialized");
    function construct_my_address_space(server) {

        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // declare a new object
        const sensor = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "CounterSensor"
        });

        const plantId = "SWE-STO-42";
        namespace.addVariable({
          componentOf: sensor,
          browseName: "PlantId",
          dataType: "String",
          value: {
            get: function () {
              return new opcua.Variant({dataType: opcua.DataType.String, value: plantId });
            }
          }
        });

        const lineId = "Line-1";

        namespace.addVariable({
          componentOf: sensor,
          browseName: "LineId",
          dataType: "String",
          value: {
            get: function () {
              return new opcua.Variant({dataType: opcua.DataType.String, value: lineId });
            }
          }
        });

        let counter = 0;

        // emulate variable1 changing every 500 ms
        setInterval(function(){counter=Math.floor(Math.random() * 101); }, 500);

        namespace.addVariable({
            componentOf: sensor,
            browseName: "Counter",
            dataType: "UInt16",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.UInt16, value: counter });
                }
            }
        });
    }
    construct_my_address_space(server);
    server.start(function() {
        console.log("Server is now listening ... ( press CTRL+C to stop)");
        console.log("port ", server.endpoints[0].port);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log(" the primary server endpoint url is ", endpointUrl );
    });
}
server.initialize(post_initialize);

