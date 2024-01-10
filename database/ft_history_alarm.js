const { pool, queries } = require(`../config/mariadb.config`);

const readHistoryAlarmByEquipment = async (equip_id, start_date, end_date) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ft_history_alarm.fault.read, [ equip_id, start_date, end_date ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getHistoryAlarmByEquipments = async (alarm_levels, equip_ids, start_date, end_date) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ft_history_alarm.history.get, [ alarm_levels, equip_ids, start_date, end_date ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const recoverHistoryAlarmOfEquipment = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const update_result = await connection.query(query.ft_history_alarm.recover.equipment, [ equip_id ]);
        return update_result;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    readHistoryAlarmByEquipment,
    getHistoryAlarmByEquipments,
    recoverHistoryAlarmOfEquipment
}