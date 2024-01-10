const { pool, queries } = require(`../config/mariadb.config`);

const insertModbusCmd = async (equip_id, pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.insert, [ equip_id, { pd_equip_id: pd_equip_id } ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteModbusCmd = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.delete, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertModbusCmdInfo = async (insert_item) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.info.insert, [ insert_item ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateModbusCmdInfo = async (set, equip_id, mc_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.info.update, [ set, equip_id, mc_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteModbusCmdInfo = async (equip_id, mc_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.info.delete, [ equip_id, mc_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getModbudCmdInfoBySensorId = async (sensor_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_modbus_cmd.info.bySensorId, [ sensor_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertModbusCmd,
    deleteModbusCmd,
    insertModbusCmdInfo,
    updateModbusCmdInfo,
    deleteModbusCmdInfo,
    getModbudCmdInfoBySensorId
}