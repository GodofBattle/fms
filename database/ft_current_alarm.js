const { pool, queries } = require(`../config/mariadb.config`);

const getMonitoringAlarmList = async (group_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ft_current_alarm.monitoring, [ group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getStatisticsAlarmList = async (group_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ft_current_alarm.statistics, [ group_ids ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteCurrentAlarm = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ft_current_alarm.delete, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteCurrentAlarmByEquipId = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        const delete_query = query.ft_current_alarm.delete.replace(/\?/, `sensor_id IN (SELECT cs.sensor_id FROM cn_sensor cs WHERE cs.b_delete = 'N' AND cs.equip_id = ${equip_id})`);
        const row = await connection.query(delete_query);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssAlarmList = async (group_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.ft_current_alarm.pss.alarmlist, [ group_ids ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAlarmListView = async () => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.ft_current_alarm.external.list);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getMonitoringAlarmList,
    getStatisticsAlarmList,
    deleteCurrentAlarm,
    deleteCurrentAlarmByEquipId,
    getPssAlarmList,
    getAlarmListView
}