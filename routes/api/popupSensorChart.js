/**
 * by shkoh 20200520
 * Popup 센서 차트 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/popup/chart 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_st_aisensor = require(`../../database/st_aisensor`);
const db_lg_disensor = require(`../../database/lg_disensor_history`);

router.get(`/`, async (req, res, next) => {
    const { sensor_type, period, equip_id, sensor_id, date } = req.query;
    
    if((sensor_type === undefined || sensor_type === '') || (period === undefined || period === '') || (sensor_id === undefined || sensor_id === '') || (date === undefined || date === '')) {
        return res.end();
    }

    let results;
    if(sensor_type === 'AI') {
        results = await db_st_aisensor.getAISensorValueStatistics({
            sensor_id: sensor_id,
            period: period,
            date: date
        });
    } else if(sensor_type === 'DI') {
        results = await db_lg_disensor.getDISensorValuesHistory({
            equip_id: equip_id,
            sensor_id: sensor_id,
            period: period,
            date: date
        });
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