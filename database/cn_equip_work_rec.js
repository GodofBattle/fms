const { pool, queries } = require(`../config/mariadb.config`);

const insertWork = async (set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equip_work_rec.insert, [ set ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateWork = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equip_work_rec.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteWork = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equip_work_rec.delete.byIndex, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getListByEquipId = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const list = await connection.query(query.cn_equip_work_rec.list.byEquipId, [ equip_id ]);
        return list;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getReport = async (equip_ids, start_date, end_date) => {
    let connection;

    try {
        const query = queries();

        const report_query = query.cn_equip_work_rec.list.report
            .replace(/\$\$1/, equip_ids)
            .replace(/\$\$2/, start_date)
            .replace(/\$\$3/, end_date);

        connection = await pool.getConnection();
        const report = await connection.query(report_query);
        return report;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertWork,
    updateWork,
    deleteWork,
    getListByEquipId,
    getReport
}