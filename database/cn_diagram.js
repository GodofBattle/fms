const { pool, queries } = require(`../config/mariadb.config`);

const insertDiagramItem = async (inserted_items) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_diagram.insert, [ inserted_items ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteDiagramItem = async (delete_info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_diagram.delete, [ delete_info ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateDiagramItem = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_diagram.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDiagramItems = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_diagram.get, [ where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getTypeInfo = async (type, obj_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let target = obj_id.includes('G') ? 'group' : obj_id.includes('E') ? 'equipment' : 'sensor';
        let id = obj_id.substr(2);

        if(query.cn_diagram[type] === undefined || query.cn_diagram[type][target] === undefined || query.cn_diagram[type][target] === '') {
            return [];
        } else {
            const rows = await connection.query(query.cn_diagram[type][target], [ id ]);
            return rows[0];
        }
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertDiagramItem,
    deleteDiagramItem,
    updateDiagramItem,
    getDiagramItems,
    getTypeInfo
}