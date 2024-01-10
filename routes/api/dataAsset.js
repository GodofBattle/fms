/**
 * by shkoh 20200728
 * 설비정보 페이지에서 사용할 Router
 * 
 * /api/data/assset/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_equipment = require(`../../database/cn_equipment`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const { type } = req.query;
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            if(type === `group`) results = await db_tree.getGroupTree(group_ids.groupList);
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `get`: {
            const { ids } = req.body;
            results = await db_equipment.getAssetEquipmentInfo(ids.toString());
            break;
        }
        case `kepco`: {
            const { ids } = req.body;
            results = await db_equipment.getAssetEquipmentInfoForKepco(ids.toString());
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