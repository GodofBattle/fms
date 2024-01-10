const { pool, queries } = require(`../config/mariadb.config`);

const getInfoByEquipmentType = async (equip_type) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_equipment.byCode, [ equip_type ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertPredefineEquipment = async (equip_code, io_type_code) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_equipment.insert, [ equip_code, io_type_code ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updatePredefineEquipment = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_equipment.update, [ set, where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const batchPredefineEquipment = async (itemLength, array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let repeat_query = ``;
        for(let idx = 0; idx < itemLength; idx++) repeat_query += query.pd_equipment.update;
        const rows = await connection.query(repeat_query, array_set);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deletePredefineEquipment = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.pd_equipment.delete, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getInfoByEquipmentType,
    insertPredefineEquipment,
    updatePredefineEquipment,
    batchPredefineEquipment,
    deletePredefineEquipment
}