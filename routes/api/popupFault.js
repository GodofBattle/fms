/**
 * by shkoh 20200520
 * Popup 로그 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/popup/log/...
 */
const express = require(`express`);
const router = express.Router();

const db_ft_history_alarm = require(`../../database/ft_history_alarm`);
const db_ft_history_alarm_action = require(`../../database/ft_history_alarm_action`);

router.get(`/info`, async (req, res, next) => {
    const { equip_id, start_date, end_date } = req.query;
    const results = await db_ft_history_alarm.readHistoryAlarmByEquipment(equip_id, start_date, end_date);

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/action`, async (req, res, next) => {
    let results = undefined;
    
    const { alarmHistoryId, action_date, action_user_name, action_content } = req.body;
    const set = {
        alarmHistoryId: Number(alarmHistoryId),
        action_date: new Date(action_date),
        action_user_name: action_user_name,
        action_content: action_content
    }
    let response = await db_ft_history_alarm_action.getAction({ alarmHistoryId: set.alarmHistoryId });

    if(response.length === 0) {
        response = await db_ft_history_alarm_action.insertAction(set);
    } else {
        response = await db_ft_history_alarm_action.updateAction(set, { alarmActionHistoryId: response[0].alarmActionHistoryId });
    }
    
    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
    
    results = set;

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.delete(`/action`, async (req, res, next) => {
    let results = undefined;

    const { id } = req.body;
    results = await db_ft_history_alarm_action.deleteAction({ alarmHistoryId: id });

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;