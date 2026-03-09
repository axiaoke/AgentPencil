/**
 * 阿里云百炼 API 工具
 */
const config = require('../config');

/**
 * 调用百炼智能体 API
 * @param {string} appId - 应用 ID
 * @param {string} prompt - 提示词
 * @returns {Promise<string>} - AI 返回的文本
 */
async function callBailianAPI(appId, prompt) {
    const apiKey = config.bailian.apiKey;
    if (!apiKey || !appId) {
        throw new Error('百炼 API 未配置');
    }

    const response = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { prompt },
                parameters: {},
                debug: {}
            })
        }
    );

    const data = await response.json();
    if (data.output && data.output.text) {
        return data.output.text;
    }
    throw new Error(data.message || 'API 调用失败');
}

/**
 * 解析百炼审核结果 JSON
 * @param {string} auditResult - AI 返回的文本
 * @returns {{ status: string, review: string }}
 */
function parseAuditResult(auditResult) {
    try {
        let jsonStr = auditResult;
        const jsonMatch = auditResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        const status = (parsed.result && parsed.result[0] === '已审核') ? 'approved' : 'pending';
        const review = parsed.review ? parsed.review[0] : auditResult;
        return { status, review };
    } catch (e) {
        return { status: 'pending', review: auditResult };
    }
}

module.exports = {
    callBailianAPI,
    parseAuditResult
};
