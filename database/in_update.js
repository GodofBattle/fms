const { pool, queries } = require(`../config/mariadb.config`);

const getUpdateInfo = async (object_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.in_update.info.replace(/\$\$1/, object_ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const addUpdateInfo = async (add_info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let insert_query = '';
        for(let idx = 0; idx < add_info.length; idx++) insert_query += query.in_update.insert;
        const result = await connection.query(insert_query, add_info);
        return result;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getReportList = async (start_date, end_date) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.in_update.report.list, [ start_date, end_date ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getUpdateInfo,
    addUpdateInfo,
    getReportList
}