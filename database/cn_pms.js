const { pool, queries } = require(`../config/mariadb.config`);

const getBreakerList = async (equip_id, type) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_pms.breakerList, [ equip_id, type ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getBreakerInfo = async (equip_id, breaker_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_pms.breaker.get, [ equip_id, breaker_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const setBreakerInfo = async (info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_pms.breaker.set, [ info, info ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getReportInfo = async (id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_pms.report.get, [ id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getBreakerList,
    getBreakerInfo,
    setBreakerInfo,
    getReportInfo
}