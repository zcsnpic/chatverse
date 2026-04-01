class Storage {
    constructor() {
        this.STORAGE_KEYS = {
            CHAT_OBJECTS: 'chatverse_chat_objects',
            MESSAGES: 'chatverse_messages',
            MEMORIES: 'chatverse_memories',
            SETTINGS: 'chatverse_settings'
        };
    }
    
    // 聊天对象管理
    getChatObjects() {
        const data = localStorage.getItem(this.STORAGE_KEYS.CHAT_OBJECTS);
        return data ? JSON.parse(data) : [];
    }
    
    saveChatObjects(objects) {
        localStorage.setItem(this.STORAGE_KEYS.CHAT_OBJECTS, JSON.stringify(objects));
    }
    
    getChatObject(id) {
        const objects = this.getChatObjects();
        return objects.find(obj => obj.id === id);
    }
    
    createChatObject(objectData) {
        const objects = this.getChatObjects();
        const newObject = {
            id: this.generateId(),
            name: objectData.name,
            avatar: objectData.avatar || null,
            identity: objectData.identity || '',
            role: objectData.role || '',
            memories: objectData.memories || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        objects.push(newObject);
        this.saveChatObjects(objects);
        return newObject;
    }
    
    updateChatObject(id, updates) {
        const objects = this.getChatObjects();
        const index = objects.findIndex(obj => obj.id === id);
        if (index !== -1) {
            objects[index] = {
                ...objects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveChatObjects(objects);
            return objects[index];
        }
        return null;
    }
    
    deleteChatObject(id) {
        const objects = this.getChatObjects();
        const filtered = objects.filter(obj => obj.id !== id);
        this.saveChatObjects(filtered);
        
        // 同时删除相关的消息和记忆
        this.deleteMessagesByObject(id);
        this.deleteMemoriesByObject(id);
    }
    
    // 消息管理
    getMessages(objectId) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        const allMessages = data ? JSON.parse(data) : [];
        return allMessages.filter(msg => msg.objectId === objectId);
    }
    
    getAllMessages() {
        const data = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        return data ? JSON.parse(data) : [];
    }
    
    saveMessage(message) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        const messages = data ? JSON.parse(data) : [];
        const newMessage = {
            id: this.generateId(),
            ...message,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        return newMessage;
    }
    
    saveUserMessage(objectId, content) {
        return this.saveMessage({
            objectId,
            sender: 'user',
            messageType: 'single',
            content
        });
    }
    
    saveAIMessage(objectId, messages) {
        return this.saveMessage({
            objectId,
            sender: 'ai',
            messageType: 'batch',
            messages
        });
    }
    
    deleteMessagesByObject(objectId) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        const messages = data ? JSON.parse(data) : [];
        const filtered = messages.filter(msg => msg.objectId !== objectId);
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(filtered));
    }
    
    // 记忆管理
    getMemories(objectId) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        const allMemories = data ? JSON.parse(data) : [];
        return allMemories.filter(mem => mem.objectId === objectId);
    }
    
    getAllMemories() {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        return data ? JSON.parse(data) : [];
    }
    
    saveMemory(memory) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        const memories = data ? JSON.parse(data) : [];
        const newMemory = {
            id: this.generateId(),
            ...memory,
            createdAt: new Date().toISOString()
        };
        memories.push(newMemory);
        localStorage.setItem(this.STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
        return newMemory;
    }
    
    updateMemory(id, updates) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        const memories = data ? JSON.parse(data) : [];
        const index = memories.findIndex(mem => mem.id === id);
        if (index !== -1) {
            memories[index] = { ...memories[index], ...updates };
            localStorage.setItem(this.STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
            return memories[index];
        }
        return null;
    }
    
    deleteMemory(id) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        const memories = data ? JSON.parse(data) : [];
        const filtered = memories.filter(mem => mem.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.MEMORIES, JSON.stringify(filtered));
    }
    
    deleteMemoriesByObject(objectId) {
        const data = localStorage.getItem(this.STORAGE_KEYS.MEMORIES);
        const memories = data ? JSON.parse(data) : [];
        const filtered = memories.filter(mem => mem.objectId !== objectId);
        localStorage.setItem(this.STORAGE_KEYS.MEMORIES, JSON.stringify(filtered));
    }
    
    // 工具方法
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.CHAT_OBJECTS);
        localStorage.removeItem(this.STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(this.STORAGE_KEYS.MEMORIES);
        localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
    }
    
    exportData() {
        return {
            chatObjects: this.getChatObjects(),
            messages: this.getAllMessages(),
            memories: this.getAllMemories(),
            settings: localStorage.getItem(this.STORAGE_KEYS.SETTINGS),
            exportedAt: new Date().toISOString()
        };
    }
    
    importData(data) {
        if (data.chatObjects) {
            this.saveChatObjects(data.chatObjects);
        }
        if (data.messages) {
            localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
        }
        if (data.memories) {
            localStorage.setItem(this.STORAGE_KEYS.MEMORIES, JSON.stringify(data.memories));
        }
        if (data.settings) {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, data.settings);
        }
    }
    
    getStorageUsage() {
        const keys = Object.values(this.STORAGE_KEYS);
        let totalSize = 0;
        
        keys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                totalSize += data.length * 2;
            }
        });
        
        return {
            used: totalSize,
            usedMB: (totalSize / (1024 * 1024)).toFixed(2),
            total: 2 * 1024 * 1024 * 1024,
            percentage: ((totalSize / (2 * 1024 * 1024 * 1024)) * 100).toFixed(2)
        };
    }
}

const storage = new Storage();