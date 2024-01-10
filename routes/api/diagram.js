/**
 * by shkoh 20200923
 * Diagram 페이지들에서 사용할 Route 부분
 * 
 * 일반 diagram: /api/diagram/...
 * 우리FIS diagram 전용: /api/diagram/wrfis
 */
const createError = require('http-errors');
const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');
const mssql = require('mssql');

const ws = require(`../../config/ws`);
const uploader = require(`../../config/fileUploadDiagram`);

const db_procedure = require(`../../database/procedure`);
const db_tree = require(`../../database/tree`);
const db_diagram = require(`../../database/cn_diagram`);
const db_user_cmd_history = require(`../../database/lg_user_cmd_history`);
const db_equipment = require(`../../database/cn_equipment`);
const db_sensor = require(`../../database/cn_sensor`);
const db_pms = require(`../../database/cn_pms`);
const db_st_aisensor = require(`../../database/st_aisensor`);

const { bacnetWrite } = require('../../config/bacnetController');

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `tree`: {
            const { type, equip_id } = req.query;
            const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
            if(type === `group`) {
                results = await db_tree.getGroupTree(group_ids.groupList);
            } else if(type === `sensor`) {
                if(equip_id) {
                    results = await db_tree.getSensorsByEquipmentId(equip_id);
                } else {
                    results = await db_tree.getOnlySensorTreeNode(group_ids.groupList);
                }
            } else if(type === `filtering`) {
                const { id, filter } = req.query;
                results = await db_tree.getFilteringTreeByEquipmentIdAndSensorName(id, filter);
            }
            break;
        }
        case `getitem`: {
            const { id } = req.query;
            results = (await db_diagram.getDiagramItems({ index: parseInt(id) }))[0];
            break;
        }
        case `getsensor`: {
            const { id } = req.query;
            results = await db_sensor.getInfo(id);
            break;
        }
        case `getsensorinfowithvalue`: {
            const { id } = req.query;
            results = await db_sensor.getInfoWithValue(id);
            break;
        }
        case `itemdetail`: {
            const { id, type } = req.query;
            results = await db_diagram.getTypeInfo(type, id);
            // by shkoh 20200928: cytoscape를 구성하는 item의 상세정보 중에서 DB에 데이터가 존재하지 않는 경우에는 빈 데이터만 전달함
            if(results === undefined) {
                results = {};
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

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const inserted = {};
            for(const key of [ 'group_id', 'equip_id', 'sensor_id', 'diagram', 'pos_x', 'pos_y', 'type', 'name', 'edge_targets' ]) {
                let val = req.body[key];

                if(val) {
                    if(key === 'name' && req.body[key].length === 0) {
                        break;
                    }

                    if(key === 'group_id' || key === 'equip_id' || key === 'sensor_id') {
                        val = val === '' ? null : Number(val);
                    } else if(key === 'pos_x' || key === 'pos_y') {
                        val = parseFloat(val);
                    }

                    Object.defineProperty(inserted, key, {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: val
                    });
                }
            }

            if(Object.keys(inserted).length > 0) {
                results = await db_diagram.insertDiagramItem(inserted);
            }

            break;
        }
        case `ctrl`: {
            try {
                const { mode, equip_id, sensor_id } = req.body;
                const command = mode === 'start' ? 'hvac-on' : 'hvac-off';

                if(isNaN(equip_id) || isNaN(sensor_id)) {
                    throw new Error('equip_id 혹은 sensor_id의 형식이 올바르지 않습니다');
                }

                let response = await db_user_cmd_history.insertUserCommand({
                    user_id: req.session.user.id,
                    command: command,
                    func_no: 0,
                    equip_id: Number(equip_id),
                    sensor_id: Number(sensor_id),
                    last_proc_name: 'WEBSEV'
                });

                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) {
                    throw new Error(response);
                }

                ws.ubiGuardWebSocketSendData({
                    seq: response.insertId,
                    command: command,
                    'equip-id': Number(equip_id),
                    'sensor-id': Number(sensor_id)
                });

                const is_run_text = mode === 'start' ? '가동' : '정지';
                results = { msg: `항온항습기 ${is_run_text} 제어명령을 전달했습니다` };
            } catch(err) {
                results = err;
            }
            break;
        }
        case `lightctrl`: {
            try {
                const { cmd, equip_id, sensor_id } = req.body;
                
                const command = cmd === 'ON' ? 'lamp-on' : cmd === 'OFF' ? 'lamp-off' : '';
                if(command === '') {
                    throw new Error('제어명령이 정확하지 않습니다. 정확한 제어명령을 확인해주세요');
                    return;
                }

                if(isNaN(equip_id) || isNaN(sensor_id)) {
                    throw new Error('설비의 id 형식이 올바르지 않습니다');
                    return;
                }

                let write_result = undefined;
                try {
                    const sensor = await db_diagram.getTypeInfo('light', `S_${sensor_id}`);
                    write_result = await bacnetWrite({ ip: sensor.ip, port: sensor.port, ctrl: sensor.ctrl_info, cmd: command });
                } catch(err_msg) {
                    write_result = err_msg;
                }

                let response = await db_user_cmd_history.insertUserCommand({
                    user_id: req.session.user.id,
                    command: command,
                    func_no: 0,
                    equip_id: Number(equip_id),
                    sensor_id: Number(sensor_id),
                    last_proc_name: 'WEBSEV',
                    result: write_result === command ? 'S' : 'F',
                    error_text: write_result
                });

                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) {
                    throw new Error(response);
                }

                // ws.ubiGuardWebSocketSendData({
                //     seq: response.insertId,
                //     command: command,
                //     'equip-id': Number(equip_id),
                //     'sensor-id': Number(sensor_id)
                // });

                if(write_result === command) {
                    results = { msg: `지정한 조명설비에 ${cmd} 제어명령을 전달했습니다. 설비 반영까지 수초가 걸릴 수도 있습니다.` };
                } else {
                    throw new Error(write_result);
                }
            } catch(err) {
                results = err;
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

router.delete(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            results = await db_diagram.deleteDiagramItem({ index: req.body.delete_id });
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

router.patch(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const { id } = req.body;
            
            const set = {};
            for(const key of [ 'type', 'group_id', 'equip_id', 'sensor_id', 'pos_x', 'pos_y', 'edge_targets', 'name' ]) {
                let val = req.body[key];

                if(key === 'name' && val === undefined) {
                    continue;
                }

                if(key === 'group_id' || key === 'equip_id' || key === 'sensor_id') {
                    val = !val || (val === '') ? null : Number(val);
                } else if(key === 'pos_x' || key === 'pos_y') {
                    val = parseFloat(val);
                } else if(val === undefined) {
                    continue;
                }
                
                Object.defineProperty(set, key, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: val
                });
            }

            const where = { index: Number(id) }
            
            results = await db_diagram.updateDiagramItem(set, where);
            break;
        }
        case 'itempositions': {
            const nodes = JSON.parse(req.body.new_pos);
            if(nodes.length > 0) {
                for(let node of nodes) {
                    const set = {
                        pos_x: parseFloat(node.pos_x),
                        pos_y: parseFloat(node.pos_y)
                    };
    
                    const where = { index: node.index };
    
                    let response = await db_diagram.updateDiagramItem(set, where);
                    if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
                }
                
                results = { msg: `${nodes.length}개의 항목의 위치를 변경 저장하였습니다` };
            } else {
                results = { msg: `위치가 변경된 항목이 없습니다` };
            }
            
            break;
        }
        case 'itemedges': {
            const { id, edge_targets } = req.body;

            const set = { edge_targets };
            const where = { index: Number(id) }
            
            results = await db_diagram.updateDiagramItem(set, where);
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
/* by shkoh 20210225: woori fis router start                                                                                                               */
/***********************************************************************************************************************************************************/
router.get(`/wrfis/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const { type } = req.query;
            results = await db_diagram.getDiagramItems({ diagram: type });
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

router.post(`/wrfis/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `upload`: {
            results = await new Promise((resolve, reject) => {
                uploader.single(`wrfis`)(req, req, async (err) => {
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

router.delete(`/wrfis/:mode`, async (req,res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `bkimage`: {
            const { type } = req.query;

            const image_path = path.join(__dirname, `../../public/img/diagram/wrfis/${type}`);
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
/* by shkoh 20210225: woori fis router end                                                                                                                 */
/***********************************************************************************************************************************************************/

/***********************************************************************************************************************************************************/
/* by shkoh 20210225: woori fis pms router start                                                                                                           */
/***********************************************************************************************************************************************************/
router.get(`/wrfis/pms/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `info`: {
            const { id } = req.query;
            results = await db_equipment.getPopupInfo(id);
            break;
        }
        case `chartdata`: {
            const { id } = req.query;
            results = await db_sensor.getPMSSEMSInfoList(id);
            break;
        }
        case `griddata`: {
            const { id, type } = req.query;
            results = await db_pms.getBreakerList(id, type);
            break;
        }
        case `breaker`: {
            const { e_id, b_id } = req.query;
            results = await db_pms.getBreakerInfo(e_id, b_id);
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

router.post(`/wrfis/pms/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `breaker`: {
            const data = req.body;
            const info = {
                equip_id: data.equip_id,
                breaker_id: data.breaker_id,
                which: data.which,
                b_use: data.b_use,
                b_three_phase: data.b_three_phase,
                pms_number: data.pms_number,
                current_total: data.current_total ? data.current_total : null,
                current_r: data.current_r ? data.current_r : null,
                current_s: data.current_s ? data.current_s : null,
                current_t: data.current_t ? data.current_t : null,
                power_factor: data.power_factor ? data.power_factor : null,
                power: data.power ? data.power : null,
                amount_power: data.amount_power ? data.amount_power : null
            }

            const response = await db_pms.setBreakerInfo(info);
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError' || response.constructor.name === `ServerError` || response.constructor.name === `Error`) return next(response);
            results = info;
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
/***********************************************************************************************************************************************************/
/* by shkoh 20210225: woori fis pms router start                                                                                                           */
/***********************************************************************************************************************************************************/

/***********************************************************************************************************************************************************/
/* by shkoh 20210225: woori fis bms router start                                                                                                           */
/***********************************************************************************************************************************************************/
router.get(`/wrfis/bms/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `info`: {
            const { id } = req.query;
            results = await db_equipment.getPopupInfo(id);
            break;
        }
        case `data`: {
            const { id, day } = req.query;
            results = await db_st_aisensor.wrfisBmsBTECHCQ2(day, id);
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
/* by shkoh 20210225: woori fis bms router end                                                                                                             */
/***********************************************************************************************************************************************************/

/***********************************************************************************************************************************************************/
/* by shkoh 20211101: icomer tester router start                                                                                                           */
/***********************************************************************************************************************************************************/
router.get(`/tester/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `item`: {
            const { type } = req.query;
            results = await db_diagram.getDiagramItems({ diagram: type });
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

router.post(`/tester/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `upload`: {
            results = await new Promise((resolve, reject) => {
                uploader.single(`tester`)(req, req, async (err) => {
                    if(err) reject(err);
                    else {
                        const file_name = req.file.originalname.normalize(`NFC`);
                        resolve({ msg: `배경이미지 ${file_name}(size: ${Math.round(req.file.size / 1000)}KB)의 업로드를 완료했습니다` });
                    }
                });
            });
            break;
        }
        case `item`: {
            try {
                results = await new Promise((resolve, reject) => {
                    const { last_idx, name, file_name } = req.body;
                    const item_path = path.join(__dirname, '../../public/javascripts/diagram/tester/icon/icon.json');
                    fs.readFile(item_path, (err, data) => {
                        if(err) {
                            console.error(err);
                            res.end();
                            return;
                        }

                        const items = JSON.parse(data);
                        const new_item = {
                            "index": Number(last_idx) + 1,
                            "type": "icontester",
                            "obj_id": 0,
                            "name": name,
                            "level": 0,
                            "pos_x": 0.5,
                            "pos_y": 0.5,
                            "bUse": "Y",
                            "icon": file_name,
                        }

                        items.push(new_item);

                        fs.writeFileSync(item_path, JSON.stringify(items));

                        resolve(new_item);
                    });
                });
            } catch(err) {
                console.error(err);
            }
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

router.patch(`/tester/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'itempositions': {
            results = await new Promise((resolve, reject) => {
                const nodes = JSON.parse(req.body.new_pos);
                
                const item_path = path.join(__dirname, '../../public/javascripts/diagram/tester/icon/icon.json');
                fs.readFile(item_path, (err, data) => {
                    if(err) {
                        console.error(err);
                        res.end();
                        return;
                    }

                    let rst = ``;
                    const items = JSON.parse(data);
                    
                    if(nodes.length > 0) {
                        for(let node of nodes) {
                            const set = {
                                pos_x: parseFloat(node.pos_x),
                                pos_y: parseFloat(node.pos_y)
                            };

                            items.forEach((item) => {
                                if(item.index === Number(node.index)) {
                                    item.pos_x = set.pos_x;
                                    item.pos_y = set.pos_y;
                                }
                            });
                        }
                        
                        rst = { msg: `${nodes.length}개의 항목의 위치를 변경 저장하였습니다` };
                    } else {
                        rst = { msg: `위치가 변경된 항목이 없습니다` };
                    }
                    
                    fs.writeFileSync(item_path, JSON.stringify(items));

                    resolve(rst);
                });
            });

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

router.delete(`/tester/:mode`, async (req,res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `bkimage`: {
            const { type } = req.query;

            const image_path = path.join(__dirname, `../../public/img/diagram/tester/${type}`);
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
        case `item`: {
            const { delete_id } = req.body;

            const icon_path = path.join(__dirname, `../../public/img/diagram/tester/items/${delete_id}`);
            const is_exist = fs.existsSync(icon_path);
            if(is_exist) {
                try {
                    const inner_files = fs.readdirSync(icon_path);
                    inner_files.forEach((file) => {
                        fs.unlinkSync(path.join(icon_path, file));
                    });
                    fs.rmdirSync(icon_path);

                    results = await new Promise((resolve, reject) => {
                        const { delete_id } = req.body;
                        const item_path = path.join(__dirname, '../../public/javascripts/diagram/tester/icon/icon.json');
                        fs.readFile(item_path, (err, data) => {
                            if(err) {
                                console.error(err);
                                res.end();
                                return;
                            }
    
                            const items = JSON.parse(data);
                            
                            const idx = items.findIndex((item) => { return item.index === Number(delete_id) });
                            items.splice(idx, 1);
    
                            fs.writeFileSync(item_path, JSON.stringify(items));
    
                            resolve({
                                msg: `아이템을 삭제했습니다`
                            });
                        });
                    });
                } catch(err) {
                    results = createError(err);
                }
            } else {
                results = createError({
                    status: 500,
                    statusText: `아이콘이 존재하지 않습니다`
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
/* by shkoh 20211101: icomer tester router end                                                                                                             */
/***********************************************************************************************************************************************************/

/***********************************************************************************************************************************************************/
/* by shkoh 20211229: kepco router start                                                                                                                   */
/***********************************************************************************************************************************************************/
router.get(`/kepco/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `items`: {
            results = [];
            
            const { type } = req.query;
            const items = await db_diagram.getDiagramItems({ diagram: type });
            for(const item of items) {
                const type_info = await db_diagram.getTypeInfo(item.type, item.obj_id);
                results.push(Object.assign(item, type_info));
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

router.get(`/kepco/accesssystem/eventlog`, async (req, res, next) => {
    // by shkoh 20220331: 한국전력 대전 ICT 센터의 출입 시스템과의 데이터연동은 MSSQL을 활용함으로 이에 따로 별도 처리를 위한 구분을 짓는다
    try {
        const access_config_path = path.join(__dirname, '..', '..', 'config', 'mssql.config.json');
        const access_config = fs.readFileSync(access_config_path);

        const { kepco: { accessSystem } } = JSON.parse(access_config);

        const pool = new mssql.ConnectionPool(accessSystem.connection);
        pool.connect(async (err) => {
            if(err) {
                console.error(err);
                res.status(501).send(err);
            } else {
                // by shkoh 20220404: 한국전력 대전 ICT 내에 등록된 출입문 시스템 설비만의 정보를 추출하는데 사용함
                // by shkoh 20220404: TAMS ODBC를 사용하는 출입문에만 적용. 특별하게 v_door_status 프로시저를 통해서 정보를 가져옴으로 해당 정보에서 특정 ID를 추출함
                const door_equips = await db_equipment.getDoorEquipmentsForKepco();
                const door_id_string = door_equips.map(({ ud }) => {
                    const [ device_id, door_id, lock_id ] = ud.split(',');
                    return `${device_id.padStart(3, '0')}${door_id}`;
                });

                const access_system_query = accessSystem.query.replace(/\$\$1/g, door_id_string.toString());
                pool.query(access_system_query, (err, result) => {
                    pool.close();

                    if(err) {
                        console.error(err);
                        res.status(501).send(err);
                    } else {
                        result.recordset.forEach((item) => {
                            const door_item = door_equips.find((door_item) => {
                                const [ device_id, door_id, lock_id ] = door_item.ud.split(',');
                                return Number(device_id) === Number(item.deviceId) && Number(door_id) === Number(item.doorId);                              
                            });
                            
                            if(door_item) item.sensor_id = door_item.sensor_id;
                        });

                        res.send(result.recordset);
                    }
                });
            }
        });
    } catch(err) {
        console.error(err);
        res.end();
    }
});

router.post(`/kepco/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `upload`: {
            results = await new Promise((resolve, reject) => {
                uploader.single(`kepco`)(req, req, async (err) => {
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

router.delete(`/kepco/:mode`, async (req,res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `bkimage`: {
            const { type } = req.query;

            const image_path = path.join(__dirname, `../../public/img/diagram/kepco/${type}`);
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
/* by shkoh 20211229: kepco router end                                                                                                                     */
/***********************************************************************************************************************************************************/

/***********************************************************************************************************************************************************/
/* by shkoh 20230508: didc router start                                                                                                                    */
/***********************************************************************************************************************************************************/
router.get(`/didc/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case `items`: {
            results = [];
            
            const { type } = req.query;
            const items = await db_diagram.getDiagramItems({ diagram: type });
            
            for(const item of items) {
                const type_info = (item && item.type && item.obj_id) ? await db_diagram.getTypeInfo(item.type, item.obj_id) : {};
                results.push(Object.assign(item, type_info));
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
/* by shkoh 20230508: didc router end                                                                                                                      */
/***********************************************************************************************************************************************************/
module.exports = router;