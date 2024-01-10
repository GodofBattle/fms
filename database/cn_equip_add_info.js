const { pool, queries } = require(`../config/mariadb.config`);

const updateEquipmentAddInfo = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection()
        const row = await connection.query(query.cn_equip_add_info.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const setEquipmentAddInfo = async (info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_equip_add_info.set, [ info, info ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getInfo = async (equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equip_add_info.info, [ equip_id ]);
        return rows.length === 0 ? {} : rows.pop();
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const findImagesOnEquipmentAddInfo = async (imageName) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_equip_add_info.findImages, [ imageName ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    updateEquipmentAddInfo,
    setEquipmentAddInfo,
    getInfo,
    findImagesOnEquipmentAddInfo
};