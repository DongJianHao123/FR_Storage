import files from "./file.js";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { closeListen, listeningFile } from "./fileWatch.js";
import config from "./config.js";
import common from "./common.js";

const require = createRequire(import.meta.url);
const filename = fileURLToPath(import.meta.url);
const express = require("express"); //引入express
const path = require("path"); //引入path
var url = require("url");

const _dirname = path.dirname(filename);
let isSignin = false;

//创建服务器
const app = express();
const port = config.SERVER_PORT;
//监听端口

//设置静态文件目录
app.use(express.static("public"));
app.use("/", express.static(path.join(_dirname, "public")));
app.use(express.urlencoded());


app.get("/", function (req, res) {
  console.log();
  console.log('----------------------');
    try {
      // signin(name)
      listeningFile('SIGN', config.MONITORING_TIME);
      listeningFile('PERFORMANCE_PC', config.MONITORING_TIME);
    } catch (error) {
      res.json({
        code: 500,
        msg: '登录方法出错',
        error: error
      })
    }
    res.send(`服务已启动,开启监听---${config.LISTENER_PATH}---下的文件`)
});

const doMethod = (call, mappingValue, res) => {
  try {
    call();
    res.json({
      code: 201,
      msg: "调用" + mappingValue + "方法",
    });
  } catch (error) {
    console.log(error);
  }
};

app.listen(port, function () {
  console.log("服务器已启动:");
  console.log("-------------------此窗口不要关闭-------------");
  console.log("");
  console.log("localhost:" + port);
  console.log("");
  console.log("--------------------------------------------");
});
