const { pool, queries } = require(`../config/mariadb.config`);
const SqlString = require(`sqlstring`);

const getInfo = async (pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_modbus_cmd.get, [ pd_equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertInfo = async (pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_modbus_cmd.insert, [ pd_equip_id, pd_equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchInfo = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let repeat_query = ``;
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.pd_modbus_cmd.update;
        const rows = await connection.query(SqlString.format(repeat_query, array_set));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteInfo = async (pd_equip_id, mc_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_modbus_cmd.delete, [ pd_equip_id, mc_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteInfoAndResetId = async (pd_equip_id, mc_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_modbus_cmd.deleteAndResetId, [ pd_equip_id, mc_id, pd_equip_id, mc_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteInfoByPdEquipId = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_modbus_cmd.deleteByPdEquipId, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getInfo,
    insertInfo,
    batchInfo,
    deleteInfo,
    deleteInfoAndResetId,
    deleteInfoByPdEquipId
}