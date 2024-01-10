const { pool, queries } = require(`../config/mariadb.config`);

const insertItem = async (inserted_item) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const result = await connection.query(query.cn_rack_diagram.insert, [ inserted_item ]);
        return result;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
};

const updateItem = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const result = await connection.query(query.cn_rack_diagram.update, [ set, where ]);
        return result;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteItem = async (delete_item) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const result = await connection.query(query.cn_rack_diagram.delete, [ delete_item ]);
        return result;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getItems = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_rack_diagram.get, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getTypeInfo = async (type, equip_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        // by shkoh 20230525: 우선은 equipment에서만 반응하도록 구현함
        const target = 'equipment';

        if(query.cn_rack_diagram[type] === undefined || query.cn_rack_diagram[type][target] === undefined || query.cn_rack_diagram[type][target] === '') {
            return {};
        } else {
            const info = await connection.query(query.cn_rack_diagram[type][target], [equip_id]);
            return info[0];
        }
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertItem,
    updateItem,
    deleteItem,
    getItems,
    getTypeInfo
}