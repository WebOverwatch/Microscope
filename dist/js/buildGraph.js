let relation = [], nodes = [], nodesIP = [], tempType = 'pod', tempApp = 'system';
// Create a new directed graph
let g;

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
        cache: 'false',
        data: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
        success: function (data) {
            // console.log(JSON.stringify(data));
            g = new dagre.graphlib.Graph();
            // Set an object for the graph label
            g.setGraph({});
            // Default to assigning a new object as a label for each new edge.
            g.setDefaultEdgeLabel(function () {
                return {};
            });
            // Set some parameter of the graph
            g.graph().nodesep = 10;
            g.graph().ranksep = 110;
            relation = [], nodes = [], nodesIP = [];
            for (let doc of data.hits.hits) {
                let temp = doc._source.message.split('\t');
                // 过滤掉不是该应用的数据
                if ((tempApp === 'sock-shop' && temp[1] !== undefined && temp[1].search('sock-shop') !== -1) ||
                    (tempApp === 'system' && temp[1] !== undefined && temp[1].startsWith('k8s'))) {
                    // 存储关系
                    let trans = temp[3].split('->');
                    let source = trans[0].split(':')[0], target = trans[1].split(':')[0];

                    if (source === '172.20.1.164')
                        continue;
                    if (source in pod_map && target in pod_map) {
                        if (tempType === 'pod') {
                            source = 'n' + source.replace(/\./g, "-");
                            target = 'n' + target.replace(/\./g, "-");
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
                        }
                        else if (tempType === 'service') {
                            let findSource = false, findTarget = false;
                            for (let key in service_map) {
                                if (findSource && findTarget)
                                    break;
                                if (service_map[key].indexOf(source) !== -1) {
                                    source = key;
                                    findSource = true;
                                }
                                if (service_map[key].indexOf(target) !== -1) {
                                    target = key;
                                    findTarget = true;
                                }
                            }
                            if (findTarget && findTarget) {
                                if (nodes.indexOf(source) === -1) {
                                    nodes.push(source);
                                    nodesIP.push(source);
                                }
                                if (nodes.indexOf(target) === -1) {
                                    nodes.push(target);
                                    nodesIP.push(target)
                                }
                                if (relation[source] === undefined) {
                                    // 新增一个source
                                    relation[source] = [target];
                                }
                                else if (relation[source].indexOf(target) === -1) {
                                    relation[source].push(target);
                                }
                            }
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
            d.innerHTML = createNode(v, tempType === 'pod' ? v.replace(/\-/g, ".").substr(1) : service_name[v]);
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

    if (tempType === 'pod') {
        $('.node').dblclick(function () {
            let pod_name = $(this).find('.node-auto-hidden-font').eq(0).text();
            console.log(pod_name + ': ' + (pod_name in performance_map));
            if (pod_name in performance_map) {
                $('#modal-pod-performance-body').empty();
                $('#modal-pod-performance').modal();
                if ($('#modal-pod-performance').find('.modal-body-self').children().length === 0) {
                    $('#modal-pod-performance').find('.modal-body-self').append(
                        '<iframe src="http://172.18.196.96:37489/dashboard-solo/db/sock-shop?from=now-1h&to=now&panelId=' + performance_map[pod_name][0] + '" width="100%" height="200" frameborder="0" id="frame" name="frame"></iframe>\n' +
                        '<iframe src="http://172.18.196.96:37489/dashboard-solo/db/sock-shop?from=now-1h&to=now&panelId=' + performance_map[pod_name][1] + '" width="100%" height="200" frameborder="0" id="frame" name="frame"></iframe>');
                }
            }
            else {
                $('#modal-pod-performance-body').empty().append('<div class="div-no-data"><img src="../dist/img/error.png"></img><h3><i class="fa fa-warning text-yellow"></i> Oops! Not data for this pod.</h3>' +
                    '<p>We could not find the performace data you were looking for.' +
                    'Meanwhile, you may <a href="#" data-dismiss="modal">return to page</a> or try other function.</p></div>');
                $('#modal-pod-performance').modal();
            }
        });
    }
}

function getLogTimeRange() {
    let d = new Date(), time = {};
    time.end = d.toISOString();
    d.setMinutes(d.getMinutes() - 2);
    time.start = d.toISOString();
    return time;
}

function createNode(id, ip) {
    // console.log(ip + ': ' + (ip in pod_map ? pod_map[ip] : service_map[ip]));
    let node =
        '<div class="node-podname-div">' +
        '<p class="node-auto-hidden-font">' + (ip in pod_map ? pod_map[ip] : id) + '</p>' +
        '</div>' +
        '<div class="node-lantancy-div">' +
        '<span class="glyphicon glyphicon-time node-icon"></span><span class="node-big-font"></span><span class="node-small-font">ms</span>' +
        '</div>' +
        '<div class="node-service-div">' +
        '<span class="fa fa-cube node-icon"></span><span class="node-medium-font">' + (ip === undefined ? 'NA' : ip) + '</span>' +
        '</div>';
    return node;
}

function refreshData() {
    for (let ip of nodesIP) {
        let url = tempType === 'pod' ? 'http://172.18.196.96:31090/api/v1/query?query=histogram_quantile(0.99, sum(rate(request_duration_seconds_bucket{instance=~"' + ip + ':.*"}[1m])) by (name, le))'
            : 'http://172.18.196.96:31090/api/v1/query?query=histogram_quantile(0.99, sum(rate(request_duration_seconds_bucket{name="' + ip + '"}[1m])) by (name, le))';
        $.ajax({
            dataType: 'json',
            type: "GET",
            cache: 'false',
            url: url,
            success: function (data) {
                if (data.status === 'success') {
                    let id = tempType === 'pod' ? ('#n' + ip.replace(/\./g, "-")) : '#' + ip;
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
}

$(document).ready(function () {
    getData();

    jsPlumb.ready(function () {
        drawByJsPlumb(g, relation);
    });
    refreshData();
    let refreshDataInterval = setInterval('refreshData()', 3000);

    $('#stop-btn').click(function () {
        clearInterval(refreshDataInterval);
    });
    $('.node').hover(function () {
        let value = $(this).find('.node-auto-hidden-font').text();
        $(this).attr('title',value);
    });

    $('#app-select').fancySelect().on('change.fs', function () {
        $(this).trigger('change.$');
        let app = $('#app-select option:selected').eq(0).val();
        if (tempApp != app) {
            tempApp = app;
            if (tempApp === 'system')
                $('#btn-show').addClass('disabled').attr('disabled', 'disabled');
            else
                $('#btn-show').removeClass('disabled').removeAttr('disabled');
            getData();
            $('#canvas').empty();
            drawByJsPlumb(g, relation);
        }
    });
    $('#type-select').fancySelect().on('change.fs', function () {
        $(this).trigger('change.$');
        let type = $('#type-select option:selected').eq(0).val();
        if (tempType !== type) {
            tempType = type;
            getData();
            $('#canvas').empty();
            drawByJsPlumb(g, relation);
        }
        // alert(document.getElementById('type-select').getElementsByClassName('selected').length);
    });

    $('.options').css('padding', '0');
});