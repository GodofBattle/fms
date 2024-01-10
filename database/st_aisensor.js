const { pool, queries } = require(`../config/mariadb.config`);

const getAISensorValueStatistics = async (info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let date = new Date(info.date);

        const sensor_id = info.sensor_id;
        const end_date = new Date(info.date);
        const start_date = new Date(info.period.includes('day') ? date.setMonth(date.getMonth() - 1) : date.setDate(date.getDate() - 1));

        const ai_sensor_query = query.st_aisensor.sensorChart.replace(/st_aisensor_\$\$/i, `st_aisensor_${info.period}`);
        
        const row = await connection.query(ai_sensor_query, [ sensor_id, start_date, end_date ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAIDataStatistics = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = info.startDate;
        let end_date = info.endDate;
        let period = `CONCAT(DATE_FORMAT(u.start_date, '%Y/%m/%d %H:%i'), ' ~ ', DATE_FORMAT(u.end_date, '%Y/%m/%d %H:%i'))`;

        switch(info.table) {
            case 'day': {
                start_date = info.startDate.substr(0, 10);
                end_date = info.endDate.substr(0, 10);
                period = `DATE_FORMAT(u.stat_date, '%Y/%m/%d')`;
                break;
            }
            case 'month': {
                start_date = `${info.startDate}/01`;
                end_date = `${info.endDate}/01`;
                period = `DATE_FORMAT(u.stat_date, '%Y/%m')`;
                break;
            }
        }

        let sub_query = '';
        Object.keys(info.select).forEach((equip_id, index, arr) => {
            const sub = query.st_aisensor.dataStatistics
                .replace(/\$\$1/, info.table)
                .replace(/\$\$2/, equip_id)
                .replace(/\$\$3/, info.select[equip_id].toString())
                .replace(/\$\$4/, start_date)
                .replace(/\$\$5/, end_date)
            
            sub_query += sub;
            
            if(index < arr.length - 1) sub_query += ' UNION ALL '
        });

        let ai_sensor_query = `SELECT ce.equip_id, cs.sensor_id, ce.equip_name, cs.sensor_name, ${period} AS period, u.min_value, u.avr_value, u.max_value, ROUND(u.max_value - u.min_value, 2) AS range_value, IFNULL(pc.disp_unit, '') AS unit FROM (${sub_query}) u LEFT JOIN cn_equipment ce ON u.equip_id = ce.equip_id JOIN cn_sensor cs ON u.sensor_id = cs.sensor_id JOIN pd_code pc ON cs.sensor_code = pc.code_id LIMIT ${info.skip}, ${info.pageSize};`;

        const rows = await connection.query(ai_sensor_query);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAIDatatStatisticsTotal = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = info.startDate;
        let end_date = info.endDate;

        switch(info.table) {
            case 'day': {
                start_date = info.startDate.substr(0, 10);
                end_date = info.endDate.substr(0, 10);
                break;
            }
            case 'month': {
                start_date = `${info.startDate}/01`;
                end_date = `${info.endDate}/01`;
                break;
            }
        }
        
        let equip_ids = [];
        let sensor_ids = [];
        Object.keys(info.select).forEach((equip_id) => {
            equip_ids.push(equip_id);
            sensor_ids = sensor_ids.concat(info.select[equip_id]);
        });

        const ai_sensor_total_query = query.st_aisensor.dataStatisticsTotal
            .replace(/\$\$1/, info.table)
            .replace(/\$\$2/, equip_ids.toString())
            .replace(/\$\$3/, sensor_ids.toString())
            .replace(/\$\$4/, start_date)
            .replace(/\$\$5/, end_date);

        const rows = await connection.query(ai_sensor_total_query);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAIDataListByEquipment = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = info.startDate;
        let end_date = info.endDate;
        let period = `CONCAT(DATE_FORMAT(sa.start_date, '%Y/%m/%d %H:%i'), ' ~ ', DATE_FORMAT(sa.end_date, '%Y/%m/%d %H:%i'))`;

        switch(info.table) {
            case 'day': {
                start_date = info.startDate.substr(0, 10);
                end_date = info.endDate.substr(0, 10);
                period = `DATE_FORMAT(sa.stat_date, '%Y/%m/%d')`;
                break;
            }
            case 'month': {
                start_date = `${info.startDate}/01`;
                end_date = `${info.endDate}/01`;
                period = `DATE_FORMAT(sa.stat_date, '%Y/%m')`;
                break;
            }
        }

        const max_row_size = 100000;
        let rows = [];
        
        for(let idx in Object.keys(info.select)) {
            const equip_id = Object.keys(info.select)[idx];
            const q = query.st_aisensor.dataListByEquipment
                .replace(/\$\$1/, period)
                .replace(/\$\$2/, info.table)
                .replace(/\$\$3/, equip_id)
                .replace(/\$\$4/, info.select[equip_id].toString())
                .replace(/\$\$5/, start_date)
                .replace(/\$\$6/, end_date);
            
            const r = await connection.query(q);
            rows = rows.concat(r);
            
            if(rows.length > max_row_size) break;
        }

        return rows.length > max_row_size ? rows.slice(0, max_row_size) : rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisUPSDaily = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let ups_daily_query = '';
        const hours = [ '07:00', '11:00', '15:00', '19:00', '23:00', '03:00' ];

        for(const [idx, hour] of Object.entries(hours)) {
            const q = query.st_aisensor.wrfis.reports.upsDaily
                .replace(/\$TIME\$/g, hour)
                .replace(/\$T1\$/g, `${info.target}-1`)
                .replace(/\$T2\$/g, `${info.target}-2`)
                .replace(/\$T3\$/g, `${info.target}-3`)
                .replace(/\$T4\$/g, `${info.target}-4`)
                .replace(/\$DATETIME\$/g, `${info.date.replace(/\//g, '-')} ${hour}`)
                .replace(/\$EMPTY\$/g, `-`);
            
            ups_daily_query += q;
            if(Number(idx) + 1 < hours.length) ups_daily_query += ' UNION ALL ';
        }
        
        const rows = await connection.query(ups_daily_query);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisTempHumiStat = async (id, table, start, end) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = start;
        let end_date = end;

        if(table === 'month') {
            start_date = `${start}/01`;
            end_date = `${end}/01`;
        }
        
        const rows = await connection.query(query.st_aisensor.wrfis.reports.temphumiStat.replace(/\$\$1/, table), [ id, id, start_date, end_date ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisBmsBTECHCQ2 = async (day, equip_id) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        const rows = await connection.query(query.st_aisensor.wrfis.bms.BTECH_CQ2, [ day, equip_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisUpsUsagePower = async (table, start, end) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = start;
        let end_date = end;

        if(table === 'month') {
            start_date = `${start}/01`;
            end_date = `${end}/01`;
        }
        
        const rows = await connection.query(query.st_aisensor.wrfis.reports.ups_usage_power.replace(/\$\$1/, table), [ start_date, end_date ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisUpsUsageLoad = async (table, start, end) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        let start_date = start;
        let end_date = end;

        if(table === 'month') {
            start_date = `${start}/01`;
            end_date = `${end}/01`;
        }
        
        const rows = await connection.query(query.st_aisensor.wrfis.reports.ups_usage_load.replace(/\$\$1/, table), [ start_date, end_date ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisReportPUE = async (table, start, extra) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        
        let pue_query = extra === 'true' ? query.st_aisensor.wrfis.reports.pueextra : query.st_aisensor.wrfis.reports.pue;
        
        let idx_replace_text = ``;
        let start_date = ``;
        let interval = ``;
        
        switch(table) {
            case `month`: {
                idx_replace_text = `MONTH(sam.stat_date)`;
                start_date = `${start}/01/01`;
                interval = `YEAR`;
                break;
            }
            case `day`: {
                idx_replace_text = `DAY(sam.stat_date)`;
                start_date = `${start}/01`;
                interval = `MONTH`;
                break;
            }
            case `hour`: {
                idx_replace_text = `HOUR(sam.stat_date)`;
                start_date = `${start} 00:00`;
                interval = `DAY`;
                break;
            }
        }

        pue_query = pue_query.replace(/\$\$1/g, idx_replace_text)
                             .replace(/\$\$2/g, table)
                             .replace(/\$\$3/g, start_date)
                             .replace(/\$\$4/g, interval);

        const rows = await connection.query(pue_query);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisReportHVAC = async (id, table, start) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        
        let hvac_query = query.st_aisensor.wrfis.reports.hvac;
        let start_date = ``;
        let interval = ``;
        
        switch(table) {
            case `month`: {
                start_date = `${start}/01`;
                interval = 'MONTH';
                break;
            }
            case `day`: {
                start_date = `${start}`;
                interval = 'DAY';
                break;
            }
        }

        hvac_query = hvac_query.replace(/\$\$1/g, table)
                               .replace(/\$\$2/g, start_date)
                               .replace(/\$\$3/g, interval);

        const rows = await connection.query(hvac_query, [ id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const wrfisReportTempHumiAvg = async (table, start) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        
        let th_avg_query = query.st_aisensor.wrfis.reports.temphumiStatAvg;
        
        let idx_replace_text = ``;
        let start_date = ``;
        let interval = ``;
        
        switch(table) {
            case `month`: {
                idx_replace_text = `MONTH(sam.stat_date)`;
                start_date = `${start}/01/01`;
                interval = `YEAR`;
                break;
            }
            case `day`: {
                idx_replace_text = `DAY(sam.stat_date)`;
                start_date = `${start}/01`;
                interval = `MONTH`;
                break;
            }
            case `hour`: {
                idx_replace_text = `HOUR(sam.stat_date)`;
                start_date = `${start} 00:00`;
                interval = `DAY`;
                break;
            }
        }

        th_avg_query = th_avg_query.replace(/\$\$1/g, idx_replace_text)
                                   .replace(/\$\$2/g, table)
                                   .replace(/\$\$3/g, start_date)
                                   .replace(/\$\$4/g, interval);

        const rows = await connection.query(th_avg_query);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getAISensorValueStatistics,
    getAIDataStatistics,
    getAIDatatStatisticsTotal,
    getAIDataListByEquipment,
    wrfisUPSDaily,
    wrfisTempHumiStat,
    wrfisBmsBTECHCQ2,
    wrfisUpsUsagePower,
    wrfisUpsUsageLoad,
    wrfisReportPUE,
    wrfisReportHVAC,
    wrfisReportTempHumiAvg
}