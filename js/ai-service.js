class AIService {
    constructor() {
        this.config = modelConfig;
        this.contextMap = new Map();
    }
    
    buildSystemPrompt(chatObject) {
        const memories = storage.getMemories(chatObject.id);
        const sortedMemories = memories.sort((a, b) => b.importance - a.importance);
        
        let memoryContext = '';
        if (sortedMemories.length > 0) {
            memoryContext = '\n\n【关键记忆】：\n';
            sortedMemories.forEach(mem => {
                const stars = '⭐'.repeat(mem.importance);
                memoryContext += `- ${mem.content} ${stars}\n`;
            });
        }
        
        return `【角色设定】\n名称：${chatObject.name}\n身份：${chatObject.identity}\n角色：${chatObject.role}${memoryContext}\n\n【双轨制消息格式要求】\n当你回复时，需要提供两种内容：\n1. 语音（台词）：角色说的话，用【语音】标记\n2. 动作/场景：用【动作】标记，描述角色的动作、表情或场景\n\n例如：\n【语音】你好，很高兴见到你！\n【动作】[ 微笑着向你招手，眼睛里带着温柔的光 ]`;
    }
    
    buildMessages(chatObject, userMessage) {
        const messages = [];
        
        // 添加系统提示
        const systemPrompt = this.buildSystemPrompt(chatObject);
        messages.push({
            role: 'system',
            content: systemPrompt
        });
        
        // 获取上下文消息
        const contextMessages = this.getContext(chatObject.id);
        
        // 添加历史消息
        contextMessages.forEach(msg => {
            if (msg.sender === 'user') {
                messages.push({
                    role: 'user',
                    content: msg.content
                });
            } else if (msg.sender === 'ai' && msg.messages) {
                const aiContent = msg.messages.map(m => 
                    `【语音】${m.voice}\n【动作】${m.action}`
                ).join('\n\n');
                messages.push({
                    role: 'assistant',
                    content: aiContent
                });
            }
        });
        
        // 添加用户新消息
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        return messages;
    }
    
    async sendMessage(chatObject, userMessage) {
        const messages = this.buildMessages(chatObject, userMessage);
        
        if (!this.config.hasApiKey()) {
            return this.generateLocalResponse(chatObject, userMessage);
        }
        
        try {
            const response = await this.callAPI(messages);
            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI API调用失败:', error);
            return this.generateLocalResponse(chatObject, userMessage);
        }
    }
    
    async callAPI(messages) {
        const url = `${this.config.getApiUrl()}/chat/completions`;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.config.currentProvider === 'deepseek') {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else if (this.config.currentProvider === 'openai') {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else if (this.config.currentProvider === 'anthropic') {
            headers['x-api-key'] = this.config.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        }
        
        let body = {
            model: this.config.currentModel,
            messages: messages,
            temperature: 0.8,
            max_tokens: 1000
        };
        
        if (this.config.currentProvider === 'anthropic') {
            body = {
                model: this.config.currentModel,
                messages: messages,
                temperature: 0.8,
                max_tokens: 1000
            };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (this.config.currentProvider === 'anthropic') {
            return data.content[0].text;
        } else {
            return data.choices[0].message.content;
        }
    }
    
    parseAIResponse(content) {
        const voiceMatch = content.match(/【语音】([\s\S]*?)【动作】/);
        const actionMatch = content.match(/【动作】([\s\S]*?)$/);
        
        let voice = content;
        let action = '[ 静静地站在那里 ]';
        
        if (voiceMatch) {
            voice = voiceMatch[1].trim();
        }
        
        if (actionMatch) {
            action = actionMatch[1].trim();
        }
        
        return {
            voice,
            action,
            timestamp: new Date().toISOString()
        };
    }
    
    generateLocalResponse(chatObject, userMessage) {
        const responses = [
            {
                voice: '嗯，让我想想...',
                action: '[ 若有所思地歪着头，手指轻轻敲着桌面 ]'
            },
            {
                voice: '这个话题很有趣呢！',
                action: '[ 眼睛亮了起来，身体微微前倾 ]'
            },
            {
                voice: '我理解你的意思了。',
                action: '[ 点了点头，露出温柔的微笑 ]'
            },
            {
                voice: '继续说吧，我在听。',
                action: '[ 用鼓励的眼神看着你 ]'
            },
            {
                voice: '好的，我明白了。',
                action: '[ 认真地听着，偶尔点头回应 ]'
            }
        ];
        
        const randomIndex = Math.floor(Math.random() * responses.length);
        return {
            ...responses[randomIndex],
            timestamp: new Date().toISOString()
        };
    }
    
    getContext(objectId) {
        if (!this.contextMap.has(objectId)) {
            this.contextMap.set(objectId, []);
        }
        return this.contextMap.get(objectId);
    }
    
    addToContext(objectId, message) {
        const context = this.getContext(objectId);
        context.push(message);
        
        if (context.length > 20) {
            context.shift();
        }
        
        this.contextMap.set(objectId, context);
    }
    
    resetContext(objectId) {
        this.contextMap.delete(objectId);
    }
    
    clearAllContext() {
        this.contextMap.clear();
    }
}

const aiService = new AIService();