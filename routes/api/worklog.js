/**
 * by shkoh 20231109
 * 작업이력(lg_work_history2)에 사용할 Route 부분
 * 
 * /api/worklog
 */

const express = require(`express`);
const router = express.Router();

const db_lg_work_history2 = require(`../../database/lg_work_history2`);

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `get`: {
            results = await db_lg_work_history2.getWorkHistory(req.body);
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