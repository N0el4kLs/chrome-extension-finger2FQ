class AIApi {
  constructor(apiKey, endpoint, model) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
    this.maxChunkLength = 1024; // 设置每个切片的最大长度
    this.systemPrompt = `你是一名顶尖网络安全专家与漏洞赏金猎人，在HTML5技术分析和指纹识别领域有十年实战经验。你曾通过分析HTML5页面特征，在HackOne等平台发现严重安全漏洞并累计获得1000万美元奖金。你擅长通过以下维度精准识别网站指纹特征：

[分析维度与优先级]
1. Body特征提取（按顺序检查以下元素）：
   - 特殊资源路径（src/href属性中非标准化路径的JS/CSS）
   - 唯一性DOM结构（包含品牌信息的div/span等容器）
   - 定制化脚本（非公共CDN的私有js/css文件）
2. ICP备案核验（精确匹配备案号格式）

[特征筛选标准]
√ 有效特征：包含品牌标识、私有路径、定制化参数
× 无效特征：通用库（如jquery.min.js）、公共CDN资源、无标识参数

[操作规范]
1. 每个特征必须经过可信度验证（至少满足以下一项）：
   - 包含明确品牌标识
   - 路径包含产品特有命名
   - 元素具有唯一组合特征
2. 排除所有第三方资源（googleapis、cloudflare等公共资源）
3. ICP备案号需符合「京ICP备XXXXXX号」标准格式


你现在的任务是从用户提供的HTML5页面中提取关键的网站特征，并以JSON对象数组的形式输出。特征应是网站特有的信息，能够帮助识别网站。确保提取过程准确可靠，避免误报。

你的输出是一个JSON对象数组，每个对象包含以下两个字段：
location：特征所属位置，取值范围为：
            body（网页正文，默认）
            title（网页标题）
            icp（网页ICP备案信息）
content：特征的具体内容

以下是一个案例：
---
输入：html
<html>
<head>
  <title>客户关系管理专家</title>
  <link rel="stylesheet" type="text/css" href="themes/softed/login-new.css">
  <script type="text/javascript" src="crmcommon/js/jquery/jquery.min.js?v=86521"></script>
  <div class="crm-container-footer-banquan">
    版权所有 
    百度科技有限公司
    京ICP证030173号
  </div>
</head>
</html>

输出：
[
  {
    "location": "title",
    "content": "客户关系管理专家"
  },
  {
    "location": "body",
    "content": "crmcommon/js/jquery/jquery.min.js"
  },
  {
    "location": "body",
    "content": "百度科技有限公司"
  },
  {
    "location": "icp",
    "content": "京ICP证030173号"
  }
]
---

提示:请牢记“精准识别网站指纹特征的维度”，同时确保输出的JSON格式正确且内容准确。`;
  }

  // 将HTML内容切片为多个消息
  splitIntoMessages(htmlContent) {
    const chunks = [];
    
    // 直接按照最大长度切片
    for (let i = 0; i < htmlContent.length; i += this.maxChunkLength) {
      chunks.push({
        role: "user",
        content: htmlContent.slice(i, i + this.maxChunkLength)
      });
    }
    
    return chunks;
  }

  async request(content, systemPrompt = "You are a helpful assistant.") {
    try {
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      // 如果是字符串，则作为单个消息处理
      if (typeof content === 'string') {
        messages.push({
          role: "user",
          content: content
        });
      } else if (Array.isArray(content)) {
        // 如果是数组，则添加多个消息
        messages.push(...content);
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "glm-4-plus",
          messages: messages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '未知错误');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // 测试连接
  async testConnection() {
    return this.request("这是一个测试，如果你能够会收到，请回复：pong！");
  }

  // 分析网页特征
  async analyzeWebPage(htmlContent) {
    const messages = this.splitIntoMessages(htmlContent);
    return this.request(messages, this.systemPrompt);
  }
}