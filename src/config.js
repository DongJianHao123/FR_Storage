import { createRequire } from 'module';

const require = createRequire(import.meta.url);
var fs = require('fs');

let _path = process.cwd();

let _config = {
    DATABASE_URL: 'mysql://root:rootroot@localhost:3306/buaa',//数据库地址
    MONITORING_TIME: 5,//文件修改监听时间
    MACHINE_INFO_TYPE: "storage",//本机信息类型（data或者storage）
    SERVER_PORT: 8821,
    LISTENER_PATH: _path + '/upload'
}
let config = {};
try {
    config = JSON.parse(fs.readFileSync(_path + '/config.txt'))
    for (const key in config) {
        if (Object.hasOwnProperty.call(config, key)) {
            if (!config[key]) {
                config[key] = _config[key];
                console.log(`${key}加载错误，替换为默认配置---${config[key]}`);
            }
        }
    }
    console.log(`加载配置文件成功:${JSON.stringify(config)}`);
} catch (error) {
    config = _config;
    console.error(`加载配置文件config失败.使用默认配置:${JSON.stringify(config)}`, error)
}

export default config;