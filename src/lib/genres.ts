export type Genre = {
  id: string;
  label: string;
  category: "女频" | "男频" | "通用";
};

export const GENRES: Genre[] = [
  // 女频
  { id: "追夫火葬场", label: "追夫火葬场", category: "女频" },
  { id: "追妻火葬场", label: "追妻火葬场", category: "女频" },
  { id: "重生复仇", label: "重生复仇", category: "女频" },
  { id: "真假千金", label: "真假千金", category: "女频" },
  { id: "白月光替身", label: "白月光/替身", category: "女频" },
  { id: "闪婚隐婚", label: "闪婚/隐婚", category: "女频" },
  { id: "总裁豪门", label: "总裁豪门", category: "女频" },
  { id: "团宠", label: "团宠", category: "女频" },
  { id: "马甲", label: "马甲（多重身份）", category: "女频" },
  { id: "先婚后爱", label: "先婚后爱", category: "女频" },
  // 男频
  { id: "扮猪吃虎", label: "扮猪吃虎", category: "男频" },
  { id: "战神回归", label: "战神/兵王回归", category: "男频" },
  { id: "神医", label: "神医", category: "男频" },
  { id: "系统", label: "系统", category: "男频" },
  { id: "逆袭打脸", label: "逆袭打脸", category: "男频" },
  { id: "鉴宝", label: "鉴宝", category: "男频" },
  { id: "奶爸萌宝", label: "奶爸/萌宝", category: "男频" },
  { id: "无限流", label: "无限流", category: "男频" },
  { id: "修仙玄幻", label: "修仙/玄幻", category: "男频" },
  // 通用
  { id: "悬疑反转", label: "悬疑反转", category: "通用" },
  { id: "通用爽文", label: "通用爽文", category: "通用" },
];
