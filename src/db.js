import { PrismaClient } from "@prisma/client";
import config from "./config.js";

const DATABASE_URL = config.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function init() {
  await prisma.$connect();
}

init().then(() => {
  console.log("[DB ORM] 连接数据库成功", DATABASE_URL);
}).catch((err) => {
  console.error("[DB ORM] 连接数据库失败", DATABASE_URL, err);
});

export default prisma;