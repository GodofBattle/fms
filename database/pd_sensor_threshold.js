const { pool, queries } = require(`../config/mariadb.config`);
const SqlString = require(`sqlstring`);

const getInfoBySensorCode = async (sensor_code) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor_threshold.byCode, [ sensor_code ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertThreshold = async (sensor_code) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor_threshold.insert, [ sensor_code ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchPredefineThreshold = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let repeat_query = ``;
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.pd_sensor_threshold.update;
        const rows = await connection.query(SqlString.format(repeat_query, array_set));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteThreshold = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_sensor_threshold.delete, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getInfoBySensorCode,
    insertThreshold,
    batchPredefineThreshold,
    deleteThreshold
}