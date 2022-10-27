import { createRequire } from 'module';
import common from './common.js';
import files from './file.js';


const require = createRequire(import.meta.url);

var fs = require('fs');
var chokidar = require('chokidar')



// var logsArr = new Array();
let timers = {};
const prevStats = {};//文件每次更改前的状态，根据新旧状态中的size截取数据
const watchers = {}

function listeningFile(fileName, limitTime) {
    if (fileName !== 'SIRT' && fileName !== 'PROTEIN' && fileName !== 'SIGN' && fileName !== 'PERFORMANCE_PC') {
        throw '文件名不存在,请确认文件名的正确性'
    }
    limitTime = limitTime * 1000;
    let path = files.getFilePathByName(fileName)
    listenLogs(path, limitTime, fileName)
}

var listenLogs = function (filePath, limitTime, fileName) {
    const options = {
        followSymlinks: false, // 这个在 windows 上必须要，不然会多统计很多软连接下的目录
        ignorePermissionErrors: false, // 必须设为 false，这样文件出错会主动调用 on error
        atomic: false, // 必须设为 false，否则会忽略临时文件
        persistent: true,
    };
    if (!watchers[fileName]) {
        watchers[fileName] = chokidar.watch(filePath, options);
    }

    prevStats[fileName] = fs.statSync(filePath);

    watchers[fileName].on('ready', () => {
        console.log('正在监听文件:' + filePath);
        console.log('文件更改的监听时间为:' + limitTime / 1000 + '秒');
    }).on('change', (path, stats) => {
        check(path, stats, limitTime, prevStats[fileName], fileName);
    })
}
async function generateTxt(str, fileName) { // 处理新增内容的地方
    let lineBreak = '\r\n';
    var temp = str.split(lineBreak);
    for (var s in temp) {
        let dataStr = temp[s];
        if (dataStr !== '') {
            await dataParse(dataStr, fileName)
        }
    }
}

function clearTimer(path) {
    const timer = timers[path];
    timer && clearTimeout(timer);
}

function check(path, currStats, limitTime, perv, fileName) {
    clearTimer(path);
    let _stats;
    let buffer;
    let _pervStats = perv;
    try {
        _stats = currStats || fs.statSync(path);
    } catch (error) {
        console.error("watcher change Error:", error);
    }
    console.info(`文件发生改变 ${path}`);
    if (Date.now() - _stats.mtimeMs > limitTime) {
        //文件内容有变化，那么通知相应的进程可以执行相关操作。例如读物文件写入数据库等
        let changeSize = _stats.size - _pervStats.size;
        if (changeSize >= 0) {
            console.log(fileName + "更改的size为:" + changeSize);
            buffer = new Buffer.alloc(changeSize);
            fs.open(path, 'a+', function (error, fd) {
                fs.read(fd, buffer, 0, (changeSize), _pervStats.size, async function (err, bytesRead, buffer) {
                    await generateTxt(buffer.toString(), fileName)
                })
                fs.close(fd);
            })
        } else {
            console.log("文件执行非新增操作,无响应,请换行重新操作");
        }
        prevStats[fileName] = _stats;//每次文件更改或者数据库操作执行完毕后，更新原始状态
    } else {
        console.log('正在等待');
        const timer = setTimeout(() => {
            try {
                const _stats = fs.statSync(path);
                check(path, _stats, limitTime, _pervStats, fileName);
            } catch (error) {
                console.error(`检查文件有异常`, error);
                delete timers[path];
            }
        }, limitTime);
        timers[path] = timer;
        console.info(`文件设置了 ${limitTime / 1000} 秒后继续观察 ${path}`);
    }
}

async function dataParse(dataStr, fileName) {
    let dataArr = dataStr.split(',');
    if (dataStr.endsWith(',')) {
        dataArr.pop()
    }
    if (files.getFieldNumByName(fileName) === dataArr.length) {
        console.log(dataArr);
        try {
            let objData = arrToData(dataArr, fileName)
            let startAt = new Date().getTime();
            if (fileName === 'PROTEIN') {
                try {
                    await files.createProtein({ ...objData })
                } catch (error) {
                    console.error('调用数据库方法错误', error)
                }
            } else if (fileName === 'SIRT') {
                try {
                    await files.createSirt({ ...objData })
                } catch (error) {
                    console.error('调用数据库方法错误', error)
                }
            } else if (fileName === 'SIGN') {
                try {
                    await files.createSignInfo({ ...objData })
                } catch (error) {
                    console.error('调用数据库方法错误', error)
                }
            } else if (fileName === 'PERFORMANCE_PC') {
                try {
                    await files.createPerformancePc({ ...objData })
                } catch (error) {
                    console.error('调用数据库方法错误', error)
                }
            }
            else {
                throw "无此类型的txt文件"
            }
            //在这里计算网速
            let endAt = new Date().getTime();
            let time = endAt - startAt;
            let network_frequency = Math.round((JSON.stringify(objData).length * 2 / 1024 / 1024) / (time / 1000) * 100) / 100;
            common.setNetworkFrequency(network_frequency);
        } catch (error) {
            console.error("数据解析出现问题:", error);
        }
    } else {
        if (dataArr === [''] || dataStr === '\r\n') {
            console.log('行内无数据');
        } else {
            console.log('此行输入的某一数据名或字段数可能与数据库不匹配,不做处理,请重试-------' + dataArr);
        }
    }
}

/**
 * 
 * @param {Array<string>} dataArray 
 */
function arrToData(dataArray, fileName) {//数据处理，将字符串转换为数据对象
    let data = {};
    dataArray.map((field, index) => {
        if (fileName === 'SIGN') {
            if (field.includes('用户名')) {
                data.username = getValue(dataArray, index, false, false)
            }
            if (field.includes('ip')) {
                data.sign_ip = getValue(dataArray, index, false, false)
            }
            if (field.includes('登录时间')) {
                let timeStr = field.substring(5);
                let time = new Date(
                    Date.parse(
                        timeStr.slice(0, 10) + " " + timeStr.slice(10, timeStr.length)
                    )
                );
                time.setHours(time.getHours() + 8);
                data.sign_at = time
            }
        } else if (fileName === 'PERFORMANCE_PC') {
            // ip:192.168.1.1,磁盘:39,时间:1,网络频率:0.75,cpu使用率:0.16,内存使用率:0.58,磁盘使用率:0.29,
            if (field.includes('磁盘:')) {
                data.disk = getValue(dataArray, index, true, true)
            }
            if (field.includes('ip')) {
                data.ip = getValue(dataArray, index, false, false)
            }
            if (field.includes('时间')) {
                let timeStr = field.substring(3);
                let time = new Date(
                    Date.parse(
                        timeStr.slice(0, 10) + " " + timeStr.slice(10, timeStr.length)
                    )
                );
                time.setHours(time.getHours() + 8);
                data.data_time = time
            }
            if (field.includes('网络频率')) {
                data.network_frequency = getValue(dataArray, index, true, false)
            }
            if (field.includes('cpu使用率')) {
                data.cpu_usage = getValue(dataArray, index, true, false)
            }
            if (field.includes('内存使用率')) {
                data.memory_usage = getValue(dataArray, index, true, false)
            }
            if (field.includes('磁盘使用率')) {
                data.disk_usage = getValue(dataArray, index, true, false)
            }
            let now = new Date();
            now.setHours(now.getHours() + 8);
            data.create_time = now;
            data.update_time = now;
            data.type = 'storage';
        }
    })
    return data;
}
const getValue = (arr = [""], index, isNum, isInt) => {
    let result;
    let _result = arr[index].split(":")[1];
    if (isNum) {
        if (isInt) {
            result = parseInt(_result);
        } else {
            result = parseFloat(_result);
        }
    } else {
        result = _result;
    }
    return result;
};

function closeListen() {
    for (const key in watchers) {
        if (Object.hasOwnProperty.call(watchers, key)) {
            watchers[key].close();
        }
    }
    console.log('已关闭所有的文件监听');
}

export { listeningFile, closeListen };
