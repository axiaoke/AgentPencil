/**
 * AI 业务逻辑服务
 */
const config = require('../config');
const { callBailianAPI } = require('../utils/bailian');

const aiService = {
    /**
     * AI 生成内容（标题/关键词/描述）
     */
    async generate(type, content, current_title = '', current_keywords = '', current_description = '') {
        const appId = config.bailian.generateAppId;
        if (!appId || !config.bailian.apiKey) {
            return { error: '百炼 API 未配置', code: 400 };
        }

        let prompt = '';
        switch (type) {
            case 'all':
                prompt = `# Role
你是一位专业的智能内容生成助手，专为文章管理系统提供元数据生成服务。你的任务是根据用户提供的主题或草稿，生成高质量的标题、关键词和文章描述。

# Constraints & Rules
请严格遵守以下生成规则：

1. **标题 (title)**：
   - 长度严格控制在 10 到 25 个中文字符之间。
   - 必须具有吸引力且准确概括主题。

2. **关键词 (keywords)**：
   - 数量必须为 3 到 8 个词语。
   - **格式强制**：必须使用英文半角逗号 \`,\` 分隔，严禁使用中文逗号 \`，\` 或其他符号。
   - 词语之间不要有空格（例如：\`AI,科技,未来\`）。

3. **文章描述 (description)**：
   - 必须是一段完整的总结性文字。
   - 长度严格控制在 30 到 100 个中文字符之间。
   - 内容需精炼，能够吸引读者点击。

4. **上下文感知逻辑 (重要)**：
   - 系统将向你传递三个字段：\`current_title\`, \`current_keywords\`, \`current_description\`。
   - **判断逻辑**：
     - 如果 \`current_title\` 不为空（即已有内容），你在生成的 JSON 中该字段必须返回 \`null\` 或空字符串 \`""\`，表示“不替换”。
     - 如果 \`current_keywords\` 不为空，你在生成的 JSON 中该字段必须返回 \`null\` 或空字符串 \`""\`。
     - 如果 \`current_description\` 不为空，你在生成的 JSON 中该字段必须返回 \`null\` 或空字符串 \`""\`。
   - **只有当对应字段为空时**，你才需要生成符合要求的新内容填入。

# Output Format
- **仅**返回一个标准的 JSON 对象。
- 不要包含 markdown 标记（如 \`\`\`json ... \`\`\`），不要包含任何解释性文字。
- JSON 结构如下：
{
  "title": "生成的标题或 null",
  "keywords": "生成的,关键词,列表 或 null",
  "description": "生成的文章描述内容 或 null"
}

# Input Data
用户提供的文章主题/草稿：${content}
当前表单状态：
- 标题框内容：${current_title}
- 关键词框内容：${current_keywords}
- 描述框内容：${current_description}`;
                break;

            default:
                return { error: '无效的生成类型', code: 400 };
        }

        const result = await callBailianAPI(appId, prompt);
        return { result: result.trim() };
    }
};

module.exports = aiService;
