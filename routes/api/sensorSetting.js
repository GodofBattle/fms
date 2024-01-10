/**
 * by shkoh 20200608
 * Sensor Setting 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/sensor/:mode 방식
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_cn_modbus_cmd = require(`../../database/cn_modbus_cmd`);
const db_cn_sensor = require(`../../database/cn_sensor`);
const db_cn_sensor_threshold = require(`../../database/cn_sensor_threshold`);
const db_pd_code = require(`../../database/pd_code`);
const db_lg_work_history2 = require(`../../database/lg_work_history2`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'type': {
            results = await db_pd_code.getSensorType();
            break;
        }
        case 'alarmgrade': {
            results = await db_pd_code.getAlarmGrade();
            break;
        }
        case 'tree': {
            if(req.query.type === 'group') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getGroupTree(group_ids.groupList);
            }
            break;
        }
        case 'info': {
            const { ids } = req.query;
            if(ids === 'unknown') results = [];
            else results = await db_cn_sensor.getSensorList(ids);
            break;
        }
        case 'threshold': {
            const { ids, type } = req.query;
            if(ids === 'unknown') results = [];
            else results = await db_cn_sensor.getSensorThresholdList(type, ids);
            break;
        }
        case 'mcid': {
            const { id } = req.query;
            if(id === 'unknown') results = [];
            else results = await db_cn_modbus_cmd.getModbudCmdInfoBySensorId(id);
            break;
        }
        case 'modbusdatatype': {
            results = await db_pd_code.getDataTypeCodeList();
            break;
        }
        case `sensorthreshold`: {
            const { id } = req.query;
            results = await db_cn_sensor_threshold.getSensorThreshold({ sensor_id: id });
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);   
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'mcid': {
            const info = JSON.parse(req.body.mcidInfo);
            let response = await db_cn_modbus_cmd.insertModbusCmdInfo({
                equip_id: info[0].equip_id,
                mc_id: info[0].mcid,
                function_code: info[0].funcCode,
                start_addr: info[0].startAddr,
                point_cnt: info[0].pointCnt,
                data_type: info[0].type
            });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = { msg: `Modbus Command 추가 완료` };            
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'info': {
            const array_set = [];
            const update_items = JSON.parse(req.body.updateInfo);

            const sensor_ids = [];
            if(update_items.length > 0) {
                update_items.forEach(item => {
                    array_set.push({
                        sensor_name: item.name,
                        node_id: item.node === null ? undefined : item.node,
                        sensor_type: item.sensorType === null ? undefined : item.sensorType,
                        sensor_code: item.unit === null ? undefined : item.unit,
                        b_use: item.bUse,
                        b_display: item.bDisplay,
                        b_event: item.bEvent,
                        b_data_save: item.bData,
                        oid: item.oid === null ? '' : item.oid,
                        div_value: item.divValue,
                        user_define: item.userDefine === null ? '' : item.userDefine,
                        mc_id: item.mcid,
                        update_dateTime: new Date()
                    }, {
                        sensor_id: item.id
                    });

                    sensor_ids.push(item.id);
                });

                const previous_info = await db_cn_sensor.getSensorListBySensorIds(sensor_ids.toString());

                let response = await db_cn_sensor.batchSensorInfo(update_items.length, array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                // by shkoh 20231031: 센서수정 로그기록
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                const info = await db_cn_sensor.getSensorListBySensorIds(sensor_ids.toString());
                await db_lg_work_history2.updateSensor(req.session.user, ip, previous_info, info);

                results = response;
            } else {
                results = { msg: `update를 위한 센서 기본정보를 전달받지 못 했습니다` };
            }
            break;
        }
        case 'threshold': {
            const sensor_set = [];
            const threshold_set = [];
            const update_items = JSON.parse(req.body.updateThresholdInfo);
            const threshold_type = req.body.updateType;

            if(update_items.length > 0) {
                const sensor_ids = [];
                update_items.forEach(item => {
                    sensor_set.push({
                        event_mode: `${item.b_popup}${item.b_sms}${item.b_email}NNNNNNN`,
                        update_dateTime: new Date()
                    }, {
                        sensor_id: item.sensor_id
                    });

                    const new_data = (threshold_type === 'AI') ?
                        {
                            a_warning_min: item.a_warning_min,
                            a_warning_max: item.a_warning_max,
                            a_major_min: item.a_major_min,
                            a_major_max: item.a_major_max,
                            a_critical_min: item.a_critical_min,
                            a_critical_max: item.a_critical_max,
                            holding_time: item.holding_time
                        } :
                        {
                            d_value_0_level: item.d_value_0_level,
                            d_value_0_label: item.d_value_0_label,
                            d_value_1_level: item.d_value_1_level,
                            d_value_1_label: item.d_value_1_label,
                            d_value_2_level: item.d_value_2_level,
                            d_value_2_label: item.d_value_2_label,
                            d_value_3_level: item.d_value_3_level,
                            d_value_3_label: item.d_value_3_label,
                            d_value_4_level: item.d_value_4_level,
                            d_value_4_label: item.d_value_4_label,
                            d_value_5_level: item.d_value_5_level,
                            d_value_5_label: item.d_value_5_label,
                            d_value_6_level: item.d_value_6_level,
                            d_value_6_label: item.d_value_6_label,
                            d_value_7_level: item.d_value_7_level,
                            d_value_7_label: item.d_value_7_label,
                            holding_time: item.holding_time
                        };

                    threshold_set.push( new_data, { sensor_id: item.sensor_id });
                    sensor_ids.push(item.sensor_id);
                });

                const previous_sensor = await db_cn_sensor.getSensorListBySensorIds(sensor_ids.toString());
                const previous_threshold = await db_cn_sensor_threshold.getSensorThresholdByIds(sensor_ids.toString());
                
                let response = await db_cn_sensor.batchSensorInfo(update_items.length, sensor_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
                response = await db_cn_sensor_threshold.batchThresholdInfo(update_items.length, threshold_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                results = { msg: `${threshold_type} 센서 임계값 업데이트 완료` };

                // by shkoh 20231031: 임계치수정
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                const sensor_info = await db_cn_sensor.getSensorListBySensorIds(sensor_ids.toString());
                const threshold_info = await db_cn_sensor_threshold.getSensorThresholdByIds(sensor_ids.toString());
                await db_lg_work_history2.updateThreshold(req.session.user, ip, previous_sensor, previous_threshold, sensor_info, threshold_info);
            } else {
                results = { msg: `update를 위한 임계값 변경정보를 전달받지 못 했습니다` };
            }
            break;
        }
        case `sensorthreshold`: {
            const { id, type } = req.query;
            
            const where = { sensor_id: id };
            const set = { ...req.body };

            const previous_sensor = await db_cn_sensor.getSensorListBySensorIds([ id ]);
            const previous_threshold = await db_cn_sensor_threshold.getSensorThresholdByIds([ id ]);
            
            let response = await db_cn_sensor_threshold.updateThresholdInfo(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = { msg: `${type} 센서 임계값 업데이트 완료` };

            // by shkoh 20231116: 대시보드에서 센서 임계치 변경 시 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            const sensor_info = await db_cn_sensor.getSensorListBySensorIds([ id ]);
            const threshold_info = await db_cn_sensor_threshold.getSensorThresholdByIds([ id ]);
            await db_lg_work_history2.updateThreshold(req.session.user, ip, previous_sensor, previous_threshold, sensor_info, threshold_info);
            break;
        }
        case 'mcid': {
            const update_info = JSON.parse(req.body.mcidInfo);
            if(update_info.length > 0) {
                for(let idx in update_info) {
                    const update_item = {
                        function_code: update_info[idx].funcCode,
                        start_addr: update_info[idx].startAddr,
                        point_cnt: update_info[idx].pointCnt,
                        data_type: update_info[idx].type
                    }

                    let response = await db_cn_modbus_cmd.updateModbusCmdInfo(update_item, update_info[idx].equip_id, update_info[idx].mcid);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
                }

                results = { msg: `Modbus Command 변경 완료` };
            } else {
                results = { msg: `Modbus Command 변경 사항이 없습니다` };
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.delete(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'mcid': {
            const info = JSON.parse(req.body.mcidInfo);
            let response = await db_cn_modbus_cmd.deleteModbusCmdInfo(info[0].equip_id, info[0].mcid);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = { msg: `Modbus Command 삭제 완료` };            
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;