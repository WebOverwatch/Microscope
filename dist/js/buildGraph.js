const STR_FRONT_END = 'front-end';
let relation = [], nodes = [], nodesIP = [], podMetris = {}, tempType = 'pod', tempApp = 'system', causeInfoClicked = false, nsigma = 3, abnormalCount = 10;
// Create a new directed graph
let g;

let sum = function(x, y){ return x + y;};　　//求和函数
let square = function(x){ return x * x;};　　//数组中每个元素求它的平方

function getData() {
    // let range = getLogTimeRange();
    // console.log(range.start + ', ' + range.end);
    // 使用固定时间进行测试
    let range = {
        start: '2018-09-06T04:31:17.313Z',
        end: '2018-09-06T04:36:17.313Z',
    };
    let data = {
        "from": 0,
        "size": 8000,
        "query": {
            "range": {
                "@timestamp": {
                    "lte": range.end,
                    "gte": range.start,
                    "time_zone": "+08:00"
                }
            }
        }
    };

    $.ajax({
        type: "POST",
        url: "http://172.18.196.1:9200/filebeat-6.3.2-*/doc/_search?filter_path=hits.hits._source.message",
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

                    if (temp[3] === undefined)
                        continue;
                    let trans = temp[3].split('->');
                    if (trans[1] === undefined)
                        continue;
                    let source = trans[0].split(':')[0], target = trans[1].split(':')[0];
                    // console.log(source + ": " + target);

                    if (source === '172.20.1.164')
                        continue;
                    // 存储关系
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
                        } // else if
                        // $('#main').append('<p>' + line + '</p>');
                    }
                } // if
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
            // console.log(pod_name + ': ' + (pod_name in performance_map));
            if (pod_name in performance_map) {
                $('#modal-pod-performance-body').empty();
                $('#modal-pod-performance').modal();
                if ($('#modal-pod-performance-body').children().length === 0) {
                    $('#modal-pod-performance-body').append(
                        '<iframe src="http://172.18.196.1:36970/dashboard-solo/db/sock-shop?from=now-10m&to=now&panelId=' + performance_map[pod_name][0] + '" width="100%" height="200" frameborder="0" id="frame" name="frame"></iframe>\n' +
                        '<iframe src="http://172.18.196.1:36970/dashboard-solo/db/sock-shop?from=now-10m&to=now&panelId=' + performance_map[pod_name][1] + '" width="100%" height="200" frameborder="0" id="frame" name="frame"></iframe>');
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
    d.setMinutes(d.getMinutes() - 5);
    // d.setSeconds(d.getSeconds() - 50);
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
        let url = tempType === 'pod' ? 'http://172.18.196.1:31090/api/v1/query?query=sum(rate(request_duration_seconds_sum{instance=~"' + ip + ':.*"}[1m])) / sum(rate(request_duration_seconds_count{instance=~"' + ip + ':.*"}[1m]))'
            : 'http://172.18.196.1:31090/api/v1/query?query=sum(rate(request_duration_seconds_sum{name="' + ip + '"}[1m])) / sum(rate(request_duration_seconds_count{name="' + ip + '"}[1m]))';
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
                        let metrics = data.data.result[0].value[1] * 1000;
                        $(id).find('.node-big-font').eq(0).html(metrics.toFixed(2));
                        if (tempApp !== 'system' && tempType === 'pod') {
                            let history = podMetris[ip];

                            if (history !== undefined) {
                                let datas = history.datas;
                                let mean = datas.reduce(sum) / datas.length;
                                let deviations = datas.map(function (x) {
                                    return x - mean;
                                });
                                let std = Math.sqrt(deviations.map(square).reduce(sum) / (datas.length));
                                // console.log(ip + ", " + (mean - nsigma * std) + ", " + (mean + nsigma * std) + ", " + metrics + ", " + history.abnormalTimes);
                                if (metrics < mean - nsigma * std || metrics > mean + nsigma * std) {
                                    if (history.abnormalTimes + 1 < abnormalCount) {
                                        history.abnormalTimes += 1;
                                        // console.log(ip + ", " + (mean - nsigma * std) + ", " + (mean + nsigma * std) + ", " + metrics + ", " + history.abnormalTimes);
                                    }
                                    else {
                                        // history.abnormalTimes += 1;
                                        // console.log('red: ' + ip + ", " + (mean - nsigma * std) + ", " + (mean + nsigma * std) + ", " + metrics + ", " + history.abnormalTimes);
                                        $(id).css('background-color', '#FF2055');
                                        $(id).css('color', '#ebebeb');
                                    }
                                }
                                else {
                                    history.abnormalTimes = 0;
                                    if ($(id).css('background-color') === 'rgb(255, 32, 85)') {
                                        // console.log(ip + ", " + (mean - nsigma * std) + ", " + (mean + nsigma * std) + ", " + metrics + ", " + $(id).css('background-color'));
                                        $(id).css('background-color', '#FFFFFF');
                                        $(id).css('color', '#444');
                                    }
                                    datas.splice(0, 1);
                                    datas.push(metrics);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}

function getLatancy() {
    // console.log('getLatancy');
    if (tempType === 'pod') {
        podMetris = {};
        for (let ip of nodesIP) {
            let d = new Date();
            let end = d.getTime();
            d.setMinutes(d.getMinutes() - 2);
            let url = 'http://172.18.196.1:31090/api/v1/query_range?query=sum(rate(request_duration_seconds_sum%7Binstance=~"' + ip
                + ':.*"%7D[1m]))/sum(rate(request_duration_seconds_count%7Binstance=~"' + ip + ':.*"%7D[1m]))&start=' + d.getTime()/1000 + '&end=' + end/1000 +
                '&step=1s';

            $.ajax({
                dataType: 'json',
                type: "GET",
                cache: 'false',
                url: url,
                // async: false,
                success: function (data) {
                    if (data.status === 'success' && data.data.result.length !== 0) {
                        // console.log(ip + ": " + pod_map[ip]);
                        let datas = [];
                        for (let item of data.data.result[0].values) {
                            datas.push(item[1] * 1000)
                        }
                        let metrics = {};
                        metrics.datas = datas;
                        metrics.abnormalTimes = 0;
                        // let statistic = {};
                        // statistic.mean = datas.reduce(sum)/datas.length;
                        // statistic.len = datas.length;
                        // let deviations = datas.map(function(x) { return x - statistic.mean; });
                        // statistic.variance = deviations.map(square).reduce(sum)/(statistic.len);
                        podMetris[ip] = metrics;
                    }
                }
            });
        }
        // console.log(JSON.stringify(podMetris));
    }
}

$(document).ready(function () {
    getData();

    jsPlumb.ready(function () {
        drawByJsPlumb(g, relation);
    });
    // 移除遮罩
    $('body').mLoading("hide");//隐藏loading组件
    refreshData();
    let refreshDataInterval = setInterval('refreshData()', 3000);

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
            else {
                getLatancy();
                $('#btn-show').removeClass('disabled').removeAttr('disabled');
            }
            $('body').mLoading({
                text:"加载中...",//加载文字，默认值：
                html:false,//设置加载内容是否是html格式，默认值是false
                mask:true//是否显示遮罩效果，默认显示
            });
            getData();
            $('#canvas').empty();
            drawByJsPlumb(g, relation);
            // 移除遮罩
            $('body').mLoading("hide");//隐藏loading组件
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

    $('#score-table').DataTable({
        data: format_score(),
        columns: [
            { "title": "序号", "data": null },
            { "title": "pod名", "data": "pod" },
            { "title": "根因推断得分", "data": "score" },
        ],
        columnDefs:[
            { "orderable": false, "targets": [0,1] },
        ],
        rowCallback: function( row, data, index ) {
            $('td:eq(0)', row).html(index+1);
        },
        "oLanguage": {
            "sLengthMenu": "每页显示 _MENU_ 条记录",
            "sZeroRecords": "对不起，查询不到相关数据！",
            "sEmptyTable": "表中无数据存在！",
            "sInfo": "当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录",
            "sInfoFiltered": "数据表中共为 _MAX_ 条记录",
            "sSearch": "搜索",
            "oPaginate": {
                "sFirst": "首页",
                "sPrevious": "上一页",
                "sNext": "下一页",
                "sLast": "末页"
            }
        }, //多语言配置
        "dom" : "tirp",
        "order": [[ 2, "desc" ]]
    });

    $('#abnormal-table').DataTable({
        data: format_abnormal_list(),
        "bScrollCollapse" : true,
        iDisplayLength: 15,
        columns: [
            { "title": "序号", "data": null },
            { "title": "pod名", "data": "pod" },
        ],
        columnDefs:[
            { "orderable": false, "targets": [0,1] },
        ],
        rowCallback: function( row, data, index ) {
            $('td:eq(0)', row).html(index+1);
        },
        "oLanguage": {
            "sLengthMenu": "每页显示 _MENU_ 条记录",
            "sZeroRecords": "对不起，查询不到相关数据！",
            "sEmptyTable": "表中无数据存在！",
            "sInfo": "当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录",
            "sInfoFiltered": "数据表中共为 _MAX_ 条记录",
            "sSearch": "搜索",
            "oPaginate": {
                "sFirst": "首页",
                "sPrevious": "上一页",
                "sNext": "下一页",
                "sLast": "末页"
            }
        }, //多语言配置
        "dom" : "tirp",
    });


    $('#btn-cause-info').click(function () {
		$('body').mLoading({
			text:"加载中...",//加载文字，默认值：
			html:false,//设置加载内容是否是html格式，默认值是false
			mask:true//是否显示遮罩效果，默认显示
		});
        // candiates: {ip: {ip, pod_name}, ...}
        // trigger_pod: [ip, ...]
        let candidates = {}, trigger_pod = [];
        $('#canvas').find("div").each(function () {
            if ($(this).css('background-color') === 'rgb(255, 32, 85)') {
                let temp = {};
                let pod_name = $(this).find('p:eq(0)').html(), ip = $(this).find('.node-medium-font:eq(0)').html();
                temp.pod = pod_name;
                temp.ip = ip;
                // 由front-end触发RCA算法
                if (pod_name.indexOf(STR_FRONT_END) >= 0) {
                    trigger_pod.push(ip);
                }
                else {
                    candidates[ip] = temp;
                }
            }
        });
        console.log(JSON.stringify(candidates));
        if (trigger_pod.length === 0) {
            // 没有front-end异常，未触发RCA
            console.log("没有front-end异常，未触发RCA");
        }
        else {
            let corr_matrix = [], pod_ip = [], candidates_len = 0;
            for (root_ip of trigger_pod) {
                // corr_matrix.push(podMetris[root_ip].datas);
                pod_ip.push(root_ip);
                for (ip in candidates) {
                    // 寻找与front-end关联的异常节点
                    let id = 'n' + ip.replace(/\./g, "-"), root_id = 'n' + root_ip.replace(/\./g, "-");
                    if (relation[root_id].indexOf(id) !== -1) {
                        // 将未加入的节点加入
                        if (pod_ip.indexOf(ip) === -1) {
							// corr_matrix.push(podMetris[ip].datas);
							pod_ip.push(ip);
                        }
                    }
                    candidates_len ++;
                }
				console.log(root_ip + ', ' + pod_ip);
            }
            if (trigger_pod.length === pod_ip.length) {
                // 两个list长度一样，没有找到关联的异常节点
                console.log("没有找到关联的异常节点，未触发RCA");
            }
            else {
                // 计算score
                let d = new Date();
                let end = d.getTime();
                d.setMinutes(d.getMinutes() - 2);
                for (let ip of pod_ip) {
                    let url = 'http://172.18.196.1:31090/api/v1/query_range?query=sum(rate(request_duration_seconds_sum%7Binstance=~"' + ip
                        + ':.*"%7D[1m]))/sum(rate(request_duration_seconds_count%7Binstance=~"' + ip + ':.*"%7D[1m]))&start=' + d.getTime()/1000 + '&end=' + end/1000 +
                        '&step=1s';

                    $.ajax({
                        dataType: 'json',
                        type: "GET",
                        cache: 'false',
                        url: url,
                        async: false,
                        success: function (data) {
                            if (data.status === 'success' && data.data.result.length !== 0) {
                                // console.log(ip + ": " + pod_map[ip]);
                                let datas = [];
                                for (let item of data.data.result[0].values) {
                                    datas.push(item[1] * 1000)
                                }
                                corr_matrix.push(datas);
                            }
                        }
                    });
                }
                score = pcorr(corr_matrix);
                console.log(pod_ip);
                // console.log(corr_matrix);
                console.log(score);
                pod_score = {};
                // 取出异常pod的得分
                for (root_ip of trigger_pod) {
                    for (let i = 0; i < pod_ip.length; i++) {
                        if (pod_map[pod_ip[i]].indexOf(STR_FRONT_END) === -1) {
                            // 取出非front-end成绩
                            if (pod_score[name] === undefined) {
                                // 存储pod成绩
                                let pod_score = {
                                    name: pod_map[pod_ip[i]],
                                    score: score[pod_ip.indexOf(root_ip)][i],
                                };
                                pod_score[name] = pod_score;
                                console.log(root_ip + ', ' + i + ': ' + score[pod_ip.indexOf(root_ip)][i] + ', ' + pod_score[name]);
                            }
                            else if (pod_score[name].score < score[pod_ip.indexOf(root_ip)][i]) {
                                // 更新pod成绩
                                pod_score[name].score = score[pod_ip.indexOf(root_ip)][i];
                            }
                        } // if
                    } // for (i)
                } // for (root_ip)
                console.log(pod_score);
            } // else
        } // else

        $('body').mLoading("hide");//隐藏loading组件
        if (!causeInfoClicked) {
            causeInfoClicked = true;
            $('#modal-cause-info').modal();
            // for (let key in cause_info_score) {
            //     // console.log(key);
            //     $('#div-cause-info-graph').append(
            //         '<iframe src="http://172.18.196.1:36970/dashboard-solo/db/sock-shop?from=now-10m&to=now&panelId=' + performance_map[key][1] + '" width="100%" height="200" frameborder="0" id="frame" name="frame"></iframe>'
            //     );
            // }
        }
        else {
            $('#modal-cause-info').modal();
        }
    });

});