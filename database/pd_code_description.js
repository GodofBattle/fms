const { pool, queries } = require(`../config/mariadb.config`);

const getDescription = async (type) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.pd_code_description.get, [ type ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertDescription = async (set) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.pd_code_description.insert, [ set ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateDescription = async (set, where) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.pd_code_description.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteDescription = async (where) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();
        const row = await connection.query(query.pd_code_description.delete, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getDescription,
    insertDescription,
    updateDescription,
    deleteDescription
}