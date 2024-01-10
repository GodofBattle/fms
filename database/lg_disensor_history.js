const { pool, queries } = require(`../config/mariadb.config`);

const getDISensorValuesHistory = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let date = new Date(info.date);
        const end_date = new Date(info.date);
        const start_date = new Date(info.period.includes('day') ? date.setMonth(date.getMonth() - 1) : date.setDate(date.getDate() - 1));

        let di_sensor_query = query.lg_disensor_history.disensorChart
                                .replace(/\$equipid\$/g, info.equip_id)
                                .replace(/\$sensorid\$/g, info.sensor_id)
                                .replace(/\$startdate\$/g, connection.escape(start_date))
                                .replace(/\$enddate\$/g, connection.escape(end_date));
        di_sensor_query += query.cn_sensor_threshold.get;
        
        const row = await connection.query(di_sensor_query, [ { sensor_id: info.sensor_id } ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getDISensorValuesHistory
}