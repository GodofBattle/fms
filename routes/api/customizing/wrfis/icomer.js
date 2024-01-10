/**
 * by shkoh 20210312
 * Customizing >> 우리FIS >> 아이커머 연동 route 부분
 * 급하게 제작하느라 wemb DB mapping 테이블 사용
 */
const express = require(`express`);
const router = express.Router();

const ws = require(`../../../../config/ws`);

const db_procedure = require(`../../../../database/procedure`);
const db_tree = require(`../../../../database/tree`);
const db_icomer_mapping = require(`../../../../database/cn_icomer_mapping`);
const db_user_cmd_history = require(`../../../../database/lg_user_cmd_history`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const { type } = req.query;
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            if(type === `group`) results = await db_tree.getGroupTree(group_ids.groupList);
            else if(type === `sensor`) results = await db_tree.getOnlySensorTreeNode(group_ids.groupList);
            else if(type === `filtering`) {
                const { id, filter } = req.query;
                results = await db_tree.getFilteringTreeByEquipmentIdAndSensorName(id, filter);
            }
            break;
        }
        case `mapper`: {
            const { pagename, objectname } = req.query;
            if(objectname) {
                results = await db_icomer_mapping.getIcomerMapping({ page_name: pagename }, { object_name: objectname });
            } else {
                results = await db_icomer_mapping.getIcomerMappingDataToPage(pagename);
            }
            break;
        }
        case `hvac`: {
            const { pagename, objectname, floorname } = req.query;
            
            if(objectname) {
                results = await db_icomer_mapping.getHVACObjectData(pagename, objectname);
            } else {
                results = await db_icomer_mapping.getHVACDataToMapper(pagename);
            }
            break;
        }
        case `th`: {
            const { pagename, objectname } = req.query;
            if(objectname) {
                results = await db_icomer_mapping.getTHObjectData(pagename, objectname);
            } else {
                results = await db_icomer_mapping.getTHDataToMapper(pagename);
            }
            break;
        }
        case `pue`: {
            const { pagename } = req.query;
            results = await db_icomer_mapping.getPUEDataToMapper(pagename);
            break;
        }
        case `puechart`: {
            const { pagename } = req.query;
            results = await db_icomer_mapping.getPUEChartDataToMapper(pagename);
            break;
        }
        case `floor`: {
            const { pagename, floorname } = req.query;
            results = await db_icomer_mapping.getIcomerFloorData(pagename, floorname);
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError` || results.constructor.name === `ServerError` || results.constructor.name === `Error`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const data = req.body;
            const info = {
                page_name: data.page_name,
                object_name: data.object_name,
                group_ids: data.group_ids === '' ? null : data.group_ids,
                equip_ids: data.equip_ids === '' ? null : data.equip_ids,
                sensor_ids: data.sensor_ids === '' ? null : data.sensor_ids,
                description: data.description
            }

            const response = await db_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;
            break;
        }
        case `itempopup`: {
            const data = req.body;
            const info = {
                page_name: data.page_name,
                object_name: data.object_name,
                popup_equip_id: data.popup_equip_id === '' ? null : data.popup_equip_id
            }

            const response = await db_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;
            break;
        }
        case `hvacctrl`: {
            try {
                const { mode, equip_id, sensor_id } = req.body;
                const command = (mode === 'start' ? 'hvac-on' : 'hvac-off')
                if(isNaN(Number(equip_id)) || isNaN(Number(sensor_id))) {
                    throw new Error('equip_id 혹은 sensor_id의 형식이 올바르지 않습니다');
                }

                let response = await db_user_cmd_history.insertUserCommand({
                    user_id: req.session.user.id,
                    command: command,
                    equip_id: Number(equip_id),
                    sensor_id: Number(sensor_id),
                    last_proc_name: 'WEBSEV'
                });

                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) {
                    throw new Error(response);
                }

                ws.ubiGuardWebSocketSendData({
                    seq: response.insertId,
                    command: command,
                    'equip-id': Number(equip_id),
                    'sensor-id': Number(sensor_id)
                });

                const is_run = command === 'hvac-on' ? '가동' : '정지';
                results = { msg: `항온항습기 ${is_run} 제어명령을 전달했습니다` };
            } catch(err) {
                results = err;
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError` || results.constructor.name === `ServerError` || results.constructor.name === `Error`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;