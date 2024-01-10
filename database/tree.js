const { pool, queries } = require(`../config/mariadb.config`);

const getNormalGroupTree = async () => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.normal);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getOnlyGroupTree = async (group_ids) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.onlyGroup, [ group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getGroupTree = async (group_ids) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.group, [ group_ids, group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getOnlySensorTreeNode = async (group_ids) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.sensor, [ group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getCodeTree = async (group_ids) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.code, [ group_ids, group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPredefineCodeTree = async () => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.pdCode);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPredefineEquipmentTree = async () => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.tree.pdEquipment);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getFilteringTreeByEquipmentIdAndSensorName = async (equip_id, filter_text) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const rows = await connection.query(query.tree.filtering.byEquipmentIdAndSensorName, [ equip_id, equip_id, equip_id, filter_text ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorsByEquipmentId = async (equip_id) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const rows = await connection.query(query.tree.sensorsByEquipmentId, [ equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getNormalGroupTree,
    getOnlyGroupTree,
    getGroupTree,
    getOnlySensorTreeNode,
    getCodeTree,
    getPredefineCodeTree,
    getPredefineEquipmentTree,
    getFilteringTreeByEquipmentIdAndSensorName,
    getSensorsByEquipmentId
}