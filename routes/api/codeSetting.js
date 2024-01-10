/**
 * by shkoh 20200610
 * Predefine Code Setting 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/predefine/code/:mode 방식
 */
const express = require(`express`);
const router = express.Router();

const fs = require(`fs`);

const db_tree = require(`../../database/tree`);
const db_pd_code = require(`../../database/pd_code`);
const db_pd_code_description = require(`../../database/pd_code_description`);
const pd_code_description = require(`../../database/pd_code_description`);
const pd_code = require(`../../database/pd_code`);
const pd_equipment = require(`../../database/pd_equipment`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'treeicon': {
            const icon_list = [];
            fs.readdirSync(`./public/img/tree/`).forEach(file => icon_list.push(file));
            results = icon_list;
            break;
        }
        case 'codetree': {
            results = await db_tree.getPredefineCodeTree();
            break;
        }
        case 'info': {
            const { type } = req.query;
            if(type === 'unknown') results = [];
            else results = await db_pd_code.getInfoByType(type);
            break;
        }
        case 'description': {
            const { type } = req.query;
            results = await db_pd_code_description.getDescription(type);
            break;
        }
        case 'list': {
            results = await db_pd_code.getCodeList();
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
        case 'info': {
            // by shkoh 20200611: code_int인 경우에는 number 타입으로 전달해야 함
            if(req.body.code_int !== undefined) req.body.code_int = Number(req.body.code_int);
            results = await pd_code.insertCodeInfo(req.body);
            break;
        }
        case 'description': {
            const { codeType, codeDescription } = req.body;
            results = await pd_code_description.insertDescription({
                code_type: codeType,
                code_description: codeDescription
            });
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

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'info': {
            const update_info = JSON.parse(req.body.info);
            if(update_info.length > 0) {
                // by shkoh 20200611: update 명령를 반복하여 수행할 때, 동기를 이루려면 for() 문을 사용함
                for(let idx in update_info) {
                    const set = {
                        code_id: update_info[idx].code_id,
                        code_int: update_info[idx].code_int,
                        code_name: update_info[idx].code_name,
                        description: update_info[idx].description,
                        disp_unit: update_info[idx].disp_unit
                    };

                    const where = {
                        code_id: update_info[idx].old_id
                    };

                    let response = await db_pd_code.updateCodeInfo(set, where);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') {
                        return next(response);
                    }
                }

                results = { msg: `Code 변경 완료` };
            } else {
                results = { msg: `Code 변경 사항이 없습니다` };
            }
            break;
        }
        case 'description': {
            const { codeType, codeDescription } = req.body;
            const set = { code_description: codeDescription };
            const where = { code_type: codeType };
            results = await pd_code_description.updateDescription(set, where);
            break;
        }
        case 'equipment': {
            const { prev_id, code_id } = req.body;
            const set = { equip_code: code_id };
            const where = { equip_code: prev_id };
            results = await pd_equipment.updatePredefineEquipment(set, where);
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
        case 'info': {
            const { code_id } = req.body;
            results = await pd_code.deleteCodeInfo({ code_id: code_id });
            break;
        }
        case 'description': {
            const { codeType } = req.body;
            results = await pd_code_description.deleteDescription({ code_type: codeType });
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