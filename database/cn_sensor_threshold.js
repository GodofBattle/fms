const { pool, queries } = require(`../config/mariadb.config`);
const SqlString = require(`sqlstring`);

const insertSensorThreshold = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor_threshold.insert, [ equip_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchThresholdInfo = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        // by shkoh 20200609: 복수의 sensor 정보만큼 update를 수행할 것임으로 업데이트 수 만큼 반복함
        let repeat_query = '';
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.cn_sensor_threshold.update;
        const rows = await connection.query(SqlString.format(repeat_query, array_set));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateThresholdInfo = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        for(const key of ['d_value_0_level', 'd_value_1_level', 'd_value_2_level', 'd_value_3_level', 'd_value_4_level', 'd_value_5_level', 'd_value_6_level', 'd_value_7_level']) {
            if(set[key] === '') {
                set[key] = null;
            }
        }
        
        const row = await connection.query(query.cn_sensor_threshold.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorThreshold = async (sensor_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor_threshold.get, [ sensor_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorThresholdByIds = async (sensor_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor_threshold.infoWithIds.replace('$$1', sensor_ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertSensorThreshold,
    batchThresholdInfo,
    updateThresholdInfo,
    getSensorThreshold,
    getSensorThresholdByIds
}