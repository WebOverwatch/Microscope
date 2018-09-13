let service_map = {"front-end": "10.68.99.90", "orders-db": "10.68.228.154", "carts-db": "10.68.225.95", "kubernetes": "10.68.0.1", "carts": "10.68.180.184", "payment": "10.68.229.92", "kube-state-metrics": "10.68.66.231", "rabbitmq": "10.68.115.196", "kube-dns": "10.68.0.2", "queue-master": "10.68.190.174", "catalogue": "10.68.110.81", "shipping": "10.68.244.215", "user-db": "10.68.186.100", "grafana": "10.68.167.2", "orders": "10.68.102.185", "catalogue-db": "10.68.166.226", "user": "10.68.157.9"};
let pod_map = {"172.20.5.97": "catalogue-7cbbff5968-xfv2f", "172.20.5.96": "carts-db-5c777556b4-j5frl", "192.168.199.162": "kube-flannel-ds-pwrs5", "172.20.2.104": "kube-dns-c7d85897f-jf4qb", "192.168.199.161": "kube-flannel-ds-ptjqk", "172.20.5.99": "payment-c978c557-mkc5z", "172.20.5.98": "user-7f4df8d946-pkk45", "192.168.199.164": "kube-flannel-ds-572gv", "192.168.199.165": "kube-flannel-ds-w5cmx", "172.20.0.12": "node-directory-size-metrics-qvn2m", "172.20.6.88": "kube-state-metrics-deployment-6bb6756479-lcw6f", "172.20.3.91": "front-end-f7454fd74-qp959", "172.20.3.90": "orders-6dfd54859f-h9jcr", "172.20.2.105": "front-end-f7454fd74-wwdqt", "172.20.2.91": "grafana-import-dashboards-bwskq", "172.20.3.79": "orders-db-76b8d88c4d-tg7wg", "172.20.3.78": "payment-c978c557-lpc4v", "172.20.3.80": "catalogue-7cbbff5968-lmx5q", "172.20.2.103": "node-directory-size-metrics-mzlnc", "172.20.2.102": "grafana-core-6d9d669584-2spql", "192.168.199.163": "kube-flannel-ds-rcqg7", "172.20.3.88": "node-directory-size-metrics-hfgq2", "172.20.3.89": "carts-7fcb9585d9-vjdwp", "172.20.3.84": "user-db-5655864964-zdrtb", "172.20.3.85": "carts-db-5c777556b4-snzsv", "172.20.3.86": "queue-master-78c6fb9657-vkmq7", "172.20.3.87": "shipping-7958c5889b-rxl4h", "172.20.6.90": "node-directory-size-metrics-2cbpb", "172.20.3.81": "user-7f4df8d946-h7j2x", "172.20.3.82": "rabbitmq-6c94fc44b7-2jk8t", "172.20.3.83": "catalogue-db-6795984755-ptznb", "172.20.5.108": "catalogue-db-6795984755-s2572", "172.20.5.109": "load-test-8b574484f-pfjmh", "172.20.5.106": "orders-6dfd54859f-qlb8n", "172.20.5.107": "queue-master-78c6fb9657-28wzf", "172.20.5.104": "carts-7fcb9585d9-hppzb", "172.20.5.105": "node-directory-size-metrics-dkchp", "172.20.5.102": "orders-db-76b8d88c4d-52h8g", "172.20.5.103": "shipping-7958c5889b-skbw5", "172.20.5.100": "user-db-5655864964-f7md9", "172.20.5.101": "rabbitmq-6c94fc44b7-ftqw9"};
let service_name = {"front-end": ["172.20.2.105", "172.20.3.91"], "kube-scheduler": [], "carts-db": ["172.20.3.85", "172.20.5.96"], "shipping": ["172.20.3.87", "172.20.5.103"], "kubernetes": ["192.168.199.161"], "catalogue": ["172.20.3.80", "172.20.5.97"], "carts": ["172.20.3.89", "172.20.5.104"], "payment": ["172.20.3.78", "172.20.5.99"], "kube-state-metrics": ["172.20.6.88"], "rabbitmq": ["172.20.3.82", "172.20.5.101"], "grafana": ["172.20.2.102"], "queue-master": ["172.20.3.86", "172.20.5.107"], "prometheus": [], "kube-controller-manager": [], "orders": ["172.20.3.90", "172.20.5.106"], "user-db": ["172.20.3.84", "172.20.5.100"], "orders-db": ["172.20.3.79", "172.20.5.102"], "kube-dns": ["172.20.2.104"], "catalogue-db": ["172.20.3.83", "172.20.5.108"], "user": ["172.20.3.81", "172.20.5.98"]};
let performance_map = {'user-7f4df8d946-h7j2x': [27, 28], 'catalogue-7cbbff5968-lmx5q': [3, 4], 'carts-7fcb9585d9-vjdwp': [29, 2], 'carts-7fcb9585d9-hppzb': [1, 16], 'payment-c978c557-lpc4v': [23, 24], 'shipping-7958c5889b-skbw5': [25, 26], 'payment-c978c557-mkc5z': [9, 10], 'shipping-7958c5889b-rxl4h': [11, 12], 'orders-6dfd54859f-qlb8n': [7, 8], 'front-end-f7454fd74-qp959': [5, 6], 'catalogue-7cbbff5968-xfv2f': [17, 18], 'orders-6dfd54859f-h9jcr': [21, 22], 'user-7f4df8d946-pkk45': [13, 14], 'front-end-f7454fd74-wwdqt': [19, 20]};
let cause_info_score = {"catalogue-7cbbff5968-8wsb6": 0.8464614512215852, "orders-6dfd54859f-qqtml": 0.8257055254787296, "payment-c978c557-ftvwz": 0.7079079925094472};
let abnormal_list =  ['user-557f5b9cbb-jfnqw', 'payment-86965dc77-j6hvz', 'catalogue-79786b458d-bbvmw', 'orders-8688f5cbc-862qm', 'catalogue-79786b458d-8wsb6', 'user-557f5b9cbb-nbq8x', 'orders-8688f5cbc-7npgc', 'carts-b95d68765-2mgj2', 'payment-86965dc77-hbgsm', 'carts-b95d68765-gl4b8', 'catalogue-79786b458d-bpbsl', 'shipping-65bdcd4c4d-6dqnf', 'shipping-65bdcd4c4d-zqtc5', 'carts-b95d68765-ff5fm', 'front-end-f7454fd74-bk6c8', 'front-end-f7454fd74-zl2xd'];

let ip_service = {};

function converse() {
    for (let key in service_name) {
        for (let ip of service_name[key]) {
            ip_service[ip] = key;
        }
    }
}

function format_score() {
    let data = [];
    for (let key in cause_info_score) {
        let line = {};
        line.pod = key, line.score = cause_info_score[key].toFixed(4);
        data.push(line);
    }
    return data;
}

function format_abnormal_list() {
    let data = [];
    for (let pod of abnormal_list) {
        let line = {};
        line.pod = pod;
        data.push(line);
    }
    return data;
}

/*
service:
    ["front-end", "user", "catalogue", "front-end", "orders"]

pod_ip:
    ["172.20.3.38", "172.20.3.41", "172.20.3.37", "172.20.12.37", "172.20.13.57"]
score:
0
(5) [1, 0.43915114401417565, 0.9587254785751915, 0.9301033008156679, 0.7469058635298083]
1
(5) [0.43915114401417565, 1, 0.4660704304345772, 0.5496022226749588, 0.8455583730560895]
2
(5) [0.9587254785751915, 0.4660704304345772, 1, 0.972838194976174, 0.7781639731568922]
3
(5) [0.9301033008156679, 0.5496022226749588, 0.972838194976174, 1, 0.8430367589208907]
4
(5) [0.7469058635298083, 0.8455583730560895, 0.7781639731568922, 0.8430367589208907, 1]

    [0.43915114401417565, 0.9587254785751915,  0.7469058635298083]
    [0.5496022226749588,  0.972838194976174,   0.8430367589208907]
 */