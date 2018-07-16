let relation = [], nodes = [];
// Create a new directed graph
let g = new dagre.graphlib.Graph();
function getData() {
    let range = getLogTimeRange();
    let data = {
        "size": 8000,
        "query": {
            "range": {
                "@timestamp": {
                    "lte": range.end,
                    "gte": range.start,
                }
            }
        }
    };
    $.ajax({
        type: "POST",
        url: "http://172.18.196.96:9200/filebeat-6.2.3-*/doc/_search?filter_path=hits.hits._source.message",
        dataType: "json",
        async: false,
        data: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
        success: function (data) {
            for (let source of data.hits.hits) {
                let temp = source._source.message.split('\t');
                // 过滤掉不是该应用的数据
                if (temp[1] !== undefined && temp[1].search('sock-shop') !== -1) {
                    // 存储关系
                    let trans = temp[3].split('->');
                    let source = 'n' + trans[0].split(':')[0].replace(/\./g,"-"), target = 'n' + trans[1].split(':')[0].replace(/\./g,"-");
                    if (source === 'n172-20-3-131')
                        continue;
                    // 判断并放入节点集合
                    if (nodes.indexOf(source) === -1) {
                        nodes.push(source);
                    }
                    if (nodes.indexOf(target) === -1) {
                        nodes.push(target);
                    }
                    if (relation[source] === undefined) {
                        // 新增一个source
                        relation[source] = [target];
                    }
                    else if (relation[source].indexOf(target) === -1){
                        relation[source].push(target);
                    }
                    // $('#main').append('<p>' + line + '</p>');
                }
            }
            console.log(nodes);
            console.log(relation);

            // Set an object for the graph label
            g.setGraph({});
            // Default to assigning a new object as a label for each new edge.
            g.setDefaultEdgeLabel(function() { return {}; });
            // Set some parameter of the graph
            g.graph().nodesep = 10;
            g.graph().ranksep = 100;

            // Add nodes to the graph.
            for (let node of nodes) {
                g.setNode(node, { width: 110, height: 60 });
            }
            // Add edges to the graph.
            for (let source in relation) {
                for (let target of relation[source]) {
                    g.setEdge(source, target);
                }
            }
            dagre.layout(g);
            // drawByEcharts(nodes, relation);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(textStatus);
        }
    });
}

function drawByJsPlumb(g, links) {
    // your jsPlumb related init code goes here
    // setup some defaults for jsPlumb.
    let instance = jsPlumb.getInstance({
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
        Anchor: ['Top', 'Bottom'],
        Container: "canvas",
    });

    window.jsp = instance;
    instance.registerConnectionType("basic", {
        // anchor: "Continuous",
        connector: "StateMachine"
    });
    //
    // initialise element as connection targets and source.
    //
    let initNode = function (el) {

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
        // v是结点id，g.node(v)是画图组建中结点的数据
        g.nodes().forEach(function(v) {
            let d = document.createElement("div");
            d.className = "w";
            d.id = v;
            d.innerHTML = v.replace(/\-/g,".").substr(1);
            d.style.left = g.node(v).x  + "px";
            d.style.top = g.node(v).y + "px";
            instance.getContainer().appendChild(d);
            initNode(d);
        });
        // and finally, make a few connections
        for (let rel in links) {
            for (let target of links[rel]) {
                instance.connect({
                    source: rel,
                    target: target,
                    type: "basic",
                    // anchor: ['Top', 'Bottom']
                });
            }
        }
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);
}

function getLogTimeRange() {
    let d = new Date(), time = {};
    time.end = d.toISOString();
    d.setSeconds(d.getSeconds() - 30);
    time.start = d.toISOString();
    return time;
}