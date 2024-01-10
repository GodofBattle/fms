const createError = require(`http-errors`);
const express = require(`express`);
const router = express.Router();

const path = require('path');
const fs = require('fs');

const ws = require(`../../config/ws`);
const uploader = require(`../../config/fileUploadDiagram`);

const db_rack_diagram = require(`../../database/cn_rack_diagram`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `getitem`: {
            const { id } = req.query;
            results = (await db_rack_diagram.getItems({ index: parseInt(id) }))[0];
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
            const inserted_data = {
                page: req.body.page,
                type: `default`
            };

            for(const key of ['name', 'pos_x', 'pos_y', 'z_index', 'type', 'p_name', 'width', 'height', 'equip_id']) {
                if(req.body[key]) {
                    inserted_data[key] = req.body[key];
                }
            }

            results = await db_rack_diagram.insertItem(inserted_data);
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

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const { id, name, p_name, pos_x, pos_y, z_index, width, height, type, equip_id } = req.body;

            const set = {
                name: name,
                p_name: p_name,
                pos_x: parseFloat(pos_x),
                pos_y: parseFloat(pos_y),
                z_index: parseInt(z_index),
                width: width !== '' ? width : null,
                height: height !== '' ? height : null,
                type: type,
                equip_id: Number.isInteger(Number(equip_id)) ? Number(equip_id) : null
            };

            const where = {
                index: Number(id)
            }

            results = await db_rack_diagram.updateItem(set, where);            
            break;
        }
        case `itempositions`: {
            const nodes = JSON.parse(req.body.new_pos);
            if(nodes.length > 0) {
                for(let node of nodes) {
                    const set = {
                        pos_x: parseFloat(node.pos_x),
                        pos_y: parseFloat(node.pos_y)
                    };

                    const where = { index: node.index };

                    let response = await db_rack_diagram.updateItem(set, where);
                    if(response.constructor.name === `SqlError` || response.constructor.name === `TypeError` || response.constructor.name === `ServerError` || response.constructor.name === `Error`) {
                        return next(response);
                    }
                }

                results = {
                    msg: `${nodes.length}개의 항목의 위치를 변경 저장하였습니다`
                }
            } else {
                results = {
                    msg: `위치가 변경된 항목이 없습니다`
                }
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

router.delete(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            results = await db_rack_diagram.deleteItem({ index: req.body.delete_id });
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

/***********************************************************************************************************************************************************/
/* by shkoh 20230518: didc router start                                                                                                                    */
/***********************************************************************************************************************************************************/
router.get(`/didc/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `items`: {
            results = [];

            const { page } = req.query;
            const items = await db_rack_diagram.getItems({ page });
            for(const item of items) {
                const type_info = await db_rack_diagram.getTypeInfo(item.type, item.equip_id);
                results.push(Object.assign(type_info, item));
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

router.post(`/didc/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `upload`: {
            results = await new Promise((resolve, reject) => {
                uploader.single(`didc`)(req, req, async (err) => {
                    if(err) reject(err);
                    else {
                        const file_name = req.file.originalname.normalize(`NFC`);
                        resolve({ msg: `배경이미지 ${file_name}(size: ${Math.round(req.file.size / 1000)}KB)의 업로드를 완료했습니다` });
                    }
                });
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

router.delete(`/didc/:mode`, async (req,res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `bkimage`: {
            const { type } = req.query;

            const image_path = path.join(__dirname, `../../public/img/diagram/didc/${type}`);
            const is_exist = fs.existsSync(image_path);
            if(is_exist) {
                try {
                    const inner_files = fs.readdirSync(image_path);
                    inner_files.forEach((file) => {
                        fs.unlinkSync(path.join(image_path, file));
                    });
                    
                    results = { msg: `배경이미지가 정상적으로 삭제됐습니다` };
                } catch(err) {
                    results = createError(err);
                }
            } else {
                results = createError({
                    status : 500,
                    statusText: `배경이미지가 존재하지 않습니다`
                });
            }
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError' || results.constructor.name === `ServerError` || results.constructor.name === `Error`) {
        return next(results);
    } else {
        return res.send(results);
    }
});
/***********************************************************************************************************************************************************/
/* by shkoh 20230518: didc router end                                                                                                                      */
/***********************************************************************************************************************************************************/

module.exports = router;