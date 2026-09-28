const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const refs = [
  { category: "开头钩子", content: "三年了，所有人都以为他死了。直到今天，机场出口，一个穿着洗得发白衬衫的男人摘下了墨镜。正在陪未婚妻领证的前女友，手里的结婚证啪地掉在地上。他看着她，笑了：'好久不见。'" },
  { category: "打脸", content: "经理冷笑着把辞退书拍在桌上：'穷鬼，滚出我的店。'下一秒，店门被推开，十几个黑衣保镖齐刷刷鞠躬：'少爷，董事长请您回家。'经理的脸，白了。" },
  { category: "反转", content: "所有人都觉得他是个吃软饭的废物，连岳母都当众羞辱他。直到那天，一列加长车队停在老宅门口，管家跪地高呼：'恭迎家主归来。'那个被他们骂了三年的男人，缓步下车，眼神冷得像刀。" },
  { category: "对话", content: "'你配吗？'她轻蔑地抬起下巴。他笑了，慢条斯理地抽出一张卡放在桌上：'这是你公司百分之五十一的股份。'她脸上的笑，僵住了。" },
  { category: "爽点场景", content: "聚会上，富二代当众把红酒泼向他：'土包子，这杯酒够你赚一辈子。'他擦都不擦，掏出手机拨了个号。五分钟后，酒店经理满头大汗地跑来，当着所有人鞠了九十度躬：'老板，您怎么来了？'" },
];

async function main() {
  const count = await prisma.reference.count();
  if (count > 0) {
    console.log("范文库已有 " + count + " 条，跳过种子。");
    await prisma.$disconnect();
    return;
  }
  const r = await prisma.reference.createMany({ data: refs });
  console.log("已写入 " + r.count + " 条范文。");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
