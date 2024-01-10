const { pool, queries } = require(`../config/mariadb.config`);

const insertSensor = async (equip_id, pd_equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor.insert, [ equip_id, { pd_equip_id: pd_equip_id } ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateSensor = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchSensorInfo = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        // by shkoh 20200609: 복수의 sensor 정보만큼 update를 수행할 것임으로 업데이트 수 만큼 반복함
        let repeat_query = '';
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.cn_sensor.update;
        const rows = await connection.query(repeat_query, array_set);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getInfo = async (sensor_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor.info, [ sensor_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getInfoWithValue = async (sensor_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_sensor.infoWithValue, [ sensor_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getListPerEquipment = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.list.perEquipment, [ equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorList = async (equip_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.list.basicInfo, [ equip_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorThresholdList = async (type, equip_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.list.thresholdInfo, [ type, equip_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPMSSEMSInfoList = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.pms.semsInfo, [ equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorListView = async ( where ) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.external.list, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getSensorListBySensorIds = async (sensor_ids) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_sensor.infoWithIds.replace('$$1', sensor_ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertSensor,
    updateSensor,
    batchSensorInfo,
    getInfo,
    getInfoWithValue,
    getListPerEquipment,
    getSensorList,
    getSensorThresholdList,
    getPMSSEMSInfoList,
    getSensorListView,
    getSensorListBySensorIds
}