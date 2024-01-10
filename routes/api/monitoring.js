/**
 * by shkoh 20200513
 * Monitoring 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/monitoring/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const ws = require('../../config/ws');

const db_procedure = require('../../database/procedure');
const db_tree = require(`../../database/tree`);
const db_server = require(`../../database/server`);
const db_map = require(`../../database/map`);
const db_ac_event_accept = require(`../../database/ac_event_accept`);
const db_ac_grid_config = require('../../database/ac_grid_config');
const db_ac_user = require(`../../database/ac_user`);
const db_cn_group = require(`../../database/cn_group`);
const db_cn_equipment = require(`../../database/cn_equipment`);
const db_cn_sensor = require(`../../database/cn_sensor`);
const db_cn_map_dashboard = require(`../../database/cn_map_dashboard`);
const db_cn_map_dummy = require(`../../database/cn_map_dummy`);
const db_cn_map_leak = require(`../../database/cn_map_leak`);
const db_cn_map_link = require(`../../database/cn_map_link`);
const db_cn_modbus_cmd = require(`../../database/cn_modbus_cmd`);
const db_ft_current_alarm = require(`../../database/ft_current_alarm`);
const db_pd_code = require(`../../database/pd_code`);
const db_ft_history_alarm = require(`../../database/ft_history_alarm`);
const db_lg_work_history2 = require(`../../database/lg_work_history2`);

// by shkoh 20210129: fms 고객사 커스터마이즈 적용을 위한 설정파일
const fms_config = require(`../../config/fms.config`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'gridstack': {
            results = await db_ac_grid_config.getGridConfig(req.session.user.id);
            break;
        }
        case 'tree': {
            if(req.query.type === 'group') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getGroupTree(group_ids.groupList);
            } else if(req.query.type === 'code') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getCodeTree(group_ids.groupList);
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
        case 'sensor': {
            results = await db_cn_sensor.getListPerEquipment(req.query.parent);
            break;
        }
        case 'code': {
            results = await db_pd_code.getEquipCodeForMap(req.query.id);
            if(results === undefined) results = {
                id: req.query.id,
                pid: 'G_0',
                name: '설비별 보기',
                imageName: ''
            }
            break;
        }
        case 'equiptype': {
            results = await db_pd_code.getInfoByType('E');
            break;
        }
        case 'findParentGroupName': {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_cn_group.findParentGroupName(req.query.id, group_ids.groupList);
            break;
        }
        case 'alarm': {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_ft_current_alarm.getMonitoringAlarmList(group_ids.groupList);
            break;
        }
        case 'server': {
            results = await db_server.getServerInfo();
            break;
        }
        case 'statistics': {
            if(req.query.type === 'group') {
                const groupLists = await db_procedure.spGetSubGroupList(req.query.id);
                
                let group_ids = groupLists.groupList;
                if(group_ids === null) group_ids = req.query.id;
                else group_ids = `${group_ids},${req.query.id}`;

                results = await db_cn_equipment.getStatisticsByLevel(group_ids);
            } else if(req.query.type === 'code') {
                results = await db_cn_equipment.getStatisticsByLevelPerCode(req.query.id);   
            }
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

/**
 * by shkoh 20200514
 * 2D Map을 구성하기 위한 개별 요소들에 대한 처리를 위하여 별도 구성
 * 
 * /api/monitoring/map/:mode 형식
 */
router.get(`/map/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'group': {
            results = await db_cn_group.getMapNodes(req.query.parent);
            break;
        }
        case 'equipments': {
            results = await db_cn_equipment.getMapNodes(req.query.parent);
            break;
        }
        case 'dummy': {
            results = await db_cn_map_dummy.getMapNodes(req.query.parent);
            break;
        }
        case 'link': {
            results = await db_cn_map_link.getMapNodes(req.query.parent);
            break;
        }
        case 'tooltip': {
            results = await db_cn_equipment.getMapTooltip(req.query.id);
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'gridstack': {
            const rows = await db_ac_grid_config.setGridConfig(req.session.user.id, JSON.parse(req.body.items));

            let response = undefined;
            if(rows instanceof Array) {
                response = rows.filter(r => r.affectedRows === 0);
                if(response.length > 0) results = { msg: '그리드 크기 및 위치 정보 저장 성공' };
                else results = {};
            } else if(rows.affectedRows === 1) {
                results = { msg: '그리드 크기 및 위치 정보 저장 성공' };
            } else {
                results = {}
            }
            break;
        }
        case 'map': {
            const response = await db_map.setNodesPosition(req.body);
            let isResult = true;
            if(Array.isArray(response)) {
                response.forEach((r) => {
                    if(r.affectedRows === 0) isResult = false;
                });
            } else if(response.affectedRows === 0) isResult = false;

            if(isResult) {
                ws.ubiGuardWebSocketSendData({
                    command: 'redraw',
                    type: 'cytoscape_node',
                    nodes: req.body.info
                });
            }

            results = {};
            break;
        }
        case 'group': {
            const response = await db_cn_group.insertGroup(req.body.parent_id);
            let isResult = true;
            if(response.affectedRows === 0) isResult = false

            if(isResult) {
                const group_info = await db_cn_group.getGroupInfo(req.session.user.id, response.insertId);
                if(group_info) {
                    ws.ubiGuardWebSocketSendData({
                        command: 'insert',
                        type: 'group',
                        id: group_info.id,
                        pid: group_info.pid,
                        parent_id: group_info.pid,
                        name: group_info.name,
                        is_available: 'Y',
                        kind: 'group',
                        icon: 'group'
                    });

                    // by shkoh 20231031: 그룹추가
                    const ip_from_request = req.ip;
                    const idx = ip_from_request.lastIndexOf(':');
                    const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                    await db_lg_work_history2.addGroup(req.session.user, ip, group_info);
                }

                results = { msg: '그룹 추가 완료' }
            }
            break;
        }
        case 'equipment': {
            const response = await db_cn_equipment.insertEquipment(req.body.parent_id);
            let isResult = true;
            if(response.affectedRows === 0) isResult = false;

            if(isResult) {
                const equipment_info = await db_cn_equipment.getInfo(response.insertId);
                if(equipment_info) {
                    ws.ubiGuardWebSocketSendData({
                        command: 'insert',
                        type: 'equipment',
                        id: equipment_info.id,
                        pid: equipment_info.pid,
                        parent_id: equipment_info.pid,
                        name: equipment_info.name,
                        kind: equipment_info.icon,
                        icon: equipment_info.icon,
                        equip_code: equipment_info.equip_code,
                        pd_equip_id: equipment_info.pd_equip_id,
                        is_available: equipment_info.b_use
                    });

                    // by shkoh 20231031: 설비추가
                    const ip_from_request = req.ip;
                    const idx = ip_from_request.lastIndexOf(':');
                    const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                    await db_lg_work_history2.addEquipment(req.session.user, ip, equipment_info);
                }

                results = { msg: '설비 추가 완료' }
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
        case `group`: {
            const delete_id = req.body.delete_id;
            let affected_count = 0;
            
            let response = await db_cn_map_link.deleteMapNodes(delete_id);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;
            
            response = await db_cn_map_leak.deleteMapNodes(delete_id);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            response = await db_cn_map_dummy.deleteMapNodes(delete_id);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            const delete_group_info = await db_cn_group.getGroupInfo(req.session.user.id, delete_id);
            response = await db_cn_group.updateGroup({ b_delete: `Y` }, { group_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            if(affected_count > 0) {
                const set = {
                    basic_group_id: req.body.parent_delete_id,
                    update_time: new Date()
                };
                const where = { basic_group_id: delete_id }
                await db_ac_user.updateUser(set, where);

                ws.ubiGuardWebSocketSendData({
                    command: 'delete',
                    type: 'group',
                    id: delete_id,
                    pid: req.body.parent_delete_id
                });

                results = { msg: '그룹 삭제 완료' };

                // by shkoh 20231031: 그룹추가
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                await db_lg_work_history2.deleteGroup(req.session.user, ip, delete_group_info);
            }

            break;
        }
        case 'equipment': {
            const { delete_id } = req.body;
            let affected_count = 0;

            // by shkoh 20211224: 설비 삭제 시, 장애이력 내 해당 equip_id를 가지고 있는 모든 설비를 강제 복구
            let response = await db_ft_history_alarm.recoverHistoryAlarmOfEquipment({ equip_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            response = await db_ft_current_alarm.deleteCurrentAlarm({ equip_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            response = await db_ac_event_accept.deleteAcceptedEvent({ equip_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            response = await db_cn_map_dashboard.deleteMapDashboard({ equip_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            response = await db_cn_modbus_cmd.deleteModbusCmd({ equip_id: delete_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            let set = { b_delete: `Y` };
            let where = { equip_id: delete_id }
            response = await db_cn_sensor.updateSensor(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            const delete_info = await db_cn_equipment.getInfo(delete_id);
            response = await db_cn_equipment.updateEquipment(set, where);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            if(response.affectedRows > 0) affected_count++;

            if(affected_count > 0) {
                ws.ubiGuardWebSocketSendData({
                    command: 'delete',
                    type: 'equipment',
                    id: delete_id,
                    pid: req.body.parent_id
                });

                results = { msg: '설비 삭제 완료' };

                // by shkoh 20231031: 설비삭제
                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                await db_lg_work_history2.deleteEquipment(req.session.user, ip, delete_info);
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