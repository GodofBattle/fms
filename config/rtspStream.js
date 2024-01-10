const Cam = require('onvif').Cam;
const Stream = require('node-rtsp-stream');
const fileLogger = require(`./fileLogger`);

RtspStream = function({ ip, port, id, pw, device_id, name, model_name, funcKill }) {
    let m_ip = ip;
    let m_port = port;
    let m_id = id;
    let m_pw = pw;
    let m_stream_id = device_id;
    let m_name = name;
    let m_model_name = model_name;
    let m_ws_port = 60000;

    let m_uri = '';

    let m_stream = undefined;

    let m_funcKill = funcKill;

    const log_header = `[${m_name}:${m_model_name} - ${m_ip}]`;

    fileLogger.wsCamera.info(`${log_header} RTSP Stream Start`);

    function createCameraUri() {
        return new Promise(function(resolve, reject) {
            try {
                const camera =  new Cam({ hostname: m_ip, username: m_id, password: m_pw, timeout: 10000, autoconnect: false });
                camera.getCapabilities((err, device, xml) => {
                    if(err) {
                        fileLogger.wsCamera.error(`${log_header} ${err.message}`);

                        if(err.message.includes('Network timeout')) {
                            fileLogger.wsCamera.info(`${log_header} Network timeout: 카메라에 접속할 수 없습니다. 카메라 설정 혹은 네트워크 상태를 확인하세요`);
                            return reject({ status: 404, error_msg: `카메라에 접속할 수 없습니다. 카메라 설정 혹은 네트워크 상태를 확인하세요` });
                        } else if(err.message.includes('ETIMEOUT')) {
                            fileLogger.wsCamera.info(`${log_header} ETIMEOUT: 카메라에 접속할 수 없습니다. 카메라 설정 혹은 네트워크 상태를 확인하세요`);
                            return reject({ status: 404, error_msg: '카메라에 접속할 수 없습니다. 카메라 설정 혹은 네트워크 상태를 확인하세요' });
                        } else if(err.message.includes('Sender not authorized')) {
                            fileLogger.wsCamera.info(`${log_header} 계정정보가 틀렸습니다. 카메라의 아이디, 패스워드를 확인하세요`);
                            return reject({ status: 401, error_msg: '계정정보가 틀렸습니다. 카메라의 아이디, 패스워드를 확인하세요' });
                        } else {
                            fileLogger.wsCamera.error(`${log_header} ${err.message}`);
                            return reject({ status: 500, error_msg: err.message });
                        }
                    }

                    if(device) {
                        m_uri = `rtsp://${m_id}:${m_pw}@${m_ip}:${m_port}/`;

                        if(model_name === 'CCTV_IDIS') {
                            m_uri += `trackID=${m_stream_id}`;
                        } else if(model_name === 'CCTV_HT') {
                            m_uri += `profile${m_stream_id}/media.smp`;
                        } else if(model_name === 'NVR_HT') {
                            m_uri += `LiveChannel/${m_stream_id}/media.smp`;
                        } else if(model_name === 'CCTV_ESCA') {
                            m_uri += `channel${m_stream_id}`;
                        } else {
                            this.getStreamUri({ protocol: 'RTSP' }, function(err, stream) {
                                if(err) {
                                    fileLogger.wsCamera.error(`${log_header} ${model_name}은 카메라 서비스가 지원 불가능한 모델입니다: ${err.message}`);
                                    return reject({ status: 401, error_msg: `현재 지원 불가능한 제조사 모델입니다.` });
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
                            });
                        }

                        return resolve(m_uri);
                    }

                    return reject({ status: 500, error_msg: `알 수 없는 에러입니다` })
                });
            } catch(err) {
                fileLogger.wsCamera.error(`${log_header} [createCameraUri() Function Error] ${err.message}`);
                reject({ status: 500, error_msg: err.message });
            }
        });
    };

    function startStreaming({ ws_port }) {
        return new Promise(function(resolve, reject) {
            m_ws_port = ws_port;

            m_stream = new Stream({
                name: m_name,
                streamUrl: m_uri,
                wsPort: m_ws_port,
                ffmpegOptions: {
                    '-r': 30,
                    '-dn': '',
                    '-ignore_unknown': ''
                },
                width: 1920,
                height: 1080
            });

            fileLogger.wsCamera.info(`${log_header} CAMERA Stream Open: ${m_ws_port}`);

            m_stream.wsServer.on('close', function() {
                fileLogger.wsCamera.info(`${log_header} CAMERA Stream Close: ${this.options.port}`);
                m_funcKill(m_uri);
            });

            m_stream.wsServer.on('connection', function(ws, req) {
                const wss = this;
                fileLogger.wsCamera.info(`${log_header} New WebSocket Connection (${wss.clients.size} total) - ${m_uri}`);

                ws.on('close', function() {
                    fileLogger.wsCamera.info(`${log_header} Disconnected WebSocket (${wss.clients.size} total) - ${m_uri}`);
                    if(wss !== undefined && wss.clients.size === 0) {
                        m_stream.stop();
                    }
                });
            });

            m_stream.wsServer.on('error', function(err) {
                fileLogger.wsCamera.info(`${log_header} CAMERA Stream Error: ${err.message}`);
                return reject(err);
            });

            m_stream.on('exitWithError', function(err) {
                fileLogger.wsCamera.info(`${log_header} CAMERA Stream Exit With Error`);

                this.stop();
            });

            return resolve(m_ws_port);
        });
    }

    return {
        CreateCameraUri: async function() { return await createCameraUri(); },
        StartStreaming: async function({ ws_port }) { return await startStreaming({ ws_port }); },
    }
};

module.exports = RtspStream;