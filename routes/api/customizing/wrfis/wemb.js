/**
 * by shkoh 20210303
 * Customizing >> 우리FIS >> WEMB 연동 route 부분
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require(`../../../../database/procedure`);
const db_tree = require(`../../../../database/tree`);
const db_wemb_mapping = require(`../../../../database/cn_wemb_mapping`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const { type } = req.query;
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            if(type === `group`) results = await db_tree.getGroupTree(group_ids.groupList);
            else if(type === `sensor`) results = await db_tree.getOnlySensorTreeNode(group_ids.groupList);
            else if(type === `filtering`) {
                const { id, filter } = req.query;
                results = await db_tree.getFilteringTreeByEquipmentIdAndSensorName(id, filter);
            }
            break;
        }
        case `mapper`: {
            const { pagename, objectname } = req.query;
            if(objectname) {
                results = await db_wemb_mapping.getWembMapping({ page_name: pagename }, { object_name: objectname });
            } else {
                results = await db_wemb_mapping.getWembMappingDataToPage(pagename);
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const data = req.body;
            const info = {
                page_name: data.page_name,
                object_name: data.object_name,
                group_ids: data.group_ids === '' ? null : data.group_ids,
                equip_ids: data.equip_ids === '' ? null : data.equip_ids,
                sensor_ids: data.sensor_ids === '' ? null : data.sensor_ids,
                description: data.description
            }

            const response = await db_wemb_mapping.setWembMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;
            break;
        }
        case `itempopup`: {
            const data = req.body;
            const info = {
                page_name: data.page_name,
                object_name: data.object_name,
                popup_equip_id: data.popup_equip_id === '' ? null : data.popup_equip_id
            }

            const response = await db_wemb_mapping.setWembMapping(info);
            if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;
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