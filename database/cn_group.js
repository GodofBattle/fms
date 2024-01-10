const { pool, queries } = require(`../config/mariadb.config`);

const insertGroup = async (p_group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_group.insert, [ p_group_id, p_group_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateGroup = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_group.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getGroupInfo = async (user_id, group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_group.info, [ user_id, group_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

/**
 * by shkoh 20200514
 * 지정된 child_id로부터 부모 group 리스트를 역순으로 검색
 * 
 * @param {Number} child_id 부모 group을 역으로 찾아가기 위한 첫번째 자식 group_id
 * @param {String} group_ids 요청한 User가 사용 가능한 group_id 리스트
 */
const findParentGroupName = async (child_id, group_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_group.findParentGroupName, [ child_id, group_ids ]);
        return row.reverse();
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getMapNodes = async (parent_group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_group.map.nodes, [ parent_group_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const findGroupByImage = async (imageName) => {
    let connection;
    
    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_group.findGroupByImage, [ imageName ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertGroup,
    updateGroup,
    getGroupInfo,
    findParentGroupName,
    getMapNodes,
    findGroupByImage
}