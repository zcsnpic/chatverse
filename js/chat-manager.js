class ChatManager {
    constructor() {
        this.currentObjectId = null;
        this.isTyping = false;
        this.ttsEnabled = true;
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
    }
    
    setCurrentChat(objectId) {
        this.currentObjectId = objectId;
        this.loadMessages();
    }
    
    speakText(text, lang = 'zh-CN') {
        if (!this.ttsEnabled || !this.synth) return;
        
        this.stopSpeaking();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voices = this.synth.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
        if (chineseVoice) {
            utterance.voice = chineseVoice;
        }
        
        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }
    
    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
    
    loadMessages() {
        if (!this.currentObjectId) return;
        
        const messages = storage.getMessages(this.currentObjectId);
        const container = document.getElementById('message-container');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        messages.forEach((msg, index) => {
            this.renderMessage(msg, index);
        });
        
        this.scrollToBottom();
    }
    
    renderMessage(message, index = 0) {
        const container = document.getElementById('message-container');
        if (!container) return;
        
        const chatObject = storage.getChatObject(this.currentObjectId);
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.sender}`;
        messageEl.style.animationDelay = `${index * 0.1}s`;
        
        const avatar = message.sender === 'user' ? '我' : (chatObject?.name?.charAt(0) || '?');
        const avatarClass = message.sender === 'ai' ? '' : '';
        
        if (message.sender === 'user') {
            messageEl.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.escapeHtml(message.content)}</p>
                    </div>
                    <p class="message-time">${this.formatTime(message.timestamp)}</p>
                </div>
            `;
        } else {
            let messagesHtml = '';
            let voiceTexts = [];
            
            if (message.messages && Array.isArray(message.messages)) {
                message.messages.forEach((msgItem, idx) => {
                    const delay = idx * 300;
                    voiceTexts.push(msgItem.voice);
                    messagesHtml += `
                        <div class="scene-card" style="animation-delay: ${delay}ms;">
                            <p>${this.escapeHtml(msgItem.action)}</p>
                        </div>
                        <div class="message-bubble" style="animation-delay: ${delay + 150}ms;">
                            <p>${this.escapeHtml(msgItem.voice)}</p>
                        </div>
                    `;
                });
            } else if (message.voice) {
                voiceTexts.push(message.voice);
                messagesHtml = `
                    <div class="scene-card">
                        <p>${this.escapeHtml(message.action)}</p>
                    </div>
                    <div class="message-bubble">
                        <p>${this.escapeHtml(message.voice)}</p>
                    </div>
                `;
            }
            
            messageEl.innerHTML = `
                <div class="message-avatar ${avatarClass}">${avatar}</div>
                <div class="message-content">
                    ${messagesHtml}
                    <p class="message-time">${this.formatTime(message.timestamp)}</p>
                </div>
            `;
            
            if (voiceTexts.length > 0) {
                setTimeout(() => {
                    voiceTexts.forEach((text, i) => {
                        setTimeout(() => {
                            this.speakText(text);
                        }, i * 1500);
                    });
                }, 300);
            }
        }
        
        container.appendChild(messageEl);
    }
    
    async sendMessage(content) {
        if (!content.trim() || !this.currentObjectId || this.isTyping) return;
        
        const userMessage = storage.saveUserMessage(this.currentObjectId, content);
        
        aiService.addToContext(this.currentObjectId, userMessage);
        
        this.renderMessage(userMessage);
        this.scrollToBottom();
        
        this.showTypingIndicator();
        
        try {
            const chatObject = storage.getChatObject(this.currentObjectId);
            const aiResponse = await aiService.sendMessage(chatObject, content);
            
            this.hideTypingIndicator();
            
            const aiMessage = storage.saveAIMessage(this.currentObjectId, [aiResponse]);
            
            aiService.addToContext(this.currentObjectId, aiMessage);
            
            this.renderMessage(aiMessage);
            this.scrollToBottom();
            
        } catch (error) {
            console.error('发送消息失败:', error);
            this.hideTypingIndicator();
            this.showToast('发送消息失败，请重试');
        }
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        const container = document.getElementById('message-container');
        if (!container) return;
        
        const typingEl = document.createElement('div');
        typingEl.className = 'message';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = `
            <div class="message-avatar">?</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        container.appendChild(typingEl);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) {
            typingEl.remove();
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            const container = document.getElementById('message-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateChatHeader() {
        const chatObject = storage.getChatObject(this.currentObjectId);
        if (!chatObject) return;
        
        const nameEl = document.getElementById('chat-name');
        const avatarEl = document.getElementById('chat-avatar');
        const sceneEl = document.getElementById('chat-scene');
        
        if (nameEl) nameEl.textContent = chatObject.name;
        if (avatarEl) {
            avatarEl.textContent = chatObject.name.charAt(0);
            avatarEl.style.background = `linear-gradient(135deg, ${this.getAvatarColor(chatObject.name)})`;
        }
        if (sceneEl) sceneEl.textContent = '场景: 咖啡馆';
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
}

const chatManager = new ChatManager();