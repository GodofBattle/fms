/**
 * by shkoh 20211209
 * POPUP 카메라 뷰어에서 사용할 데이터 Router 구현
 * 
 * /api/popup/camera
 */
const express = require('express');
const router = express.Router();

const exec = require('child_process').execSync;

const RtspStreamOnvif = require('../../config/rtspStreamWithOnvif');
const RtspStream = require('../../config/rtspStream');
const fileLogger = require(`../../config/fileLogger`);
let g_cameras = [];

const db_cn_equipment = require(`../../database/cn_equipment`);
const { response } = require('express');

function availablePort(port) {
    try {
        const cmd = `lsof -i tcp:${port} | cat`;
        const result = exec(cmd, { maxBuffer: Infinity, encoding: 'utf8', timeout: 1000, killSignal: 'SIGTERM' });
    
        return result.length === 0;
    } catch(err) {
        console.error(err);
        return false;
    }
}

function killCamera(uri) {
    const index = g_cameras.findIndex((c) => c.uri === uri);
    g_cameras.splice(index, 1);
}

router.get(`/viewer/rtsp/:equipId`, async (req, res, next) => {
    const { equipId } = req.params;

    const results = await db_cn_equipment.getInfo(equipId);
    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        const { ip, port, device_id, community, name, equip_code, model_name } = results;
        const id = community.split(':')[0];
        const pw = community.split(':')[1];

        if(id === undefined || id.length === 0) {
            return res.status(401).send({ msg: `설비설정 >> Community 항목에서 id를 입력하세요.\nid:password 형식입니다.` });
        } else if(pw === undefined || pw.length === 0) {
            return res.status(401).send({ msg: `설비설정 >> Community 항목에서 password를 입력하세요.\nid:password 형식입니다.` });
        }

        if(device_id === 0 || device_id > 4) {
            return res.status(401).send({ msg: `device_id이 ${device_id}입니다.\ndevice_id의 값은 카메라 스트림 채널을 의미합니다. 1~4 채널 사이의 값으로 지정해 주세요` });
        }

        if(equip_code !== 'E0009') {
            return res.status(401).send({ msg: `지정 설비는 카메라로 등록되지 않았습니다` });
        }

        try {
            // by shkoh 20220513: Step1. RTSP 카메라 Object 생성
            let camera = new RtspStream({ ip, port, id, pw, device_id, name, model_name, funcKill: killCamera });

            // by shkoh 20220513: Step2. rtsp url 주소 생성
            let uri = await camera.CreateCameraUri();

            // by shkoh 20220513: Step3. WebSocket용 포트 활성화 여부 판단
            let start_port = 60000;
            for(; start_port < 60015; start_port++) {
                if(availablePort(start_port)) break;
            }

            // by shkoh 20220513: Step3.1 port 60000에서부터 16개의 스트림이 열렸을 경우에, 더 이상 수행하지 않는다
            if(start_port === 60015) {
                fileLogger.wsCamera.error(`카메라 영상 스트림의 동시 생성은 최대 15대 입니다. 기존에 열림 카메라 스트림을 종료하세요.`);
                return res.status(500).send({ msg: `카메라 영상 스트림의 동시 생성은 최대 15대 입니다. 기존에 열린 카메라 스트림을 종료하세요.` });
            }

            // by shkoh 20220513: Step4. 기존에 WebSocet이 활성화되어 있다면, WebSocket 주소만을 전달하고,
            // by shkoh 20220513: Step4. 비활성화 되어 있다면, WebSocket 서버를 생성한 후에 해당 주소를 전달함
            let is_create_ws = true;
            for(const c of g_cameras) {
                if(c.uri === uri) {
                    is_create_ws = false;
                    start_port = c.port;
                    break;
                }
            }

            if(is_create_ws) {
                start_port = await camera.StartStreaming({ ws_port: start_port });
                g_cameras.push({ uri: uri, port: start_port });
            }

            res.send({ ws: `ws://${req.hostname}:${start_port}` });
        } catch(err) {
            fileLogger.wsCamera.error(err);
            res.status(err.status).send({ msg: err.error_msg });
        }
        res.end();
    }
});

router.get(`/viewer/onvif/:equipId`, async (req, res, next) => {
    const { equipId } = req.params;

    const results = await db_cn_equipment.getInfo(equipId);
    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        const { ip, community, name } = results;
        const id = community.split(':')[0];
        const pw = community.split(':')[1];

        if(id === undefined || id.length === 0) {
            return res.status(401).send({ msg: `설비설정 >> Community 항목에서 id를 입력하세요.\nid:password 형식입니다.` });
        } else if(pw === undefined || pw.length === 0) {
            return res.status(401).send({ msg: `설비설정 >> Community 항목에서 password를 입력하세요.\nid:password 형식입니다.` });
        }

        try {
            // by shkoh 20211214: Step1. 해당 ip, id, pw를 통해서 URI를 생성
            let camera = new RtspStreamOnvif({ ip, id, pw, name, funcKill: killCamera });
            let uri = await camera.CreateCameraUri();

            // by shkoh 20211214: Step2. 60000부터 ws 소켓 활성화 여부 판단
            let start_port = 60000;
            for(; start_port < 60015; start_port++) {
                if(availablePort(start_port)) break;
            }

            // by shkoh 20211214: Step2.1 60000에서부터 16개의 스트림이 열렸다면, 더 이상 수행하지 않는다.
            if(start_port === 60015) {
                fileLogger.wsCamera.error(`카메라 영상 스트림의 동시 생성은 최대 15대입니다. 기존에 열린 카메라 스트림을 종료하세요.`);
                return res.status(500).send({ msg: `카메라 영상 스트림의 동시 생성은 최대 15대입니다. 기존에 열린 카메라 스트림을 종료하세요.` });
            }
            
            // by shkoh 20211214: Step3. 기존에 ws이 활성화되어 있다면 ws 주소만 전달, 비활성화 되어 있다면 ws 서버를 생성 후 주소 전달
            let is_create_ws = true;
            for(const c of g_cameras) {
                if(c.uri === uri) {
                    is_create_ws = false;
                    start_port = c.port;
                    break;
                }
            }

            if(is_create_ws) {
                start_port = await camera.StartStreaming({ port: start_port });
                g_cameras.push({ uri: uri, port: start_port });
            }
            res.send({ ws: `ws://${req.hostname}:${start_port}` });
        } catch(err) {
            fileLogger.wsCamera.error(err);
            res.status(err.status).send({ msg: err.error_msg });
        }
    }
});

module.exports = router;