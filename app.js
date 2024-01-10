const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const ip = require(`ip`);

// by shkoh 20200512: log 내역을 파일로 기록하기 위해 구현한 fileLogger
const fileLogger = require('./config/fileLogger');
// by shkoh 20200512: session 사용자 정보
const models = { CurrentUser: require(`./config/user`) };

const app = express();

const { expressCspHeader, SELF, UNSAFE_EVAL, UNSAFE_INLINE } = require(`express-csp-header`);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// by shkoh 20200512: proxy 환경에서 express를 사용할 수 있도록 설정
app.set('trust proxy', true);
// by shkoh 20200512: session middleware(express-session) 설정
app.use(session({
    secret: 'icomerfms5.0',
    resave: false,
    saveUninitialized: true
}));

app.use(`/api/external`, require(`./routes/api/external/index`));

/**
 * by shkoh 20200512: UbiGuard FMS 5.0에서 사용할 Route 정의
 *                    Route에서 사용할 URL은 페이지 기준으로 작성
 *                    대신 Database에 접근할 때에는 table 기준으로 작성함
 */
app.use(`/login`, require(`./routes/login`));

app.use(expressCspHeader({
    directives: {
        'default-src': [ SELF, UNSAFE_INLINE, UNSAFE_EVAL, 'data:' ]
    }
}));

app.all(`/*`, (req, res, next) => {
    req.headers.forwarded

    if(req.session.user === undefined) {
        req.session.user = new models.CurrentUser(false, '', undefined);
    }

    if(req.session.user) {
        req.session.user.currentRequestTime = new Date();
        
        if(req.session.user.isAuth) {
            req.header
            next();
        } else {
            res.redirect(`/login`);
        }
    } else {
        res.redirect(`/login`);
    }
});

app.use(`/`, require(`./routes/viewer`));
app.use(`/api`, (req, res, next) => {
    // by shkoh 20200513: 추후 중간 처리 부분이 필요할 경우 수행
    next();
});

app.use(`/api/monitoring`, require(`./routes/api/monitoring`));
app.use(`/api/alarm/dashboard`, require(`./routes/api/alarmDashboard`));
app.use(`/api/alarm/history`, require(`./routes/api/alarmHistory`));
app.use(`/api/data/statistics`, require(`./routes/api/dataStatistics`));
app.use(`/api/data/report`, require(`./routes/api/dataReport`));
app.use(`/api/data/asset`, require(`./routes/api/dataAsset`));
app.use(`/api/reports`, require(`./routes/api/reports`));
app.use(`/api/diagram`, require(`./routes/api/diagram`));
app.use(`/api/inventory`, require(`./routes/api/inventory`));
app.use(`/api/user`, require(`./routes/api/userSetting`));
app.use(`/api/sensor`, require(`./routes/api/sensorSetting`));
app.use(`/api/predefine/code`, require(`./routes/api/codeSetting`));
app.use(`/api/predefine/equipment`, require(`./routes/api/predefineEquipmentSetting`));
app.use(`/api/popup/set`, require(`./routes/api/popupSet`));
app.use(`/api/popup/fault`, require(`./routes/api/popupFault`));
app.use(`/api/popup/log`, require(`./routes/api/popupLog`));
app.use(`/api/popup/chart`, require(`./routes/api/popupSensorChart`));
app.use(`/api/popup/camera`, require(`./routes/api/popupCamera`));
app.use(`/api/workhistory`, require(`./routes/api/workHistory`));
app.use(`/api/worklog`, require(`./routes/api/worklog`));
app.use(`/api/rackdiagram`, require(`./routes/api/rackDiagram`));

// by shkoh 20210303: customizing
app.use(`/api/wrfis/wemb`, require(`./routes/api/customizing/wrfis/wemb`));
app.use(`/api/wrfis/icomer`, require(`./routes/api/customizing/wrfis/icomer`));
app.use(`/api/pss/icomer`, require(`./routes/api/customizing/pss/icomer`));
app.use(`/api/didc/icomer`, require(`./routes/api/customizing/didc/icomer`));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    // by shkoh 20200511: 환경설정이 'development'인 경우에만 error 상태값을 정의하여 에러 화면을 표출
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // by shkoh 20200512: http error가 발생한 경우에 로그파일에 기록
    fileLogger.node.error(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;