/**
 * by shkoh 20230731
 * 국방부 Route
 * 
 * /api/didc/icomer 에서 시작함
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../../../database/procedure`);
const db_ft_current_alarm = require(`../../../../database/ft_current_alarm`);
const db_cn_icomer_mapping = require(`../../../../database/cn_icomer_mapping`);
const db_lg_work_history2 = require(`../../../../database/lg_work_history2.js`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `dashboard`: {
            results = await db_cn_icomer_mapping.getIcomerMappingDataToPage('i_dashboard');
            break;
        }
        case `popupData`: {
            const { obj_name } = req.query;
            const data = await db_cn_icomer_mapping.getIcomerMapping({ page_name: 'i_dashboard' }, { object_name: obj_name });
            
            if(data === undefined || data.length === 0) {
                results = {};
            } else {
                results = data[0];
            }
            break;
        }
        case `equipmentlist`: {
            const { pagename, objectname } = req.query;
            results = await db_cn_icomer_mapping.getDidcEquipmentList(pagename, objectname);
            break;
        }
        case `alarmList`: {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_ft_current_alarm.getMonitoringAlarmList(group_ids.groupList);
            break;
        }
        case `statisticsAlarmList`: {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_ft_current_alarm.getStatisticsAlarmList(group_ids.groupList);
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

router.get(`/ds/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `temphumi`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcTempHumi(ids);
            break;
        }
        case `icon`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcIcon(ids);
            break;
        }
        case `alert`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcAlert(ids);
            break;
        }
        case `hvacrun`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcHVACRun(ids);
            break;
        }
        case `power`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcPower(ids);
            break;
        }
        case `pue`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcPUE(ids);
            break;
        }
        case `wind`: {
            const { ids } = req.query;
            results = await db_cn_icomer_mapping.getDidcWind(ids);
            break;
        }
        case `containmentlist`: {
            const { pagename } = req.query;
            
            results = await db_cn_icomer_mapping.getDidcContainmentList(pagename);
            for(const idx in results) {
                const { equip_ids } = results[idx];
                const chart_data = await db_cn_icomer_mapping.getDidcContainmentChart(equip_ids);
                
                results[idx].data = chart_data;
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

router.post(`/dashboard/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `title`: {
            const { obj, title } = req.body;
            const info = {
                page_name: 'i_dashboard',
                object_name: obj,
                description: title
            };

            const response = await db_cn_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;

            // by shkoh 20231116: 대시보드 명칭 변경에 대한 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            await db_lg_work_history2.updateDashboard(req.session.user, ip, obj, title, undefined);

            break;
        }
        case `equipments`: {
            const { obj, equip_ids } = req.body;
            const info = {
                page_name: 'i_dashboard',
                object_name: obj,
                equip_ids: equip_ids
            };

            const response = await db_cn_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;

            // by shkoh 20231116: 대시보드 설정 변경에 대한 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            await db_lg_work_history2.updateDashboard(req.session.user, ip, obj, undefined, equip_ids);

            break;
        }
        case `containment`: {
            const info = {
                page_name: 'i_dashboard',
                object_name: `i-containment-`
            }

            let response = await db_cn_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            
            // by shkoh 20230920: Insert한 정보에서 ID값을 받아온 후에 다시 해당 ID를 가진 object_name을 만들어준다
            const insert_id = response.insertId;
            info.id = insert_id;
            info.object_name = `i-containment-${insert_id}`;

            response = await db_cn_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            
            results = info;

            // by shkoh 20231116: 대시보드 설정에서 컨테인먼트 추가에 대한 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            await db_lg_work_history2.addContainmentToDashboard(req.session.user, ip, insert_id);
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

router.patch(`/dashboard/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `containment`: {
            const { id, description } = req.body;
            const info = {
                id: id,
                description: description
            }
            
            const response = await db_cn_icomer_mapping.setIcomerMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;

            // by shkoh 20231116: 대시보드 설정에서 컨테인먼트명 변경에 대한 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            await db_lg_work_history2.updateContainmentToDashboard(req.session.user, ip, id, description);
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

router.delete(`/dashboard/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `containment`: {
            const { id } = req.body;

            const containments = await db_cn_icomer_mapping.getDidcContainmentList('i_dashboard');
            const c = containments.find((ct) => ct.id === Number(id));

            const response = await db_cn_icomer_mapping.deleteIcomeMapping({ id: id });
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = response;

            // by shkoh 20231116: 대시보드 설정에서 컨테인먼트 삭제에 대한 lg_work_history2에 기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            await db_lg_work_history2.deleteContainmentToDashboard(req.session.user, ip, id, c ? c.name : '');
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