/**
 * by shkoh 20200622
 * 장애이력 페이지에서 사용할 데이터 Route
 * 
 * /api/alarm/history/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_ft_history_alarm = require(`../../database/ft_history_alarm`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            results = await db_tree.getGroupTree(group_ids.groupList);
            break;
        }
    }

    if(results === undefined) {
        next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `get`: {
            const { alarmLevels, ids, startDate, endDate } = req.body;
            results = await db_ft_history_alarm.getHistoryAlarmByEquipments(alarmLevels.toString(), ids.toString(), startDate, endDate);
            break;
        }
    }

    if(results === undefined) {
        next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;