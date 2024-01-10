const { pool, queries } = require(`../config/mariadb.config`);

const getModel = async (model_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.in_model.get, [ model_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getModelInfo = async () => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.in_model.list);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertModelInfo = async (set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.in_model.insert, [ set ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateModelInfo = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.in_model.update, [ set, where ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteModelInfo = async (where) => {
    let connection;

    try {
        const query = queries();
        const model_id = { model_id: where.id };

        connection = await pool.getConnection();
        let rows = await connection.query(query.in_model.delete, [ where ]);
        rows = await connection.query(query.in_model_network.delete, [ model_id ]);
        rows = await connection.query(query.in_model_power.delete, [ model_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getModel,
    getModelInfo,
    insertModelInfo,
    updateModelInfo,
    deleteModelInfo
}