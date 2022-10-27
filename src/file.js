import prisma from "./db.js";
import { createRequire } from "module";
import config from "./config.js";

const require = createRequire(import.meta.url);
const fs = require("fs");
// let _path = process.cwd();


const types = [
  {
    path: config.LISTENER_PATH + "/sign_wrap.txt",
    type: 1,
    name: "SIGN",
    fieldNum: 3 //字段数，不包括id
  },
  {
    path: config.LISTENER_PATH + "/performance_pc_storage.txt",
    type: 2,
    name: "PERFORMANCE_PC",
    fieldNum: 7
  },
];


let files = {
  getAbsolutepath: () => {
    return config.LISTENER_PATH;
  },
  createSignInfo: async (data) => {
    const createFile = await prisma.signinWrap
      .create({
        data: data,
      })
      .catch((error) => {
        console.error("prisma.info_txt.create error: ", error);
      });
    if (createFile) {
      console.log("本次文件信息info_Protein已存入mysql:");
      console.log(createFile);
    }
  },
  createPerformancePc: async (data) => {
    const createFile = await prisma.performance_pc
      .create({
        data: data,
      })
      .catch((error) => {
        console.error("prisma.info_txt.create error: ", error);
      });
    if (createFile) {
      console.log("本次文件信息info_Protein已存入mysql:");
      console.log(createFile);
    }
  },
  createProtein: async (data) => {
    const createFile = await prisma.info_protein
      .create({
        data: data,
      })
      .catch((error) => {
        console.error("prisma.info_txt.create error: ", error);
      });
    if (createFile) {
      console.log("本次文件信息info_Protein已存入mysql:");
      console.log(createFile);
    }
  },

  createSirt: async (data) => {
    const createFile = await prisma.info_sirt
      .create({
        data: data,
      })
      .catch((error) => {
        console.error("prisma.info_txt.create error: ", error);
      });
    console.log("本次文件信息info_sirt已存入mysql:");
    console.log(createFile);
  },

  getFileByType: async (type) => {
    let filePath = types.find((item) => item.type === type).path;
    console.log(filePath);
    let promise = new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf-8", (err, data) => {
        resolve(data);
      });
    });
    let str = "";
    await promise.then((res) => {
      str = res;
    });
    return str;
  },

  getFilePathByType: (type) => {
    return types.find((item) => item.type === type).path;
  },

  getFilePathByName: (name) => {
    return types.find((item) => item.name === name).path;
  },

  getFieldNumByName: (name) => {
    return types.find((item) => item.name === name).fieldNum;
  }
};

export default files;
