/**
 * by shkoh 20200511 : Logger
 * 
 * node.js + express.js + mysql.js, 즉 WEB Server 내에서 동작하는 모든 로그를 관장하고 처리하기 위한 모듈 작성
 */
const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');
const rfs = require('rotating-file-stream');

// by shkoh 20200511: Log 파일들을 기록하기 위한 ./log 폴더 생성
const log_directory = path.join(__dirname, '..', 'log');
fs.existsSync(log_directory) || fs.mkdirSync(log_directory);

const file_generator = (file_name) => {
    return (time, index) => {
        if(!time) return `${file_name}.log`;

        return `${file_name}.${dateFormat(time, 'yyyymmdd')}.${('0' + index.toString()).slice(-2)}.log`;
    }
}

// by shkoh 20200511: node.js의 process 관련 logger
const consoleProcess = () => {
    const directory_name = 'process';
    
    const node_directory = path.join(log_directory, directory_name);
    fs.existsSync(node_directory) || fs.mkdirSync(node_directory);

    const rfs_option = {
        interval: '1d',
        path: node_directory,
        immutable: true
    }
    
    // by shkoh 20200511: log들 중에서 필요에 따라서 log들을 기록할 writable stream들을 생성
    const stdout = rfs.createStream(file_generator(directory_name), rfs_option);
    const stderror = rfs.createStream(file_generator(`${directory_name}_error`), rfs_option);
    
    const node = new console.Console(stdout, stderror);
    
    require('console-stamp')(node, {
        format: `:date(yyyy/mm/dd HH:MM:ss.l) :label(7)`,
        stdout: stdout,
        stderr: stderror
    });

    return node;
}

// by shkoh 20200511: node.js 연결 관련 logger
const consoleNode = () => {
    const directory_name = 'node';
    
    const node_directory = path.join(log_directory, directory_name);
    fs.existsSync(node_directory) || fs.mkdirSync(node_directory);

    const rfs_option = {
        interval: '1d',
        path: node_directory,
        immutable: true
    }
    
    // by shkoh 20200511: log들 중에서 필요에 따라서 log들을 기록할 writable stream들을 생성
    const stdout = rfs.createStream(file_generator(directory_name), rfs_option);
    const stderror = rfs.createStream(file_generator(`${directory_name}_error`), rfs_option);
    
    const node = new console.Console(stdout, stderror);
    
    require('console-stamp')(node, {
        format: `:date(yyyy/mm/dd HH:MM:ss.l) :label(7)`,
        stdout: stdout,
        stderr: stderror
    });

    return node;
}

// by shkoh 20200513: web socket 관련 logger
const consoleWS = () => {
    const directory_name = 'ws';
    
    const node_directory = path.join(log_directory, directory_name);
    fs.existsSync(node_directory) || fs.mkdirSync(node_directory);

    const rfs_option = {
        interval: '1d',
        path: node_directory,
        immutable: true
    }
    
    // by shkoh 20200511: log들 중에서 필요에 따라서 log들을 기록할 writable stream들을 생성
    const stdout = rfs.createStream(file_generator(directory_name), rfs_option);
    const stderror = rfs.createStream(file_generator(`${directory_name}_error`), rfs_option);
    
    const node = new console.Console(stdout, stderror);
    
    require('console-stamp')(node, {
        format: `:date(yyyy/mm/dd HH:MM:ss.l) :label(7)`,
        stdout: stdout,
        stderr: stderror
    });

    return node;
}

// by shkoh 20200619: 파일업로드 관련 logger
const consoleFileUpload = () => {
    const directory_name = 'file';
    
    const node_directory = path.join(log_directory, directory_name);
    fs.existsSync(node_directory) || fs.mkdirSync(node_directory);

    const rfs_option = {
        interval: '1d',
        path: node_directory,
        immutable: true
    }
    
    // by shkoh 20200511: log들 중에서 필요에 따라서 log들을 기록할 writable stream들을 생성
    const stdout = rfs.createStream(file_generator(directory_name), rfs_option);
    const stderror = rfs.createStream(file_generator(`${directory_name}_error`), rfs_option);
    
    const node = new console.Console(stdout, stderror);
    
    require('console-stamp')(node, {
        format: `:date(yyyy/mm/dd HH:MM:ss.l) :label(7)`,
        stdout: stdout,
        stderr: stderror
    });

    return node;
}

// by shkoh 20211215: web socket camera 관련 logger
const consoleWSCamera = () => {
    const directory_name = 'wsCamera';
    
    const node_directory = path.join(log_directory, directory_name);
    fs.existsSync(node_directory) || fs.mkdirSync(node_directory);

    const rfs_option = {
        interval: '1d',
        path: node_directory,
        immutable: true
    }
    
    // by shkoh 20211215: log들 중에서 필요에 따라서 log들을 기록할 writable stream들을 생성
    const stdout = rfs.createStream(file_generator(directory_name), rfs_option);
    const stderror = rfs.createStream(file_generator(`${directory_name}_error`), rfs_option);
    
    const node = new console.Console(stdout, stderror);
    
    require('console-stamp')(node, {
        format: `:date(yyyy/mm/dd HH:MM:ss.l) :label(7)`,
        stdout: stdout,
        stderr: stderror
    });

    return node;
}

module.exports = {
    process: consoleProcess(),
    node: consoleNode(),
    ws: consoleWS(),
    file: consoleFileUpload(),
    wsCamera: consoleWSCamera()
};