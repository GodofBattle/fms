const createError = require('http-errors');
const express = require(`express`);
const router = express.Router();

const external_info = require('../../../config/externalInfo');

const db_equipment = require(`../../../database/cn_equipment`);
const db_sensor = require(`../../../database/cn_sensor`);
const db_alarm = require(`../../../database/ft_current_alarm`);

// by shkoh 20230426: 외부 API를 통하여 접근을 했을 경우에 인증여부를 판단
function isAuthorized(req, res, next) {
    // by shkoh 20230426: 인증과 관련한 정상적인 user가 존재하고 externalApi가 true인 경우에
    // bh shkoh 20230426: session 생성시간과 현재 시간을 비교하여 정상적인 경우에만 데이터전달 진행
    if(req.session.user && req.session.user.exteralApi) {
        const timestamp = new Date(req.session.user.timestamp).getTime() + external_info.max_age;
        const now = new Date().getTime();
        
        if(timestamp < now) {
            res.status(440).send({ result: 'session expired' });
            
            req.session.destroy((err) => {
                console.error(err);
            });
        } else {
            next();
        }
    } else if(req.session.user && !req.session.user.exteralApi && req.session.user.isAuth) {
        // next(createError(404));
        req.session.destroy();
        res.end();
    } else {
        req.session.destroy((err) => {
            console.error(err);
        });
        
        res.status(401).send({ result: 'NOT Authorized' });
    }
}

// by shkoh 20230426: 우선은 login 절차를 무조건 시행하여 진행함
router.post(`/login`, async (req, res) => {
    const { auth_id, auth_pw } = external_info;
    const { id, pw } = req.body;

    if(id === auth_id && pw === auth_pw) {
        req.session.user = {
            exteralApi: true,
            timestamp: new Date()
        };

        res.send({
            result: 'OK'
        });
    } else {
        res.status(401).send({
            result: 'NOT Authorized'
        });
    }
});

router.get(`/equipmentlist`, isAuthorized, async (req, res, next) => {
    let results = undefined;
    results = await db_equipment.getEquipmentListView();

    if(results === undefined) {
        return res.send([]);
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return res.status(500).send({ result: `internal database error` });
    } else {
        return res.send(results);
    }
});

router.get(`/equipmentinfo`, isAuthorized, async (req, res, next) => {
    let results = undefined;

    const { id } = req.query;
    if(id === undefined) {
        return res.status(400).send({ result: `need to equipment id` });
    }
    
    const equip = await db_equipment.getEquipmentInfoView({ equip_id: id });
    if(equip === undefined) {
        return res.send({});
    }

    const sensor = await db_sensor.getSensorListView({ equip_id: id });
    if(sensor.constructor.name === `SqlError` || sensor.constructor.name === `TypeError`) {
        return res.status(500).send({ result: `internal database error` });
    }

    results = {
        ...equip,
        sensors: sensor
    }

    if(results === undefined) {
        return res.send([]);
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return res.status(500).send({ result: `internal database error` });
    } else {
        return res.send(results);
    }
});

router.get(`/alarmlist`, isAuthorized, async (req, res, next) => {
    let results = undefined;
    results = await db_alarm.getAlarmListView();

    if(results === undefined) {
        return res.send([]);
    } else if(results.constructor.name === `SqlError` || results.constructor.name === `TypeError`) {
        return res.status(500).send({ result: `internal database error` });
    } else {
        return res.send(results);
    }
});

// by shkoh 20230426: /api/external 의 경로로 접근할 경우에 지정된 url을 제외하고는 나머지 접근은 모두 종료시킨다.
// by shkoh 20230426: /api/external 경로에서 isAuthorized로 인증여부를 판단하는데, 인증이 완료됐지만, 그 외의 접근은 모두 허용하지 않는다.
router.all('/*', isAuthorized, (req, res, next) => {
    res.end();
});

module.exports = router;