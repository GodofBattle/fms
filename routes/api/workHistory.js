/**
 * by shkoh 20211222
 * 작업 이력 기능에 사용할 Route 부분
 * 
 * /api/workhistory/...
 */
const createError = require(`http-errors`);
const express = require(`express`);
const router = express.Router();

const db_pd_code = require(`../../database/pd_code`);
const db_cn_equip_work_rec = require(`../../database/cn_equip_work_rec`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `worktype`: {
            results = await db_pd_code.getInfoByType('WK');
            break;
        }
        case `worklist`: {
            const { equip_id } = req.query;
            results = await db_cn_equip_work_rec.getListByEquipId(equip_id);
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `work`: {
            const { equip_id, work_dt, work_code, worker_name, text } = req.body;
            
            let response = await db_cn_equip_work_rec.insertWork({ equip_id, work_dt, work_code, worker_name, text });

            if(response === undefined) {
                return next();
            } else if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') {
                return next(response);
            }

            if(response.affectedRows === 1) {
                results = { msg: '작업이 등록됐습니다', insertId: response.insertId };
            } else {
                results = { msg: '작업이 추가되지 않았습니다' };
            }
            break;
        }
        case `get`: {
            const { ids, startDate, endDate } = req.body;
            
            results = await db_cn_equip_work_rec.getReport(ids.toString(), startDate, endDate);
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

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `job`: {
            const { index, equip_id, work_dt, work_code, worker_name, text } = req.body;
            const set = { equip_id, work_dt, work_code, worker_name, text };
            const where = { index };

            const response = await db_cn_equip_work_rec.updateWork(set, where);
            if(response === undefined) {
                return next();
            } else if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') {
                return next(response);
            }

            results = Object.assign(response, req.body);
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
        case `job`: {
            const { index } = req.body;
            const where = { index };

            const response = await db_cn_equip_work_rec.deleteWork(where);
            if(response === undefined) {
                return next();
            } else if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') {
                return next(response);
            }

            results = Object.assign(response, where);
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