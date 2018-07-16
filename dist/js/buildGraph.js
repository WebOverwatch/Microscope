let relation = [], nodes = [];

function getData() {
    $.ajax({
        type: "GET",
        url: "../logs.txt",
        dataType: "text",
        async: false,
        success: function (data) {
            let lines = data.split('\n');
            for (let line of lines) {
                let temp = line.split('\t');
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

            // drawByEcharts(nodes, relation);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(textStatus);
        }
    });
}

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