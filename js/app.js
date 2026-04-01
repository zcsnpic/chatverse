class ChatVerseApp {
    constructor() {
        this.currentPage = 'home';
        this.chatObjects = [];
        this.currentChatId = null;
        this.init();
    }
    
    init() {
        this.loadChatObjects();
        this.setupEventListeners();
        this.renderChatList();
        this.updateStorageDisplay();
    }
    
    loadChatObjects() {
        this.chatObjects = storage.getChatObjects();
    }
    
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderChatList();
        });
    }
    
    // 导航
    navigateTo(page) {
        const pages = ['home', 'chat', 'create', 'settings'];
        
        pages.forEach(p => {
            const pageEl = document.getElementById(`page-${p}`);
            if (pageEl) {
                if (p === page) {
                    pageEl.classList.remove('hidden');
                    pageEl.classList.add('active');
                } else {
                    pageEl.classList.add('hidden');
                    pageEl.classList.remove('active');
                }
            }
        });
        
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(page)) {
                btn.classList.add('active');
            }
        });
        
        this.currentPage = page;
        
        if (page === 'chat' && this.currentChatId) {
            chatManager.setCurrentChat(this.currentChatId);
            chatManager.updateChatHeader();
        }
        
        if (page === 'create') {
            this.resetCreateForm();
        }
        
        if (page === 'settings') {
            this.updateSettingsDisplay();
        }
    }
    
    // 聊天列表
    renderChatList(filter = '') {
        const container = document.getElementById('chat-object-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;
        
        let filteredObjects = this.chatObjects;
        
        if (filter) {
            filteredObjects = this.chatObjects.filter(obj => 
                obj.name.toLowerCase().includes(filter.toLowerCase())
            );
        }
        
        if (filteredObjects.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = filteredObjects.map(obj => {
            const messages = storage.getMessages(obj.id);
            const lastMessage = messages[messages.length - 1];
            const time = lastMessage ? this.formatTime(lastMessage.timestamp) : '';
            const preview = lastMessage 
                ? (lastMessage.sender === 'user' ? '我: ' : obj.name + ': ') + (lastMessage.content || (lastMessage.messages?.[0]?.voice || ''))
                : '开始聊天...';
            
            return `
                <div class="chat-card" onclick="App.openChat('${obj.id}')">
                    <div class="avatar" style="background: linear-gradient(135deg, ${this.getAvatarColor(obj.name)});">
                        ${obj.name.charAt(0)}
                    </div>
                    <div class="chat-info-main">
                        <div class="chat-info-header">
                            <span class="chat-name">${this.escapeHtml(obj.name)}</span>
                            <span class="chat-time">${time}</span>
                        </div>
                        <p class="chat-preview">${this.escapeHtml(preview)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    filterChatObjects(value) {
        this.renderChatList(value);
    }
    
    // 聊天功能
    openChat(objectId) {
        this.currentChatId = objectId;
        this.navigateTo('chat');
        chatManager.setCurrentChat(objectId);
        chatManager.updateChatHeader();
    }
    
    sendMessage() {
        const input = document.getElementById('message-input');
        if (!input) return;
        
        const content = input.value.trim();
        if (!content) return;
        
        input.value = '';
        chatManager.sendMessage(content);
    }
    
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    toggleEmojiPanel() {
        this.showToast('表情功能开发中...');
    }
    
    // 记忆管理
    toggleMemoryDrawer() {
        const drawer = document.getElementById('memory-drawer');
        if (drawer) {
            drawer.classList.toggle('hidden');
            if (!drawer.classList.contains('hidden')) {
                this.loadMemories();
            }
        }
    }
    
    loadMemories() {
        if (!this.currentChatId) return;
        
        const container = document.getElementById('memory-list');
        if (!container) return;
        
        const memories = storage.getMemories(this.currentChatId);
        const sortedMemories = memories.sort((a, b) => b.importance - a.importance);
        
        if (sortedMemories.length === 0) {
            container.innerHTML = '<p style="color: var(--lavender); text-align: center; padding: 20px;">暂无记忆</p>';
            return;
        }
        
        container.innerHTML = sortedMemories.map(mem => {
            const stars = '⭐'.repeat(mem.importance);
            return `
                <div class="memory-item priority-${mem.importance}">
                    <p>${this.escapeHtml(mem.content)}</p>
                    <span>${stars}</span>
                </div>
            `;
        }).join('');
    }
    
    showAddMemoryModal() {
        const content = `
            <div class="form-group" style="margin-bottom: 16px;">
                <label>记忆内容</label>
                <textarea id="new-memory-content" rows="3" placeholder="描述这段记忆..."></textarea>
            </div>
            <div class="form-group">
                <label>重要程度</label>
                <select id="new-memory-importance" style="width: 100%; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
                    <option value="1">⭐</option>
                    <option value="2">⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option>
                    <option value="5" selected>⭐⭐⭐⭐⭐</option>
                </select>
            </div>
        `;
        
        this.showModal('添加记忆', content, () => {
            const contentInput = document.getElementById('new-memory-content');
            const importanceSelect = document.getElementById('new-memory-importance');
            
            if (contentInput && contentInput.value.trim()) {
                storage.saveMemory({
                    objectId: this.currentChatId,
                    content: contentInput.value.trim(),
                    importance: parseInt(importanceSelect.value)
                });
                
                this.loadMemories();
                this.showToast('记忆添加成功');
            }
        });
    }
    
    resetContext() {
        if (confirm('确定要重置上下文吗？这会清除当前对话的上下文影响，但保留角色的设定和关键记忆。')) {
            aiService.resetContext(this.currentChatId);
            this.showToast('上下文已重置！');
        }
    }
    
    // 创建聊天对象
    resetCreateForm() {
        const form = document.getElementById('create-form');
        if (form) form.reset();
        
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
        }
        
        const memoryFields = document.getElementById('memory-fields');
        if (memoryFields) {
            memoryFields.innerHTML = `
                <div class="memory-field-item">
                    <input type="text" placeholder="记忆内容" class="memory-input">
                    <select class="memory-importance">
                        <option value="1">⭐</option>
                        <option value="2">⭐⭐</option>
                        <option value="3">⭐⭐⭐</option>
                        <option value="4">⭐⭐⭐⭐</option>
                        <option value="5" selected>⭐⭐⭐⭐⭐</option>
                    </select>
                </div>
            `;
        }
    }
    
    triggerAvatarUpload() {
        const input = document.getElementById('avatar-input');
        if (input) input.click();
    }
    
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('avatar-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        };
        reader.readAsDataURL(file);
    }
    
    addMemoryField() {
        const container = document.getElementById('memory-fields');
        if (!container) return;
        
        const fieldHtml = `
            <div class="memory-field-item">
                <input type="text" placeholder="记忆内容" class="memory-input">
                <select class="memory-importance">
                    <option value="1">⭐</option>
                    <option value="2">⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option>
                    <option value="5" selected>⭐⭐⭐⭐⭐</option>
                </select>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', fieldHtml);
    }
    
    createChatObject() {
        const name = document.getElementById('object-name')?.value.trim();
        const identity = document.getElementById('object-identity')?.value.trim();
        const role = document.getElementById('object-role')?.value.trim();
        
        if (!name) {
            this.showToast('请输入角色名称');
            return;
        }
        
        const memoryInputs = document.querySelectorAll('.memory-field-item');
        const memories = [];
        
        memoryInputs.forEach(item => {
            const input = item.querySelector('.memory-input');
            const select = item.querySelector('.memory-importance');
            
            if (input && input.value.trim()) {
                memories.push({
                    content: input.value.trim(),
                    importance: parseInt(select.value)
                });
            }
        });
        
        const avatarPreview = document.getElementById('avatar-preview');
        const img = avatarPreview?.querySelector('img');
        const avatar = img ? img.src : null;
        
        const chatObject = storage.createChatObject({
            name,
            avatar,
            identity,
            role,
            memories
        });
        
        memories.forEach(mem => {
            storage.saveMemory({
                objectId: chatObject.id,
                content: mem.content,
                importance: mem.importance
            });
        });
        
        this.loadChatObjects();
        this.renderChatList();
        this.showToast('角色创建成功！');
        this.navigateTo('home');
    }
    
    // 设置功能
    updateSettingsDisplay() {
        const storageUsage = storage.getStorageUsage();
        const usageEl = document.getElementById('storage-usage');
        const barFill = document.getElementById('storage-bar-fill');
        const modelEl = document.getElementById('current-model');
        const themeEl = document.getElementById('current-theme');
        
        if (usageEl) {
            usageEl.textContent = `${storageUsage.usedMB} MB / 2 GB`;
        }
        
        if (barFill) {
            barFill.style.width = `${storageUsage.percentage}%`;
        }
        
        if (modelEl) {
            modelEl.textContent = modelConfig.getModel().name;
        }
        
        if (themeEl) {
            themeEl.textContent = 'Midnight Galaxy';
        }
    }
    
    updateStorageDisplay() {
        const storageUsage = storage.getStorageUsage();
        const usageEl = document.getElementById('storage-usage');
        const barFill = document.getElementById('storage-bar-fill');
        
        if (usageEl) {
            usageEl.textContent = `${storageUsage.usedMB} MB / 2 GB`;
        }
        
        if (barFill) {
            barFill.style.width = `${storageUsage.percentage}%`;
        }
    }
    
    showModelSelector() {
        const providers = Object.entries(AIModels).map(([key, model]) => {
            const isSelected = key === modelConfig.currentProvider;
            const models = model.models.map(m => 
                `<option value="${m.id}" ${m.id === modelConfig.currentModel ? 'selected' : ''}>${m.name}</option>`
            ).join('');
            
            return `
                <div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                    <span style="font-weight: 600; color: var(--lavender);">${model.name}</span>
                    <select onchange="App.selectModel('${key}', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
                        ${models}
                    </select>
                </div>
            `;
        }).join('');
        
        const content = `
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: var(--silver);">API Key</label>
                <input type="password" id="api-key-input" value="${modelConfig.apiKey}" placeholder="输入 API Key" style="width: 100%; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: var(--silver);">选择提供商和模型</label>
                ${providers}
            </div>
        `;
        
        this.showModal('AI 模型设置', content, () => {
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput) {
                modelConfig.setApiKey(apiKeyInput.value);
            }
            this.updateSettingsDisplay();
            this.showToast('设置已保存');
        });
    }
    
    selectModel(provider, modelId) {
        modelConfig.setProvider(provider);
        modelConfig.setModel(modelId);
    }
    
    showAPIConfig() {
        const content = `
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: var(--silver);">API URL（可选）</label>
                <input type="text" id="custom-api-url" value="${modelConfig.customApiUrl}" placeholder="使用默认URL或输入自定义地址" style="width: 100%; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: var(--silver);">消息延迟</label>
                <div style="display: flex; gap: 12px;">
                    <input type="number" id="delay-min" value="${modelConfig.messageDelay.min / 1000}" min="0.5" max="10" step="0.5" style="flex: 1; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
                    <input type="number" id="delay-max" value="${modelConfig.messageDelay.max / 1000}" min="1" max="20" step="0.5" style="flex: 1; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(164,144,194,0.3); color: var(--silver);">
                </div>
            </div>
        `;
        
        this.showModal('API 设置', content, () => {
            const customUrl = document.getElementById('custom-api-url')?.value;
            const delayMin = parseFloat(document.getElementById('delay-min')?.value) * 1000;
            const delayMax = parseFloat(document.getElementById('delay-max')?.value) * 1000;
            
            if (customUrl) modelConfig.setCustomApiUrl(customUrl);
            if (!isNaN(delayMin) && !isNaN(delayMax)) {
                modelConfig.setMessageDelay(delayMin, delayMax);
            }
            
            this.showToast('API设置已保存');
        });
    }
    
    exportData() {
        const data = storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatverse_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('数据导出成功');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    storage.importData(data);
                    this.loadChatObjects();
                    this.renderChatList();
                    this.updateStorageDisplay();
                    this.showToast('数据导入成功');
                } catch (error) {
                    this.showToast('数据导入失败');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            if (confirm('再次确认：所有聊天记录、角色和设置都将被删除！')) {
                storage.clearAllData();
                aiService.clearAllContext();
                this.loadChatObjects();
                this.renderChatList();
                this.updateStorageDisplay();
                this.showToast('所有数据已清除');
            }
        }
    }
    
    showThemeSelector() {
        this.showToast('主题功能开发中...');
    }
    
    showAbout() {
        this.showModal('关于 ChatVerse', `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                <h2 style="color: var(--silver); margin-bottom: 8px;">ChatVerse</h2>
                <p style="color: var(--lavender); margin-bottom: 16px;">虚拟聊天空间</p>
                <p style="color: var(--lavender); font-size: 14px;">版本 1.0.0</p>
                <p style="color: var(--lavender); font-size: 14px; margin-top: 16px;">支持 DeepSeek、OpenAI、Anthropic、Google Gemini 等多种 AI 模型</p>
            </div>
        `);
    }
    
    // 模态框和提示
    showModal(title, content, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        
        if (!overlay || !titleEl || !bodyEl) return;
        
        titleEl.textContent = title;
        bodyEl.innerHTML = content + `
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button onclick="App.closeModal()" style="flex: 1; padding: 12px; border: 1px solid rgba(164,144,194,0.3); border-radius: 8px; background: none; color: var(--lavender); cursor: pointer;">取消</button>
                <button onclick="App.confirmModal()" style="flex: 1; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, var(--cosmic-blue), var(--lavender)); color: var(--silver); cursor: pointer;">确定</button>
            </div>
        `;
        
        overlay.classList.remove('hidden');
        
        window.modalConfirmCallback = onConfirm;
    }
    
    confirmModal() {
        if (window.modalConfirmCallback) {
            window.modalConfirmCallback();
        }
        this.closeModal();
    }
    
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toast-message');
        
        if (!toast || !messageEl) return;
        
        messageEl.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    // 工具方法
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}-${day}`;
    }
    
    getAvatarColor(name) {
        const colors = [
            '#6366f1, #8b5cf6',
            '#ec4899, #f43f5e',
            '#10b981, #059669',
            '#f59e0b, #d97706',
            '#3b82f6, #2563eb'
        ];
        
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const App = new ChatVerseApp();