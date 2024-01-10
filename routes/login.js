const express = require('express');
const router = express.Router();

const models = { CurrentUser: require(`../config/user`) };
const db_user = require(`../database/ac_user`);

const fms_config = require(`../config/fms.config`);

router.get(`/`, (req, res, next) => {
    if(req.session.user && req.session.user.isAuth) {
        return res.redirect('/');
    } else {
        // by shkoh 20210129: 로그인 페이지에서 사이트마다 로드되는 이미지가 변경될 수 있음으로 옵션으로 동작하도록 구현
        return res.render(`login/login`, { title: `${fms_config.title} - 로그인`, site: fms_config.site });
    }
});

router.post(`/`, async (req, res, next) => {
    let { id, pw } = req.body;
    let env_db_pw = '';
    let db_pw = '';
    
    const results = await db_user.getUser(id);
    if(!fms_config.is_encryption) {
        env_db_pw = Buffer.from(results.password, 'base64').toString('utf8');
    }
    db_pw = results.password;
    
    if(results === undefined) {
        return res.redirect(`/login?msg=NO_ID`);
    } else if(results.constructor && results.constructor.name === 'SqlError') {
        return res.redirect(`/login?msg=${results.code}`);
    } else if(results.length === 0) {
        return res.redirect(`/login?msg=NO_ID`);
    } else if(env_db_pw.length > 0 && env_db_pw !== pw) {
        if(db_pw !== pw) {
            return res.redirect(`/login?msg=NO_PW`);
        }
    } else if(db_pw !== pw) {
        env_db_pw = Buffer.from(results.password, 'base64').toString('utf8');
        if(env_db_pw !== pw) {
            return res.redirect(`/login?msg=NO_PW`);
        }
    }
    
    if(req.session.user === undefined) req.session.user = new models.CurrentUser(false, '', undefined);

    Object.assign(req.session.user, {
        isAuth: true,
        id: results.user_id,
        user_name: results.name,
        grade: results.user_level_code,
        basic_group_id: results.basic_group_id
    });

    // by shkoh 20200512: 로그인 성공 시에 lg_login_history에 이력을 남김
    const ip_from_request = req.ip;
    const index_of_colon = ip_from_request.lastIndexOf(':');
    const ip = ip_from_request.substring(index_of_colon + 1, ip_from_request.length);

    await db_user.insertLoginHistory(id, ip, req.session.user.loginDateTime, req.session.id, req.headers['user-agent']);

    return res.redirect(`/`);
});

module.exports = router;