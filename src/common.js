import { randomInt } from "crypto";
import { createRequire } from "module";
import config from "./config.js";

const require = createRequire(import.meta.url);

const os = require("os");
const os_util = require("os-utils");
const nodeDiskInfo = require("node-disk-info");

let network_frequency = 1;

const common = {
  getNetworkFrequency: () => {
    return network_frequency;
  },
  setNetworkFrequency: (value) => {
    network_frequency = value
  },
  getLocalIP: () => {
    //获取本机IP
    const ifaces = os.networkInterfaces();
    let locatIp = "";
    for (let dev in ifaces) {
      if (dev.indexOf("本地连接") >= 0) {
        for (let j = 0; j < ifaces[dev].length; j++) {
          if (ifaces[dev][j].family === "IPv4") {
            locatIp = ifaces[dev][j].address;
            break;
          }
        }
      }
    }
    return locatIp;
  },
  randomNet: () => {
    setInterval(() => {
      let random = randomInt(10, 80);
      common.setNetworkFrequency(random / 100);
    }, 20000);

  },
  getIp: () => {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      let iface = ifaces[dev];
      for (let i = 0; i < iface.length; i++) {
        let { family, address, internal } = iface[i];
        if (family === "IPv4" && address !== "127.0.0.1" && !internal) {
          return address;
        }
      }
    }
  },
  getMemoryUsage: () => {
    //获取内存信息
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return ((totalMem - freeMem) / totalMem).toFixed(2) / 1;
  },

  getCPUUsage: async function () {
    let usage = 0;
    let promise = new Promise((resolve, reject) => {
      os_util.cpuUsage(function (v) {
        resolve(v);
      });
    });
    await promise.then((res) => {
      usage = res;
    });
    return usage.toFixed(2)/1;
  },
  isNull: (s) => {
    return s === null || typeof s === "undefined";
  },
  isEmpty: (s) => {
    if (common.isNull(s)) {
      return true;
    }
    if (typeof s != "string") {
      return false;
    }
    return s.length === 0;
  },

  getNodeDiskInfo: () => {
    let allBlocks = 0;
    let allUsed = 0;
    let scale = 0;
    let disks = nodeDiskInfo.getDiskInfoSync();
    let diskItem = disks.find((item) => item.mounted === config.DISK + ":");
    allBlocks =Math.floor(diskItem.blocks/(1024*1024*1024));
    allUsed = diskItem.used;
    scale = (allUsed / diskItem.blocks).toFixed(2) / 1;
    return {
      allBlocks,
      allUsed,
      scale,
    };
  },
};

export default common;
