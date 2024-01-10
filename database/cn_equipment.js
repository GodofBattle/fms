const { pool, queries } = require(`../config/mariadb.config`);

const insertEquipment = async (p_group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equipment.insert, [ p_group_id, new Date() ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateEquipment = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equipment.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getInfo = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.info, [ equip_id ]);
        return rows[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPopupInfo = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.popupInfo, [ equip_id ]);
        return rows[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }   
}

const getMapNodes = async (parent_id) => {
    let connection;

    try {
        const conditions = parent_id.substr(0, 1) === 'E' ? { code_id: parent_id } : { group_id: Number(parent_id) };

        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.map.nodes, [ conditions ]);
    
        for(const item of rows) {
            // by shkoh 20220315: 출입문의 경우에 run_state를 별도 처리함
            if(item.equip_code === 'E0008') {
                const [ type, id ] = item.id.split('_');
                const door_state = await connection.query(query.cn_sensor.door.run_state, [ id ]);
                if(door_state.length === 1) {
                    item.run_state = door_state[0].run_state;
                }
            }
        }
        
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getMapTooltip = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.map.tooltip, [ equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getStatisticsByLevel = async (group_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.statistics.byLevel, [ group_ids, group_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getStatisticsByLevelPerCode = async (equip_code) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.statistics.byLevelPerCode, [ equip_code, equip_code ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getEquipmentList = async () => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.get);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAssetEquipmentInfo = async (equip_ids) => {
    let connection;
    
    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.asset.get, [ equip_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAssetEquipmentInfoForKepco = async (equip_ids) => {
    let connection;
    
    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.kepco.asset, [ equip_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDoorEquipmentsForKepco = async () => {
    let connection;
    
    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.kepco.doors);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getEquipmentListView = async () => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equipment.external.list);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getEquipmentInfoView = async ( where ) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equipment.external.info, [ where ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertEquipment,
    updateEquipment,
    getInfo,
    getPopupInfo,
    getMapNodes,
    getMapTooltip,
    getStatisticsByLevel,
    getStatisticsByLevelPerCode,
    getEquipmentList,
    getAssetEquipmentInfo,
    getAssetEquipmentInfoForKepco,
    getDoorEquipmentsForKepco,
    getEquipmentListView,
    getEquipmentInfoView
}