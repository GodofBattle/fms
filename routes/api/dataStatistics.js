/**
 * by shkoh 20200626
 * 데이터통계 페이지에서 사용할 데이터 Route
 * 
 * /api/data/statistics/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_st_aisensor = require(`../../database/st_aisensor`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const { type } = req.query
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            if(type === 'group') results = await db_tree.getGroupTree(group_ids.groupList);
            else if(type === 'sensor') results = await db_tree.getOnlySensorTreeNode(group_ids.groupList);
            break;
        }
    }

    if(results === undefined) {
        next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `get`: {
            results = await db_st_aisensor.getAIDataListByEquipment(req.body);
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