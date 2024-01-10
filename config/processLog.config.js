const fileLogger = require(`./fileLogger`);

const processExitHandler = (msg) => {
    console.log(msg);
    fileLogger.process.info(msg);

    setTimeout(() => {
        process.exit(0);
    }, 1000).unref();
}

process.on('SIGUSR1', (signal) => {
    // processExitHandler(`[UbiGuard FMS 5.6] ${signal}(Ctrl-C)로 node process(${process.pid}) 종료`);
    console.log(signal);
});

process.on('SIGINT', (signal) => {
    processExitHandler(`[UbiGuard FMS 5.6] ${signal}(Ctrl-C)로 node process(${process.pid}) 종료`);
});

process.on('SIGTERM', (signal) => {
    processExitHandler(`[UbiGuard FMS 5.6] ${signal}로 node process(${process.pid}) 종료`);
});

process.on('SIGHUP', (signal) => {
    processExitHandler(`[UbiGuard FMS 5.6] ${signal}(Windows 종료 감지)로 node process(${process.pid}) 종료`);
});

process.on('SIGBREAK', (signal) => {
    processExitHandler(`[UbiGuard FMS 5.6] ${signal}(Ctrl+Break)로 node process(${process.pid}) 종료`);
});

process.on('uncaughtException', (error) => {
    fileLogger.process.error(error);
    processExitHandler(`[UbiGuard FMS 5.6] ${error.name} (으)로 node process(${process.pid}) 종료`);
});

module.exports = {};