export interface StoreProduct {
  id: string;
  title: string;
  sub: string;
  badge: string;
  price: string;
  originalPrice?: string;
  period: string;
  prefix: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  stockStatus: "充足现货" | "库存紧张" | "极速秒发";
  category?: "ai" | "tools";
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "gpt_plus",
    title: "ChatGPT Plus 官方正规代充",
    sub: "自备账号 · 独享订阅 · 官方正规",
    badge: "销量冠军",
    price: "140",
    originalPrice: "155",
    period: "30天质保",
    prefix: "PH-",
    stockStatus: "极速秒发",
    category: "ai",
    description: "正规海外实体商务卡代充，绝非低价黑卡，一人一卡安全不封号。官方完整权益，保留全部历史对话。",
    features: [
      "充值到您自己的 ChatGPT 账号，历史对话完整保留",
      "独享 GPT-4o 顶配算力 & o1-preview 深度思考模型",
      "畅享 DALL-E 3 高清作图、高级语音及 GPTs 商店",
      "无需提供账号密码，仅凭安全会话凭证 10 秒自动到账",
      "提供 30 天完整售后质保，翻车全额秒补"
    ],
    isPopular: true
  },
  {
    id: "claude_pro",
    title: "Claude 3.5 Sonnet Pro 尊享月卡",
    sub: "编程神级辅助 · 200K 长上下文",
    badge: "开发者热荐",
    price: "168",
    originalPrice: "198",
    period: "30天质保",
    prefix: "CLAUDE-",
    stockStatus: "充足现货",
    category: "ai",
    description: "面向资深开发者的 Claude 3.5 Sonnet 顶配版，写代码、长上下文逻辑推理综合能力行业第一梯队。",
    features: [
      "解锁 Claude 3.5 Sonnet 满血模型调用",
      "支持 Artifacts 动态交互式前端实时预览",
      "200K 超长 Token 上下文，整套项目代码库直接分析",
      "支持官方网页版及手机端客户端无缝使用",
      "独享正规渠道代开，提供全程售后服务保障"
    ],
    isPopular: true
  },
  {
    id: "gpt_pro_5x",
    title: "ChatGPT Pro 5x 深度推理版",
    sub: "高频重度思考 · 5倍顶格算力",
    badge: "深度思考",
    price: "660",
    originalPrice: "850",
    period: "月卡 / 5x并发",
    prefix: "PRO5-",
    stockStatus: "极速秒发",
    category: "ai",
    description: "专为高频深度研究与代码重构打造，解锁超高频 o1 深度思考配额，高峰期不排队不限流。",
    features: [
      "5 倍于标准版 Plus 算力，o1 深度思考配额大幅拉满",
      "支持超长代码库重构分析与自动化复杂规划",
      "独立账号原生代充开通，保留已有历史对话记录",
      "专享极速推理节点链路，高峰时段响应零排队",
      "提供 30 天完整售后支持与官方状态追踪"
    ],
    isPopular: false
  },
  {
    id: "gpt_pro_20x",
    title: "ChatGPT Pro 满血旗舰 (20x 算力)",
    sub: "工业级吞吐 · 满血 o1-pro 极限推理",
    badge: "算力怪兽",
    price: "1050",
    originalPrice: "1400",
    period: "月卡 / 20x旗舰",
    prefix: "PRO20SPECIAL-",
    stockStatus: "极速秒发",
    category: "ai",
    description: "面向顶级科研院所、全栈架构师与专业工程团队的终极算力包，享受 OpenAI 顶格算力特权。",
    features: [
      "20 倍顶格并发算力，解锁满血 o1-pro 极限逻辑推理",
      "无限次复杂算法与科研级超难任务并行计算",
      "独享企业级超低延迟骨干链路，吞吐极致丝滑",
      "正规海外商务卡直充，可提供对公发票凭证",
      "站长 1 对 1 VIP 专属履约通道与全天候技术保障"
    ],
    isPopular: false
  },
  {
    id: "gemini_pro",
    title: "Gemini 1.5 / 2.0 Pro 谷歌官方独享",
    sub: "200万超大上下文 · 谷歌顶级模型",
    badge: "超长文本",
    price: "18",
    originalPrice: "35",
    period: "独享月卡",
    prefix: "GEMINI-",
    stockStatus: "充足现货",
    category: "ai",
    description: "谷歌顶配多模态大模型，原生支持整部视频、音频及数百万行代码直接喂入，超高性价比。",
    features: [
      "高达 2,000,000 Token 行业天花板超长上下文视窗",
      "原生多模态：整段超长音视频、PDF 图表毫秒级深度理解",
      "深度整合 Google Workspace (Docs/Gmail/Drive) 智能生态",
      "自备或独享全新谷歌账号开通，安全稳定不串号",
      "提供完整周期售后质保与账号防封使用指南"
    ],
    isPopular: true
  },
  {
    id: "step_star",
    title: "Step 阶跃星辰 Step-2 旗舰大模型",
    sub: "Step-5-Review 模型 · 中文深度推理",
    badge: "中文巅峰",
    price: "29",
    originalPrice: "59",
    period: "月卡 / 1~2月",
    prefix: "STEP-",
    stockStatus: "极速秒发",
    category: "ai",
    description: "国内顶级大模型代表作，长文本理解能力出众，数理逻辑与代码生成高度契合中文开发场景。",
    features: [
      "支持 Step-2 及最新 Step-5-Review 深度思考模型",
      "卓越的中文多轮复杂对话与本土化知识图谱理解",
      "超大上下文连续处理，支持长文档精细化结构解析",
      "一键极速开通交付，小白包教包会",
      "下单可直接添加站长微信享受 1 对 1 调试服务"
    ],
    isPopular: false
  },
  {
    id: "vpn_turbo",
    title: "极客海外高速加速专线",
    sub: "BGP 专线直达 · 4K 秒开 · 纯净住宅 IP",
    badge: "站长自用",
    price: "10",
    originalPrice: "30",
    period: "月付 / 备用首选",
    prefix: "NET-",
    stockStatus: "充足现货",
    category: "tools",
    description: "站长一直自用的高性价比极客专线，专为 ChatGPT / Claude 访问优化，秒杀市面高价拥堵节点。",
    features: [
      "东京 / 美西双向优质 BGP 专线直连，超低延迟 38ms",
      "原生 Anycast / 住宅级信誉 IP 出口，避免触发 AI 封锁",
      "支持手机 iOS/Android、Mac/Windows 全平台客户端配置",
      "4K/8K 视频毫无卡顿，多地备用容灾节点秒级自动切换",
      "提供手把手配置指引，新手小白 3 分钟即可配置通畅"
    ],
    isPopular: false
  },
  {
    id: "sms_activate",
    title: "全球海外短信接码 / 独享号",
    sub: "OpenAI / Claude / Google 注册专用",
    badge: "小白包会",
    price: "5",
    originalPrice: "15",
    period: "单次 / 独享接收",
    prefix: "SMS-",
    stockStatus: "极速秒发",
    category: "tools",
    description: "覆盖美、英、日等全球多区实体运营商号码，轻松通过海外 AI 平台的新用户注册与手机风控校验。",
    features: [
      "纯正海外实体运营商号段，100% 通过 OpenAI / Claude 验证",
      "一客一号私密接收，绝非共享公网池，杜绝风控连带封号",
      "支持各国家/地区按需指定，短信验证码秒级同步回显",
      "针对新手小白提供一对一指导或向日葵远程协助开通",
      "接码不成功全额秒退，售后无忧零风险"
    ],
    isPopular: false
  }
];