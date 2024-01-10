const { pool, queries } = require(`../config/mariadb.config`);

const getInfo = async (pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.get, [ pd_equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertPredefineSensor = async (pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.insert, [ pd_equip_id, pd_equip_id, pd_equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updatePredefineSensor = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.update, [ set, where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updatePredefineSensorToModbusId = async (pd_equip_id, mc_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.updateToModbudId, [ mc_id, pd_equip_id, mc_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchPredefineSensor = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let repeat_query = ``;
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.pd_sensor.update;
        const rows = await connection.query(repeat_query, array_set);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deletePredefineSensorAndResetId = async (pd_equip_id, pd_sensor_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.deleteAndIndexReset, [ pd_sensor_id, pd_equip_id, pd_sensor_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deletePredefineSensor = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor.delete, [ where ]);
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
    insertPredefineSensor,
    updatePredefineSensor,
    updatePredefineSensorToModbusId,
    batchPredefineSensor,
    deletePredefineSensorAndResetId,
    deletePredefineSensor
}