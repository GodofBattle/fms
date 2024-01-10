/**
 * by shkoh 20200612
 * Predefine Equipment Setting 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/predefine/equipment/:mode 형식
 */
const express = require(`express`);
const router = express.Router();

const db_pd_code = require(`../../database/pd_code`);
const db_pd_equipment = require(`../../database/pd_equipment`);
const db_pd_sensor = require(`../../database/pd_sensor`);
const db_pd_sensor_threshold = require(`../../database/pd_sensor_threshold`);
const db_pd_modbus_cmd = require(`../../database/pd_modbus_cmd`);
const db_tree = require(`../../database/tree`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'tree': {
            results = await db_tree.getPredefineEquipmentTree();
            break;
        }
        case 'list': {
            const { type } = req.query;
            if(type === 'unknown') results = [];
            else results = await db_pd_equipment.getInfoByEquipmentType(type);
            break;
        }
        case 'threshold': {
            const { code } = req.query;
            if(code === 'unknown') results = [];
            else results = await db_pd_sensor_threshold.getInfoBySensorCode(code);
            break;
        }
        case 'modbus': {
            const { id } = req.query;
            if(id === 'unknown') results = [];
            else results = await db_pd_modbus_cmd.getInfo(id);
            break;
        }
        case 'alarmgrade': {
            results = await db_pd_code.getAlarmGrade();
            break;
        }
        case 'sensor': {
            const { id } = req.query;
            if(id === 'unknown') results = [];
            else results = await db_pd_sensor.getInfo({ pd_equip_id: id });
            break;
        }
        case `iolist`: {
            results = await db_pd_code.getInfoByType('I');
            break;
        }
        case `sensorcodelist`: {
            results = await db_pd_code.getSensorType();
            break;
        }
        case 'modbusdatatype': {
            results = await db_pd_code.getDataTypeCodeList();
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `info`: {
            const info = JSON.parse(req.body.info);
            results = await db_pd_equipment.insertPredefineEquipment(info.equip_code, info.io_type_code);
            break;
        }
        case `sensor`: {
            const info = JSON.parse(req.body.info);
            results = await db_pd_sensor.insertPredefineSensor(info.pd_equip_id);
            break;
        }
        case `threshold`: {
            const info = JSON.parse(req.body.info);
            results = await db_pd_sensor_threshold.insertThreshold(info.sensor_code);
            break;
        }
        case `modbus`: {
            const info = JSON.parse(req.body.info);
            results = await db_pd_modbus_cmd.insertInfo(info.pd_equip_id);
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
        case `info`: {
            const info = JSON.parse(req.body.info);
            const array_set = [];
            if(info.length > 0) {
                info.forEach(item => {
                    array_set.push({
                        equip_model_name: item.equip_model_name,
                        equip_name: item.equip_name,
                        io_type_code: item.io_type_code
                    }, {
                        pd_equip_id: item.pd_equip_id
                    });
                });

                let response = await db_pd_equipment.batchPredefineEquipment(info.length, array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                results = { msg: `사전설비 내역 수정 완료`, updateItems: JSON.stringify(info) };
            } else {
                results = { msg: `update를 위한 사전설비 정보를 전달받지 못 했습니다` };
            }
            break;
        }
        case `sensor`: {
            const info = JSON.parse(req.body.info);
            const array_set = [];
            if(info.length > 0) {
                info.forEach(item => {
                    array_set.push({
                        sensor_name: item.sensor_name,
                        sensor_type: item.sensor_type,
                        sensor_code: item.sensor_code,
                        pd_threshold_id: parseInt(item.pd_threshold_id),
                        oid: item.oid,
                        div_value: item.div_value,
                        mc_id: parseInt(item.mc_id)
                    }, {
                        pd_sensor_id: item.pd_sensor_id
                    });
                });

                let response = await db_pd_sensor.batchPredefineSensor(info.length, array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                results = { msg: `사전설비 항목 내역 수정 완료` };
            } else {
                results = { msg: `update를 위한 사전설비의 항목 정보를 전달받지 못 했습니다` };
            }
            break;
        }
        case `threshold`: {
            const info = JSON.parse(req.body.info);
            const array_set = [];
            if(info.length > 0) {
                info.forEach(item => {
                    let threshold = {};
                    Object.keys(item).forEach((key) => {
                        if(key.substr(0, 1) === 'a') {
                            threshold[key] = item[key] === null ? 0 : item[key];
                        } else if(key.substr(0, 1) === 'd' && item[key] !== -1) {
                            threshold[key] = item[key]
                        }
                    });
                    threshold[`threshold_name`] = item[`pd_threshold_name`];

                    array_set.push(threshold, { pd_threshold_id: item.pd_threshold_id });
                });

                let response = await db_pd_sensor_threshold.batchPredefineThreshold(info.length, array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

                results = { msg: `사전설비 항목 임계값 내역 수정 완료` };
            } else {
                restuls = { msg: `update를 위한 사전설비의 항목 임계값 정보를 전달받지 못 했습니다` };
            }
            break;
        }
        case `modbus`: {
            const info = JSON.parse(req.body.info);
            const array_set = [];
            if(info.length > 0) {
                info.forEach(item => {
                    array_set.push({
                        function_code: item.function_code,
                        start_addr: item.start_addr,
                        point_cnt: item.point_cnt,
                        data_type: item.data_type
                    },
                        item.pd_equip_id,
                        item.mc_id
                    );
                });

                let response = await db_pd_modbus_cmd.batchInfo(info.length, array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
                
                results = { msg: `사전설비 항목의 MODBUS 정보 수정 완료` };
            } else {
                results = { msg: `update를 위한 사전설비 항목의 MODBUS 정보를 전달받지 못 했습니다` };
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
        case `info`: {
            const info = JSON.parse(req.body.info);
            let response = await db_pd_modbus_cmd.deleteInfoByPdEquipId({ pd_equip_id: info.pd_equip_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            response = await db_pd_sensor.deletePredefineSensor({ pd_equip_id: info.pd_equip_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = await db_pd_equipment.deletePredefineEquipment({ pd_equip_id: info.pd_equip_id });
            results[`pd_equip_id`] = info.pd_equip_id;
            break;
        }
        case `sensor`: {
            const info = JSON.parse(req.body.info);
            results = await db_pd_sensor.deletePredefineSensorAndResetId(info.pd_equip_id, info.pd_sensor_id);
            break;
        }
        case `threshold`: {
            const info = JSON.parse(req.body.info);

            // by shkoh 20200618: 특정 임계값을 삭제하기 전에, 해당 임계값을 가지고 있는 pd_sensor의 pd_threshold_id의 값을 초기화한다
            const set = { pd_threshold_id: 0 };
            const where = { pd_threshold_id: info.pd_threshold_id }
            let response = await db_pd_sensor.updatePredefineSensor(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            response = await db_pd_sensor_threshold.deleteThreshold(where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = response;
            break;
        }
        case `modbus`: {
            const info = JSON.parse(req.body.info);
            let response = await db_pd_sensor.updatePredefineSensorToModbusId(info.pd_equip_id, info.mc_id);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            response = await db_pd_modbus_cmd.deleteInfoAndResetId(info.pd_equip_id, info.mc_id);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            results = response;
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