/**
 * by shkoh 20200522
 * User Setting 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/user/:mode 방식으로 구현
 */
const express = require(`express`);
const router = express.Router();

const db_procedure = require('../../database/procedure');
const db_tree = require(`../../database/tree`);
const db_ac_event_accept = require(`../../database/ac_event_accept`);
const db_ac_user = require(`../../database/ac_user`);
const db_pd_code = require(`../../database/pd_code`);
const ac_user = require('../../database/ac_user');
const fmsConfig = require('../../config/fms.config');
const db_lg_work_history2 = require(`../../database/lg_work_history2`);

router.get(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'all': {
            results = await db_ac_user.getAllUserList(req.session.user.grade, req.session.user.id);
            break;
        }
        case 'info': {
            const { id } = req.query;
            results = await db_ac_user.getUserInfo(req.session.user.grade, id);
            break;
        }
        case 'grade': {
            results = await db_pd_code.getSubUserGrade(req.session.user.grade);
            break;
        }
        case 'tree': {
            const { type, user_id } = req.query;
            if(type === 'normal') {
                results = await db_tree.getNormalGroupTree();
            } else if(type === 'group') {
                const group_ids = await db_procedure.spGetGroupListByUserId(user_id === undefined ? req.session.user.id : user_id);
                results = await db_tree.getGroupTree(group_ids.groupList);
            } else if(type === 'onlygroup') {
                const group_ids = await db_procedure.spGetGroupListByUserId(req.session.user.id);
                results = await db_tree.getOnlyGroupTree(group_ids.groupList);
            }
            break;
        }
        case 'alarmequipments': {
            const id = req.query.user_id === undefined ? '' : req.query.user_id;
            results = await db_ac_event_accept.getAcceptedEventByUser({ user_id: id });
            break;
        }
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.post(`/:mode`, async (req, res, next) => {
    let results = undefined;

    switch(req.params.mode) {
        case 'set': {
            const data = JSON.parse(req.body.data);
            let set_db_pw = fmsConfig.is_encryption ? Buffer.from(data.userPw).toString('base64') : data.userPw;

            const info = {
                user_id: data.userId,
                name: data.userName,
                password: set_db_pw,
                b_use: 'Y',
                user_level_code: data.userLevel,
                mobile: data.userMobile,
                email: data.userEmail,
                memo: data.userMemo,
                department_code: data.userDept,
                alarm_type_enable: data.alarmType,
                event_enable: data.alarmRequirement,
                week_enable: data.alarmWeek,
                hour_enable: data.alarmHour,
                update_time: new Date(),
                basic_group_id: data.userStartGroupId ? data.userStartGroupId : null
            }

            const previous_user = await db_ac_user.getUser(data.userId);

            const response = await db_ac_user.setUser(info);
            if(response.affectedRows > 0) {
                results = { msg: `사용자 정보 설정 완료` }

                // by shkoh 20231106: 사용자 추가/수정 로그기록
                const user = await db_ac_user.getUser(data.userId);

                const ip_from_request = req.ip;
                const idx = ip_from_request.lastIndexOf(':');
                const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
                if(req.body.mode === 'insert') {
                    await db_lg_work_history2.addUser(req.session.user, ip, user);
                } else {
                    await db_lg_work_history2.updateUser(req.session.user, ip, previous_user, user);
                }
            }
            break;
        }
        case 'alarmequipments': {
            const user_id = req.body.user_id;
            let response = await db_ac_event_accept.deleteAcceptedEvent({ user_id: user_id });
            if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);

            const array_set = [];
            const equip_ids = JSON.parse(req.body.ids);
            if(equip_ids.length > 0) {
                equip_ids.forEach((id) => {
                    array_set.push([ user_id, id ]);
                });
    
                response = await db_ac_event_accept.insertAcceptedEvent(array_set);
                if(response.constructor.name === 'SqlError' || response.constructor.name === 'TypeError') return next(response);
            }

            // by shkoh 20231106: 사용자 계정 중 알람 발생설비 로그기록
            const ip_from_request = req.ip;
            const idx = ip_from_request.lastIndexOf(':');
            const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
            const user = await db_ac_user.getUser(user_id);
            await db_lg_work_history2.updateUserByAlarmEquipments(req.session.user, ip, user, equip_ids);
            
            results = { msg: '알람 발생 설비 설정 완료' }
            break;
        }
    }
    
    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.delete(`/`, async (req, res, next) => {
    const { user } = req.body;

    const set = {
        b_use: 'N',
        update_time: new Date()
    };

    const where = {
        user_id: user
    };

    const delete_user = await db_ac_user.getUser(user);
    let results = await ac_user.updateUser(set, where);

    if(results.affectedRows > 0) {
        // by shkoh 20231106: 사용자 계정 삭제
        const ip_from_request = req.ip;
        const idx = ip_from_request.lastIndexOf(':');
        const ip = ip_from_request.substring(idx + 1, ip_from_request.length);
        await db_lg_work_history2.deleteUser(req.session.user, ip, delete_user);
    }

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

module.exports = router;