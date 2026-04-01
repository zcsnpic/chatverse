const AIModels = {
    deepseek: {
        name: 'DeepSeek',
        provider: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1',
        models: [
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                description: '通用对话模型，适合日常聊天'
            },
            {
                id: 'deepseek-coder',
                name: 'DeepSeek Coder',
                description: '编程专用模型'
            }
        ],
        defaultModel: 'deepseek-chat',
        supportsSystemPrompt: true,
        supportsVision: false,
        maxContextLength: 8192
    },
    
    openai: {
        name: 'OpenAI',
        provider: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: '最新最强模型，支持多模态'
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: '快速强大的GPT-4版本'
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                description: '轻量快速，适合简单任务'
            }
        ],
        defaultModel: 'gpt-4o',
        supportsSystemPrompt: true,
        supportsVision: true,
        maxContextLength: 128000
    },
    
    anthropic: {
        name: 'Anthropic',
        provider: 'Anthropic',
        apiUrl: 'https://api.anthropic.com/v1',
        models: [
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet',
                description: '最新Claude模型，强大且快速'
            },
            {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                description: '最强大的Claude模型'
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                description: '快速轻量级模型'
            }
        ],
        defaultModel: 'claude-3-5-sonnet-20241022',
        supportsSystemPrompt: true,
        supportsVision: true,
        maxContextLength: 200000
    },
    
    gemini: {
        name: 'Google Gemini',
        provider: 'Google',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: [
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                description: '支持超长上下文'
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: '快速响应，适合日常使用'
            },
            {
                id: 'gemini-pro',
                name: 'Gemini Pro',
                description: '标准Gemini模型'
            }
        ],
        defaultModel: 'gemini-1.5-pro',
        supportsSystemPrompt: true,
        supportsVision: true,
        maxContextLength: 1000000
    },
    
    ollama: {
        name: 'Ollama (本地)',
        provider: 'Ollama',
        apiUrl: 'http://localhost:11434/v1',
        models: [
            {
                id: 'llama3.2',
                name: 'Llama 3.2',
                description: 'Meta最新开源模型'
            },
            {
                id: 'qwen2.5',
                name: 'Qwen 2.5',
                description: '阿里通义千问模型'
            },
            {
                id: 'codellama',
                name: 'Code Llama',
                description: '编程专用模型'
            }
        ],
        defaultModel: 'llama3.2',
        supportsSystemPrompt: true,
        supportsVision: false,
        maxContextLength: 4096,
        isLocal: true
    }
};

class ModelConfig {
    constructor() {
        this.currentProvider = 'deepseek';
        this.currentModel = 'deepseek-chat';
        this.apiKey = '';
        this.customApiUrl = '';
        this.messageDelay = { min: 1000, max: 2000 };
        this.loadConfig();
    }
    
    loadConfig() {
        const saved = localStorage.getItem('modelConfig');
        if (saved) {
            const config = JSON.parse(saved);
            this.currentProvider = config.provider || 'deepseek';
            this.currentModel = config.model || AIModels[this.currentProvider]?.defaultModel;
            this.apiKey = config.apiKey || '';
            this.customApiUrl = config.customApiUrl || '';
            this.messageDelay = config.messageDelay || { min: 1000, max: 2000 };
        }
    }
    
    saveConfig() {
        const config = {
            provider: this.currentProvider,
            model: this.currentModel,
            apiKey: this.apiKey,
            customApiUrl: this.customApiUrl,
            messageDelay: this.messageDelay
        };
        localStorage.setItem('modelConfig', JSON.stringify(config));
    }
    
    getProvider() {
        return AIModels[this.currentProvider];
    }
    
    getModel() {
        const provider = this.getProvider();
        return provider.models.find(m => m.id === this.currentModel) || provider.models[0];
    }
    
    setProvider(providerId) {
        if (AIModels[providerId]) {
            this.currentProvider = providerId;
            this.currentModel = AIModels[providerId].defaultModel;
            this.saveConfig();
        }
    }
    
    setModel(modelId) {
        this.currentModel = modelId;
        this.saveConfig();
    }
    
    setApiKey(key) {
        this.apiKey = key;
        this.saveConfig();
    }
    
    setCustomApiUrl(url) {
        this.customApiUrl = url;
        this.saveConfig();
    }
    
    setMessageDelay(min, max) {
        this.messageDelay = { min, max };
        this.saveConfig();
    }
    
    getApiUrl() {
        if (this.customApiUrl) {
            return this.customApiUrl;
        }
        return AIModels[this.currentProvider].apiUrl;
    }
    
    getRandomDelay() {
        return Math.random() * (this.messageDelay.max - this.messageDelay.min) + this.messageDelay.min;
    }
    
    hasApiKey() {
        return this.apiKey && this.apiKey.length > 0;
    }
}

const modelConfig = new ModelConfig();