/**
 * by shkoh 20200814
 * 보고서 페이지에서 사용할 Router
 * 
 * /api/reports/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_st_aisensor = require(`../../database/st_aisensor`);
const db_in_object = require(`../../database/in_object`);
const db_in_update = require(`../../database/in_update`);
const db_in_repair = require(`../../database/in_repair`);
const db_cn_pms = require(`../../database/cn_pms`);
const db_lg_disensor_history = require(`../../database/lg_disensor_history`);


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
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.get(`/wrfis/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `upsdaily`: {
            results = await db_st_aisensor.wrfisUPSDaily(req.query);
            break;
        }
        case `thstat`: {
            const { id, table, start, end } = req.query;
            results = await db_st_aisensor.wrfisTempHumiStat(id, table, start, end);
            break;
        }
        case `asset`: {
            const { start, end } = req.query;
            results = await db_in_object.getReportList(start, end);
            break;
        }
        case `assetchange`: {
            const { start, end } = req.query;
            results = await db_in_update.getReportList(start, end);
            break;
        }
        case `assetrepair`: {
            const { id, start, end } = req.query;
            results = await db_in_repair.getReportList(id, start, end);
            break;
        }
        case `pms`: {
            const { id } = req.query;
            results = await db_cn_pms.getReportInfo(id);
            break;
        }
        case `upspower`: {
            const { table, start, end } = req.query;
            results = await db_st_aisensor.wrfisUpsUsagePower(table, start, end);
            break;
        }
        case `upsload`: {
            const { table, start, end } = req.query;
            results = await db_st_aisensor.wrfisUpsUsageLoad(table, start, end);
            break;
        }
        case `pue`: {
            const { table, start, extra } = req.query;
            results = await db_st_aisensor.wrfisReportPUE(table, start, extra);
            break;
        }
        case `hvac`: {
            const { id, table, start } = req.query;
            results = await db_st_aisensor.wrfisReportHVAC(id, table, start);
            break;
        }
        case `thstatavg`: {
            const { table, start } = req.query;
            results = await db_st_aisensor.wrfisReportTempHumiAvg(table, start);
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === `TypeError`) {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;