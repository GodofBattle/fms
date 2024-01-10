const { pool, queries} = require(`../config/mariadb.config`);

function convertHour(date) {
    return `${convertDay(date)}${('0' + date.getHours().toString()).slice(-2)}`;
}

function convertDay(date) {
    return `${convertMonth(date)}${('0' + date.getDate().toString()).slice(-2)}`;
}

function convertMonth(date) {
    return `${convertYear(date)}${('0' + (date.getMonth() + 1).toString()).slice(-2)}`;
}

function convertYear(date) {
    return date.getFullYear();
}

const getAIReportData = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        
        const max_row_size = 100000;
        let rows = [];
        
        let src_query = ``;
        let start_date = ``;
        let end_date = ``;
        switch(info.table) {
            case 'hour': {
                src_query = query.rpt_st2.hourByEquipment;
                start_date = convertHour(new Date(info.startDate));
                end_date = convertHour(new Date(info.endDate));
                break;
            }
            case 'day': {
                src_query = query.rpt_st2.dayByEquipment;
                start_date = convertDay(new Date(info.startDate));
                end_date = convertDay(new Date(info.endDate));
                break;
            }
            case 'month': {
                src_query = query.rpt_st2.monthByEquipment;
                start_date = convertMonth(new Date(info.startDate));
                end_date = convertMonth(new Date(info.endDate));
                break;
            }
            case 'year': {
                src_query = query.rpt_st2.yearByEquipment;
                start_date = convertYear(new Date(info.startDate));
                end_date = convertYear(new Date(info.endDate));
                break;
            }
        }

        for(let idx in Object.keys(info.select)) {
            const equip_id = Object.keys(info.select)[idx];

            let q = src_query
                .replace(/\$\$1/, equip_id)
                .replace(/\$\$2/, info.select[equip_id].toString())
                .replace(/\$\$3/, start_date)
                .replace(/\$\$4/, end_date);

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

module.exports = {
    getAIReportData
}