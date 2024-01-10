/**
 * by shkoh 20200520
 * Popup 로그 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/popup/set/...
 */
const createError = require('http-errors');
const express = require(`express`);
const router = express.Router();

const path = require(`path`);
const fs = require(`fs`);

const ws = require('../../config/ws');
const group_image_uploader = require(`../../config/fileUpload`).single(`groupimage`);
const asset_image_uploader = require(`../../config/fileUploadAsset`).single(`assetimage`);

const db_procedure = require('../../database/procedure');
const db_tree = require(`../../database/tree`);
const db_cn_group = require(`../../database/cn_group`);
const db_cn_equipment = require(`../../database/cn_equipment`);
const db_cn_equip_add_info = require(`../../database/cn_equip_add_info`);
const db_cn_sensor = require(`../../database/cn_sensor`);
const db_cn_sensor_threshold = require(`../../database/cn_sensor_threshold`);
const db_cn_modbus_cmd = require(`../../database/cn_modbus_cmd`);
const db_ft_current_alarm = require(`../../database/ft_current_alarm`);
const db_pd_equipment = require(`../../database/pd_equipment`);
const db_ft_history_alarm = require(`../../database/ft_history_alarm`);
const db_lg_work_history2 = require(`../../database/lg_work_history2`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'tree': {
            if(req.query.type === 'onlygroup') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getOnlyGroupTree(group_ids.groupList);
            } else if(req.query.type === 'group') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getGroupTree(group_ids.groupList);
            }
            break;
        }
        case 'group': {
            results = await db_cn_group.getGroupInfo(req.session.user.id, req.query.id);
            break;
        }
        case 'equipment': {
            results = await db_cn_equipment.getInfo(req.query.id);
            break;
        }
        case `equipmentaddinfo`: {
            results = await db_cn_equip_add_info.getInfo(req.query.id);
            break;
        }
        case 'model': {
            results = await db_pd_equipment.getInfoByEquipmentType(req.query.equipcode)
            break;
        }
        case 'bgimage': {
            const bg_img_path = path.resolve(__dirname, '..', '..', 'public', 'img', 'group');
            const files = fs.readdirSync(bg_img_path);

            const file_list = [];
            files.forEach((file) => {
                file_list.push({ name: file, path: `/img/group/${file}` });

                // by shkoh 20200518: image 파일만 결과 값으로 전달
                // by shkoh 20200622: 특정 확장자를 가진 이미지파일만을 선별하려면 아래와 같이 구현
                // const ext = file.split('.');
                // if([`jpg`, 'jpeg', 'bmp', 'png', 'gif'].includes(ext[ext.length - 1].toLocaleLowerCase())) {
                //     file_list.push({ name: file, path: `/img/group/${file}` });
                // }
            });

            results = file_list;
            break;
        }
        case 'bgassetimage': {
            const bg_image_path = path.resolve(__dirname, '..', '..', 'public', 'img', 'asset');
            const files = fs.readdirSync(bg_image_path);

            const file_list = [];
            files.forEach((file) => {
                file_list.push({ name: file, path: `/img/asset/${file}` });
            });

            results = file_list;
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `group`: {
            const set = JSON.parse(req.body.info);
            if(set.imageName) {
                set.imageName = set.imageName.normalize('NFC');
            }

            const previous_info = await db_cn_group.getGroupInfo(req.session.user.id, set.group_id);
            
            const where = { group_id: set.group_id };
            const response = await db_cn_group.updateGroup(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            if(response.affectedRows !== 0) {
                ws.ubiGuardWebSocketSendData({
                    command: 'update',
                    type: 'group',
                    id: Number(set.group_id),
                    pid: Number(set.p_group_id),
                    name: set.group_name
                });

                results = { msg: '그룹 수정 완료' }

                // by shkoh 20231031: LOG 변경이력
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                const changed_info = await db_cn_group.getGroupInfo(req.session.user.id, set.group_id);
                db_lg_work_history2.updateGroup(req.session.user, ip, previous_info, changed_info);
            }
            break;
        }
        case `groupdepth`: {
            const set = JSON.parse(req.body.info);
            const where = { group_id: set.group_id };
            const response = await db_cn_group.updateGroup(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            
            results = { msg: '그룹 depth 변경 완료' }
            break;
        }
        case 'equipment': {
            const isChanged = req.body.isChanged.includes('true');
            const info = JSON.parse(req.body.info);

            let set = info;
            let where = { equip_id: info.equip_id };
            const previous_info = await db_cn_equipment.getInfo(info.equip_id);
            let response = await db_cn_equipment.updateEquipment(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            
            if(response.affectedRows !== 0) {
                // by shkoh 20200519: 설비 모델이 변경되었을 경우
                if(isChanged) {
                    // by shkoh 20211224: 설비모델이 변경됐을 경우에는, 기존 설비 등급을 [정상]으로 되돌린다
                    response = await db_cn_equipment.updateEquipment({ current_status: 0, current_level: 0 }, { equip_id: info.equip_id });
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20211224: ft_history_alarm에서 해당 equip_id를 가진 알람 항목 중에서 복구되지 않은 알람을 복구시킴
                    response = await db_ft_history_alarm.recoverHistoryAlarmOfEquipment(info.equip_id);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20200519: ft_current_alarm에 존재하는 설비의 sensor들을 삭제
                    // by shkoh 20211224: 반드시 sensor 변경 전에 수행해야함
                    response = await db_ft_current_alarm.deleteCurrentAlarmByEquipId(info.equip_id);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20200519: cn_sensor에 존재하는 기존 sensor들을 모두 삭제(b_delete를 'Y'로 변경)
                    response = await db_cn_sensor.updateSensor({ b_delete: 'Y' }, { equip_id: info.equip_id });
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
                    
                    // by shkoh 20200519: cn_modbus_cmd에서 설비를 기준으로 하여 모두 삭제
                    response = await db_cn_modbus_cmd.deleteModbusCmd({ equip_id: info.equip_id });
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20200519: pd_modbus_cmd에 사전 정의된 내용을 cn_modbus_cmd에 추가
                    response = await db_cn_modbus_cmd.insertModbusCmd(info.equip_id, info.pd_equip_id);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20200519: pd_sensor에서 사전 정의된 sensor 정보를 cn_sensor에 추가
                    response = await db_cn_sensor.insertSensor(info.equip_id, info.pd_equip_id);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                    // by shkoh 20200519: cs_sensor를 기준으로 하여 pd_sensor_threshold에 사전 정의된 내용을 cn_sensor_threshold에 추가
                    response = await db_cn_sensor_threshold.insertSensorThreshold(info.equip_id);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
                }

                // by shkoh 20200519: 설비 모델이 변경됐을 경우에는 새롭게 변경된 정보를 Web Client에게 전달
                const equip_info = await db_cn_equipment.getInfo(where.equip_id);
                const message_equip_update = {
                    command: 'update',
                    type: 'equipment',
                    id: equip_info.id,
                    pid: equip_info.pid,
                    name: equip_info.name,
                    equip_code: equip_info.equip_code,
                    icon: equip_info.icon,
                    is_available: equip_info.b_use
                }

                if(isChanged) {
                    message_equip_update['pd_equip_id'] = equip_info.pd_equip_id;
                    message_equip_update['level'] = 0;
                }
                
                ws.ubiGuardWebSocketSendData(message_equip_update);

                results = { msg: '설비 변경 완료' };

                // by shkoh 20231031: 설비수정
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                await db_lg_work_history2.updateEquipment(req.session.user, ip, previous_info, equip_info);
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.delete(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `groupimage`: {
            const { image_name } = req.body;

            const bg_img_path = path.resolve(__dirname, '..', '..', 'public', 'img', 'group', image_name);
            const isExist = fs.existsSync(bg_img_path);
            if(isExist) {
                try {
                    fs.unlinkSync(bg_img_path);
                    
                    let groups = await db_cn_group.findGroupByImage(image_name);
                    if(groups.constructor.name === 'SqlError' || groups.constructor.name === 'TypeError') next(groups);
                    
                    const set = { imageName: 0 };
                    const where = { imageName: image_name }
                    let response = await db_cn_group.updateGroup(set, where);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') next(response);

                    // by shkoh 20200619: 그룹이미지를 삭제 직전에 해당 이미지를 가지고 있는 그룹리스트를 가져오고, 해당 이미지를 가진 그룹은 모두 초기화를 해줌. 그리고 클라이언트에게 가져온 그룹리스트에 해당되는 항목들이 변경되었음을 알림
                    groups.forEach(g => {
                        ws.ubiGuardWebSocketSendData({
                            command: 'update',
                            type: 'group',
                            id: Number(g.group_id),
                            pid: Number(g.p_group_id),
                            name: g.group_name
                        });
                    });

                    results = response;
                } catch(err) {
                    results = err;
                }
            } else {
                results = createError({
                    status : 500,
                    statusText: `배경이미지가 존재하지 않습니다`
                });
            }
            break;
        }
        case `assetImage`: {
            const { image_file } = req.body;

            const bg_img_path = path.resolve(__dirname, '..', '..', 'public', 'img', 'asset', image_file);
            const isExist = fs.existsSync(bg_img_path);
            if(isExist) {
                try {
                    fs.unlinkSync(bg_img_path);

                    let equip_info = await db_cn_equip_add_info.findImagesOnEquipmentAddInfo(image_file);
                    if(equip_info.constructor.name === `SqlError` || equip_info.constructor.name === `TypeError`) next(equip_info);

                    const set = { image_file: null };
                    const where = { image_file: image_file }
                    let response = await db_cn_equip_add_info.updateEquipmentAddInfo(set, where);
                    if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError`) next(response);
                    
                    results = response;
                } catch(err) {
                    results = err;
                }
            } else {
                results = createError({
                    status : 500,
                    statusText: `배경이미지가 존재하지 않습니다`
                });
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError' || results.constructor.name === `ServerError` || results.constructor.name === `Error`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'imageupload': {
            results = await new Promise((resolve, reject) => {
                group_image_uploader(req, res, async (err) => {
                    if(err) reject(err);
                    else {
                        const file_name = req.file.originalname.normalize('NFC');
                        // by shkoh 20200622: 이미지파일이 정상적으로 추가가 되었을 경우에서 동일한 파일명을 가진 그룹일 때는 새로 배경 이미지를 교체해야함
                        let groups = await db_cn_group.findGroupByImage(file_name);
                        if(groups.constructor.name === 'SqlError' || groups.constructor.name === 'TypeError') next(groups);

                        groups.forEach(g => {
                            ws.ubiGuardWebSocketSendData({
                                command: 'update',
                                type: 'group',
                                id: Number(g.group_id),
                                pid: Number(g.p_group_id),
                                name: g.group_name
                            });
                        });

                        resolve({ msg: `그룹 이미지파일 ${file_name}(size: ${Math.round(req.file.size / 1000)}KB)의 업로드를 완료했습니다` });
                    }
                });
            });
            break;
        }
        case 'assetimageupload': {
            results = await new Promise((resolve, reject) => {
                asset_image_uploader(req, res, async (err) => {
                    if(err) reject(err);
                    else {
                        const file_name = req.file.originalname.normalize('NFC');
                        resolve({ msg: `설비 이미지파일 ${file_name}(size: ${Math.round(req.file.size / 1000)}KB)의 업로드를 완료했습니다` });
                    }
                });
            });
            break;
        }
        case `equipmentaddinfo`: {
            const { equip_id, mgr_name, op_name, model_name, serial_info, install_date, ma_phone, image_file } = req.body;
            
            const set = {
                equip_id: Number(equip_id),
                mgr_name,
                op_name,
                model_name,
                serial_info,
                install_date,
                ma_phone,
                image_file: image_file === '' ? null : image_file
            };

            let response = await db_cn_equip_add_info.setEquipmentAddInfo(set);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            if(response.affectedRows !== 0) {
                results = { msg: '설비자산 내역 변경 완료' };
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;