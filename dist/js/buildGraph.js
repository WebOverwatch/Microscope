function drawByJsPlumb(nodes, links) {
    // your jsPlumb related init code goes here
    // setup some defaults for jsPlumb.
    var instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {
            radius: 2
        }],
        Connector: "StateMachine",
        HoverPaintStyle: {
            stroke: "#1e8151",
            strokeWidth: 2
        },
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            }],
        ],
        Container: "canvas"
    });

    window.jsp = instance;
    instance.registerConnectionType("basic", {
        anchor: "Continuous",
        connector: "StateMachine"
    });
    //
    // initialise element as connection targets and source.
    //
    var initNode = function (el) {

        // initialise draggable elements.
        instance.draggable(el);

        // this is not part of the core demo functionality; it is a means for the Toolkit edition's wrapped
        // version of this demo to find out about new nodes being added.
        //
        instance.fire("jsPlumbDemoNodeAdded", el);
    };
    console.log('haha');
    // suspend drawing and initialise.
    instance.batch(function () {
        for (let node of nodes) {
            let d = document.createElement("div");
            d.className = "w";
            d.id = node;
            d.innerHTML = node.replace(/\-/g,".").substr(1);
            instance.getContainer().appendChild(d);
            initNode(d);
        }
        // and finally, make a few connections
        for (let rel in links) {
            for (let target of links[rel]) {
                instance.connect({
                    source: rel,
                    target: target,
                    type: "basic",
                });
            }
        }
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);
}