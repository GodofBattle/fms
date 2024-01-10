/**
 * by shkoh 20200618
 * 장애현황 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/alarm/dashboard/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_cn_equipment = require(`../../database/cn_equipment`);
const db_cn_sensor = require(`../../database/cn_sensor`);
const db_ft_current_alarm = require(`../../database/ft_current_alarm`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_tree.getGroupTree(group_ids.groupList);
            break;
        }
        case `list`: {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_ft_current_alarm.getMonitoringAlarmList(group_ids.groupList);
            break;
        }
        case `statistics`: {
            const { id } = req.query;
            
            const groupLists = await db_procedure.spGetSubGroupList(id);
            let group_ids = groupLists.groupList;
            if(group_ids === null) group_ids = id;
            else group_ids = `${group_ids},${id}`;

            results = await db_cn_equipment.getStatisticsByLevel(group_ids);
            break;
        }
        case `equipmentinfo`: {
            const { id } = req.query;
            results = await db_cn_equipment.getInfo(id);
            break;
        }
        case `sensorlist`: {
            const { parent } = req.query;
            results = await db_cn_sensor.getListPerEquipment(parent);
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

module.exports = router;