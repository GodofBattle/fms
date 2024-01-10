/**
 * by shkoh 20200513: Web서버에서 사용할 Web Socket 정의
 */
const fileLogger = require('./fileLogger');
const WebSocket = require('ws');

let g_web_socket_server = undefined;

/**
 * by shkoh 20200513: node.js에서 생성한 WEB Server를 통하여  WEB SOCKET과 함께 연결
 * 
 * @param {Server} server node.js에서 생성한 HTTP / HTTPS Server
 */
const ubiGuardWebSocketOpen = (server) => {
    const websocket_start_msg = `[UbiGuard FMS 5.6] WebSocket Start`;
    console.info(websocket_start_msg);
    fileLogger.process.info(websocket_start_msg);
    fileLogger.ws.info(websocket_start_msg);

    const heartBeat = function() { this.isAlive = true; }

    g_web_socket_server = new WebSocket.Server({ server });
    g_web_socket_server.on('connection', function connection(ws, req) {
        ws.isAlive = true;

        const remote_ip_port = `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;

        // by shkoh 20200513: WebSocket Client HeartBeat
        // by shkoh 20200513: interval에서 해당 WebSocket Client에 ping을 보낸 후, Client들로부터 pong을 받아서 지속적으로 연결이 되어 있음을 체크
        ws.on('pong', heartBeat);

        /**
         * by shkoh 20200513
         * WebSocket의 메시지는 현재 4종류로 분류하여 사용
         * 1. command === 'login': 클라이언트 및 application 서버에서 접속한 계정 정보 지정을 위해서 사용
         * 2. command === 'update': 웹서버에서 DB 정보가 변경되었음을 클라이언트로 전달하는데 사용
         * 3. command === 'notify': application 서버에서 그룹/설비/센서 등의 상태가 변경되었음을 클라이언트로 전달하는데 사용
         * 4. command === 'event': application 서버에서 설비/센서의 장애 알람이 발생하였음을 클라이언트로 전달하는데 사용
         */
        ws.on('message', (msg) => {
            fileLogger.ws.info(msg);

            try {
                const websocket_msg = JSON.parse(msg);

                // by shkoh 20200513: command === 'login'인 경우에 접속한 web socket의 연결 type을 지정
                if(websocket_msg.command === 'login') {
                    ws.user = websocket_msg.user_id;
                    // by shkoh 20200513: type === 'system'인 경우 application 서버와 연결
                    // by shkoh 20200513: type === 'client'인 경우 web browser로부터 연결
                    ws.connect_type = websocket_msg.type;
                    return;
                }
    
                ubiGuardWebSocketSendData(websocket_msg);
            } catch(error) {
                fileLogger.ws.error(`[UbiGuard FMS 5.6] WebSocket Message Error: ${ws._socket.remoteAddress}:${ws._socket.remotePort}`);
                fileLogger.ws.error(`${error}`);
            }
            
        });

        ws.on('close', () => {
            fileLogger.ws.info(`[Client Closed(${this.clients.size + 1} -> ${this.clients.size})] ${remote_ip_port}`);
        });

        fileLogger.ws.info(`[Client Connecting(${this.clients.size - 1} -> ${this.clients.size})] ${remote_ip_port}`);
    });

    g_web_socket_server.on('close', function() {
        fileLogger.ws.info(`[UbiGuard FMS 5.6] WebSocket Server Closed(${this.clients.size + 1} -> ${this.clients.size})] ${remote_ip_port}`);

        clearInterval(g_web_socket_server.interval);
        clearInterval(g_web_socket_server.interval_server_time);
    });

    g_web_socket_server.on('error', function(error) {
        fileLogger.ws.error(`[UbiGuard FMS 5.6] WebSocket Server Error: ${error}`);
    });

    g_web_socket_server.interval = setInterval(() => {
        g_web_socket_server.clients.forEach((ws) => {
            if(ws.isAlive === false) {
                fileLogger.ws.info(`[Client Terminate(${ws._socket.remoteAddress}:${ws._socket.remotePort})]`);
                return ws.terminate();
            }

            ws.isAlive = false;

            // by shkoh 20200513: WebSocket 서버는 주기적으로(30초로 설정) 각각 연결된 WebSocket Client들에 ping을 전달
            // by shkoh 20200513: WebSocket 클라이언트는 ping 신호를 받으면 pong 이벤트가 발생하고 pong 이벤트를 받은 서버는 클라이언트가 정상임을 확인하고 isAlive를 true로 갱신함
            try {
                ws.ping(null, false, null);
            } catch(err) {
                fileLogger.ws.error(`[UbiGuard FMS 5.6] Send a Ping Error(${ws._socket.remoteAddress}:${ws._socket.remotePort})`);
                fileLogger.ws.error(err);
            }
        });
    }, 30000);

    // by shkoh 20200513: 1초마다 서버의 시간을 클라이언트로 전달함
    g_web_socket_server.interval_server_time = setInterval(() => {
        g_web_socket_server.clients.forEach((ws) => {
            if(ws.isAlive === false) return;

            // by shkoh 20200513: WebSocket 서버는 클라이언트에게 1초마다 서버 시간을 전달
            // by shkoh 20200513: 단, App Server에는 전달할 필요 없음
            try {
                if(ws.connect_type === 'system' && ws.user === 'uipd') return;

                ws.send(JSON.stringify({
                    command: 'servertime',
                    date: new Date()
                }));
            } catch(error) {
                fileLogger.ws.error(`[UbiGuard FMS 5.0] Send a Server-time Error(${ws._socket.remoteAddress}:${ws._socket.remotePort})`);
                fileLogger.ws.error(error);
            }
        });
    }, 1000);
}

/**
 * 접속되어 있는 클라이언트에게 message 전달
 * 
 * @param {JSON} message WebSocket을 통해 클라이언트로 전달할 메시지
 */
const ubiGuardWebSocketSendData = (message) => {
    g_web_socket_server.clients.forEach((ws) => {
        if(ws.isAlive === false) return;

        try {
            // by shkoh 20210609: App Server에 대해서는 특별한 메시지를 전달
            if(ws.connect_type === 'system' && ws.user === 'uipd') {
                // by shkoh 20210609: 항온항습기 제어 명령일 경우에는 제어메시지를 전달
                if(message.command === 'hvac-on' || message.command === 'hvac-off') {
                    fileLogger.ws.info(JSON.stringify(message));
                    ws.send(JSON.stringify(message));
                } else if(message.command === 'lamp-on' || message.command === 'lamp-off') {
                    // by shkoh 20220311: 조명 제어 명령일 경우에 제어 메시지 전달
                    fileLogger.ws.info(JSON.stringify(message));
                    ws.send(JSON.stringify(message));
                }
                return;
            }

            if(message.command === 'event' && message.dst_user !== ws.user) return;

            ws.send(JSON.stringify(message));
        } catch(error) {
            fileLogger.ws.error(`[UbiGuard FMS 5.0] Send a Message Error(${ws._socket.remoteAddress}:${ws._socket.remotePort})`);
            fileLogger.ws.error(error);
        }
    });
}

module.exports = {
    ubiGuardWebSocketOpen,
    ubiGuardWebSocketSendData
}