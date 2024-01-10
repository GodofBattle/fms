const { pool, queries } = require(`../config/mariadb.config`);

const getGridConfig = async (user_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_grid_config.get, [ user_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const setGridConfig = async (user_id, grid_items) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        let data_set = [];
        data_set.push(user_id);

        let query_set = query.ac_grid_config.delete;

        grid_items.forEach((item) => {
            query_set += query.ac_grid_config.insert;

            data_set.push(user_id);
            data_set.push(item.grid_id);
            data_set.push(item.x);
            data_set.push(item.y);
            data_set.push(item.w);
            data_set.push(item.h);
            data_set.push({ x: item.x, y: item.y, w: item.w, h: item.h });
        });

        const row = await connection.query(query_set, data_set);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getGridConfig,
    setGridConfig
}