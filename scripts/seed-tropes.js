const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tropes = [
  { title: "满级大佬扮猪吃虎", category: "开头钩子", content: "开篇即立反差：主角强大却低调，周围人误判成废物，埋下打脸伏笔。" },
  { title: "重生回三年前", category: "开头钩子", content: "重生文经典开头，一上来就抓住憋屈与复仇的爽感，立刻引出仇人。" },
  { title: "当众揭穿身份", category: "打脸", content: "隐藏身份曝光，此前轻视主角的人集体打脸、当场震惊。" },
  { title: "一句报价让人闭嘴", category: "打脸", content: "用财富或能力碾压，一句话让看不起主角的人哑口无言。" },
  { title: "被抛弃的人是大佬", category: "反转", content: "结局揭晓主角真实身份，前面所有委屈都变成伏笔回收。" },
  { title: "软饭男是财团继承人", category: "反转", content: "身份反转：以为是软饭男，结果是万亿财团继承人，前期憋屈全部回收。" },
  { title: "隐藏身份曝光仇人求饶", category: "身份揭晓", content: "马甲揭晓，仇人跪地求饶，爽点集中爆发。" },
  { title: "真千金回归", category: "身份揭晓", content: "真假千金反转，假千金原形毕露，全员认错。" },
  { title: "憋屈→反转→打脸→升级", category: "爽点节奏", content: "标准爽点递进节奏：每段冲突后给一个更爽的反击，层层加码。" },
  { title: "每章末留钩子", category: "爽点节奏", content: "结尾抛出一个新悬念或危机，逼读者往下看。" },
];

async function main() {
  const count = await prisma.trope.count();
  if (count > 0) {
    console.log("钩子库已有 " + count + " 条，跳过种子。");
    await prisma.$disconnect();
    return;
  }
  const r = await prisma.trope.createMany({ data: tropes });
  console.log("已写入 " + r.count + " 条钩子模板。");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
