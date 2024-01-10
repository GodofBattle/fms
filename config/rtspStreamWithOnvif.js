const Cam = require('onvif').Cam;
const Stream = require('node-rtsp-stream');

const fileLogger = require(`./fileLogger`);

RtspStream = function({ ip, id, pw, name, port = 60000, funcKill }) {    
    let m_ip = ip;
    let m_id = id;
    let m_pw = pw;
    let m_name = name;
    let m_port = port;

    let m_uri = '';
    let m_ws_url = '';

    let m_stream = undefined;

    let m_funcKill = funcKill;

    fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] RTSP Stream Start`);

    function createCameraUri() {
        return new Promise(function(resolve, reject) {
            new Cam({ hostname: m_ip, username: m_id, password: m_pw }, function(err) {
                if(err) {
                    fileLogger.wsCamera.error(`[${m_name} - ${m_ip}] ${err.message}`);
    
                    if(err.message.includes('Sender not authorized')) {
                        fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] 계정정보가 틀렸습니다. 카메라의 아이디, 패스워드를 확인하세요`);
                        return reject({ status: 401, error_msg: '계정정보가 틀렸습니다. 카메라의 아이디, 패스워드를 확인하세요' });
                    } else {
                        return reject({ status: 500, error_msg: err.message });
                    }
                }
    
                this.getStreamUri({ protocol: 'RTSP' }, function(err, stream) {
                    if(err) {
                        fileLogger.wsCamera.error(`[${m_name} - ${m_ip}] ${err.message}`);
                        return reject({ error_msg: err.message });
                    }
        
                    if(stream === null) {
                        fileLogger.wsCamera.error(`[${m_name} - ${m_ip}] 카메라에 RTSP 스트림 기능이 없거나, 비활성화 상태입니다`);
                        return reject({ status: 500, error_msg: `카메라에 RTSP 스트림 기능이 없거나, 비활성화 상태입니다` });
                    }
        
                    if(stream.uri === undefined) {
                        fileLogger.wsCamera.error(`[${m_name} - ${m_ip}] 카메라에 RTSP 스트림 기능이 없거나, 비활성화 상태입니다`);
                        return reject({ status: 500, error_msg: `카메라에 RTSP 스트림 기능이 없거나, 비활성화 상태입니다` });
                    }
        
                    m_uri = stream.uri.replace('://', `://${m_id}:${m_pw}@`);
        
                    return resolve(m_uri);
                });
            });
        });
    }

    function startStreaming({ port }) {
        return new Promise(function(resolve, reject) {
            try {
                m_port = port;

                m_stream = new Stream({
                    name: m_name,
                    streamUrl: m_uri,
                    wsPort: m_port,
                    ffmpegOptions: {
                        // '-stats': '',
                        '-r': 30,
                        '-dn': '',
                        '-ignore_unknown': ''
                    },
                    width: 1920,
                    height: 1080
                });

                fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] CAMERA Stream Open: ${m_port}`);

                m_stream.wsServer.on('close', function() {
                    fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] CAMERA Stream Close: ${this.options.port}`);
                    m_funcKill(m_uri);
                });

                m_stream.wsServer.on('connection', function(ws, req) {
                    const wss = this;
                    fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] New WebSocket Connection (${wss.clients.size} total) - ${m_uri}`);

                    ws.on('close', function() {
                        fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] Disconnected WebSocket (${wss.clients.size} total) - ${m_uri}`);
                        if(wss !== undefined && wss.clients.size === 0) {
                            m_stream.stop();
                        }
                    });
                });

                m_stream.wsServer.on('error', function(err) {
                    fileLogger.wsCamera.info(`[${m_name} - ${m_ip}] CAMERA Stream Error: ${err.message}`);
                    reject(err);
                });

                resolve(m_port);
            } catch (err) {
                reject(err);
            }
        });
    }

    return {
        CreateCameraUri: async function() { return await createCameraUri(); },
        StartStreaming: async function({ port }) { return await startStreaming({ port }); },
        getIp: function() { return  m_ip; },
        getId: function() { return m_id; },
        getPort: function() { return m_port; },
        getUri: function() { return m_uri; },
        getWsUrl: function() { return m_ws_url; },
        getStream: function() { return m_stream; }
    };
}

module.exports = RtspStream;