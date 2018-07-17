let relation = [], nodes = [], nodesIP = [];
// Create a new directed graph
let g = new dagre.graphlib.Graph();

function getData() {
    let range = getLogTimeRange();
    let data = {
        "from": 0,
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
            console.log(JSON.stringify(data));
            for (let source of data.hits.hits) {
                let temp = source._source.message.split('\t');
                // 过滤掉不是该应用的数据
                if (temp[1] !== undefined && temp[1].search('sock-shop') !== -1) {
                    // 存储关系
                    let trans = temp[3].split('->');
                    let source = 'n' + trans[0].split(':')[0].replace(/\./g, "-"),
                        target = 'n' + trans[1].split(':')[0].replace(/\./g, "-");
                    // console.log(trans[0].split(':')[0] + ' -> ' + trans[1].split(':')[0]);
                    if (source === 'n172-20-1-164')
                        continue;
                    if (trans[0].split(':')[0] in pod_map && trans[1].split(':')[0] in pod_map) {
                        if (nodes.indexOf(source) === -1) {
                            nodes.push(source);
                            nodesIP.push(trans[0].split(':')[0]);
                        }
                        if (nodes.indexOf(target) === -1) {
                            nodes.push(target);
                            nodesIP.push(trans[1].split(':')[0])
                        }
                        if (relation[source] === undefined) {
                            // 新增一个source
                            relation[source] = [target];
                        }
                        else if (relation[source].indexOf(target) === -1) {
                            relation[source].push(target);
                        }
                        // $('#main').append('<p>' + line + '</p>');
                    }
                }
            }
            console.log(nodesIP);
            console.log(relation);

            // Add nodes to the graph.
            for (let node of nodes) {
                g.setNode(node, {width: 160, height: 80});
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
                length: 15,
                foldback: 0.3
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

    // suspend drawing and initialise.
    instance.batch(function () {
        // v是结点id，g.node(v)是画图组建中结点的数据
        g.nodes().forEach(function (v) {
            let d = document.createElement("div");
            d.className = 'node';
            d.id = v;
            d.innerHTML = createNode(v, v.replace(/\-/g, ".").substr(1));
            d.style.left = g.node(v).x + "px";
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
    d.setMinutes(d.getMinutes() - 2);
    time.start = d.toISOString();
    return time;
}

function createNode(id, ip) {
    let node =
        '<div class="node-podname-div">' +
        '<p class="node-auto-hidden-font">' + pod_map[ip] + '</p>' +
        '</div>' +
        '<div class="node-lantancy-div">' +
        '<span class="glyphicon glyphicon-time node-icon"></span><span class="node-big-font"></span><span class="node-small-font">ms</span>' +
        '</div>\n' +
        '<div class="node-service-div">' +
        '<span class="fa fa-cube node-icon"></span><span class="node-medium-font">' + ip + '</span>' +
        '</div>';
    return node;
}

$(document).ready(function () {
    // Set an object for the graph label
    g.setGraph({});
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function () {
        return {};
    });
    // Set some parameter of the graph
    g.graph().nodesep = 10;
    g.graph().ranksep = 110;

    getData();

    jsPlumb.ready(function () {
        drawByJsPlumb(g, relation);
    });

    let refreshData = setInterval(function () {
        for (let ip of nodesIP) {
            $.ajax({
                dataType: 'json',
                type: "GET",
                cache: 'false',
                url: 'http://172.18.196.96:31090/api/v1/query?query=histogram_quantile(0.99, sum(rate(request_duration_seconds_bucket{instance=~"' + ip + ':.*"}[1m])) by (name, le))',
                success: function (data) {
                    if (data.status === 'success') {
                        let id = '#n' + ip.replace(/\./g, "-");
                        if (data.data.result.length === 0) {
                            $(id).find('.node-big-font').eq(0).html('NA');
                        }
                        else {
                            $(id).find('.node-big-font').eq(0).html((data.data.result[0].value[1] * 1000).toFixed(2));
                        }
                    }
                }
            });
        }
    }, 1000);

    $('#stop-btn').click(function () {
        clearInterval(refreshData);
    });

    $('#app-select').fancySelect();
    $('#type-select').fancySelect().on('change.fs', function() {
        $(this).trigger('change.$');
        alert(test);
    });
    $('.options').css('padding', '0');
    // $('#type-select').removeClass('fancy-select');
});