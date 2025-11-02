// L'Oréal Beauty Advisor - Main Application Logic

class LOrealBeautyAdvisor {
    constructor() {
        this.currentChatId = null;
        this.chats = this.loadChats();
        this.isLoading = false;
        
        // DOM Elements
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            menuToggle: document.getElementById('menuToggle'),
            newChatBtn: document.getElementById('newChatBtn'),
            searchInput: document.getElementById('searchInput'),
            chatHistory: document.getElementById('chatHistory'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderChatHistory();
        this.adjustTextareaHeight();
        
        // Load the most recent chat if exists
        if (this.chats.length > 0) {
            const mostRecentChat = this.chats[0];
            this.loadChat(mostRecentChat.id);
        }
    }
    
    setupEventListeners() {
        // Menu toggle for mobile
        this.elements.menuToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // New chat button
        this.elements.newChatBtn.addEventListener('click', () => {
            this.startNewChat();
        });
        
        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchChats(e.target.value);
        });
        
        // Message input
        this.elements.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.updateSendButtonState();
        });
        
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Send button
        this.elements.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Example prompts
        const examplePrompts = document.querySelectorAll('.example-prompt');
        examplePrompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                const promptText = prompt.getAttribute('data-prompt');
                this.elements.messageInput.value = promptText;
                this.updateSendButtonState();
                this.elements.messageInput.focus();
            });
        });
        
        // Close sidebar on overlay click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.elements.sidebar.contains(e.target) && 
                    !this.elements.menuToggle.contains(e.target) &&
                    this.elements.sidebar.classList.contains('open')) {
                    this.toggleSidebar();
                }
            }
        });
    }
    
    toggleSidebar() {
        this.elements.sidebar.classList.toggle('open');
        
        // Add/remove overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.toggle('active');
        
        overlay.addEventListener('click', () => {
            this.toggleSidebar();
        });
    }
    
    adjustTextareaHeight() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    updateSendButtonState() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendButton.disabled = !hasText || this.isLoading;
    }
    
    startNewChat() {
        this.currentChatId = null;
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.messagesContainer.classList.remove('active');
        this.elements.messagesContainer.innerHTML = '';
        this.elements.messageInput.value = '';
        this.updateSendButtonState();
        
        // Remove active state from all chat history items
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }
    }
    
    async sendMessage() {
        const messageText = this.elements.messageInput.value.trim();
        if (!messageText || this.isLoading) return;
        
        this.isLoading = true;
        this.updateSendButtonState();
        
        // Hide welcome screen and show messages
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.messagesContainer.classList.add('active');
        
        // Create or get current chat
        if (!this.currentChatId) {
            this.currentChatId = this.createNewChat(messageText);
        }
        
        // Add user message
        this.addMessage('user', messageText);
        
        // Clear input
        this.elements.messageInput.value = '';
        this.adjustTextareaHeight();
        
        // Add loading indicator
        const loadingMessageId = this.addLoadingMessage();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(messageText);
            
            // Remove loading indicator
            this.removeLoadingMessage(loadingMessageId);
            
            // Add assistant message
            this.addMessage('assistant', response);
            
            // Update chat in storage
            this.updateChat(this.currentChatId, messageText, response);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.removeLoadingMessage(loadingMessageId);
            this.addErrorMessage('Sorry, I encountered an error. Please try again or check your API configuration.');
        }
        
        this.isLoading = false;
        this.updateSendButtonState();
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? 'You' : 'LA';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const sender = document.createElement('span');
        sender.className = 'message-sender';
        sender.textContent = role === 'user' ? 'You' : "L'Oréal Advisor";
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.formatTime(new Date());
        
        header.appendChild(sender);
        header.appendChild(time);
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = content;
        
        contentDiv.appendChild(header);
        contentDiv.appendChild(bubble);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant loading';
        messageDiv.id = 'loading-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'LA';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            typingIndicator.appendChild(dot);
        }
        
        bubble.appendChild(typingIndicator);
        contentDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return 'loading-message';
    }
    
    removeLoadingMessage(messageId) {
        const loadingMessage = document.getElementById(messageId);
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
    
    addErrorMessage(errorText) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${errorText}</span>
        `;
        this.elements.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
    }
    
    async getAIResponse(userMessage) {
        // Get the conversation history for context
        const messages = this.getCurrentChatMessages();
        
        // Call the Cloudflare Worker API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                userMessage: userMessage
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }
        
        const data = await response.json();
        return data.message;
    }
    
    getCurrentChatMessages() {
        const messages = [];
        const messageElements = this.elements.messagesContainer.querySelectorAll('.message:not(.loading)');
        
        messageElements.forEach(element => {
            const role = element.classList.contains('user') ? 'user' : 'assistant';
            const content = element.querySelector('.message-bubble').textContent;
            messages.push({ role, content });
        });
        
        return messages;
    }
    
    createNewChat(firstMessage) {
        const chat = {
            id: Date.now().toString(),
            title: this.generateChatTitle(firstMessage),
            preview: firstMessage,
            messages: [],
            timestamp: new Date().toISOString(),
            favorite: false
        };
        
        this.chats.unshift(chat);
        this.saveChats();
        this.renderChatHistory();
        
        return chat.id;
    }
    
    generateChatTitle(message) {
        // Generate a short title from the first message
        const words = message.split(' ').slice(0, 6);
        return words.join(' ') + (message.split(' ').length > 6 ? '...' : '');
    }
    
    updateChat(chatId, userMessage, assistantMessage) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages.push(
                { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
                { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
            );
            chat.preview = userMessage;
            chat.timestamp = new Date().toISOString();
            
            // Move to top of list
            this.chats = [chat, ...this.chats.filter(c => c.id !== chatId)];
            
            this.saveChats();
            this.renderChatHistory();
        }
    }
    
    loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.messagesContainer.classList.add('active');
        this.elements.messagesContainer.innerHTML = '';
        
        // Load all messages
        chat.messages.forEach(msg => {
            this.addMessage(msg.role, msg.content);
        });
        
        // Update active state
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === chatId) {
                item.classList.add('active');
            }
        });
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }
    }
    
    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            this.chats = this.chats.filter(c => c.id !== chatId);
            this.saveChats();
            this.renderChatHistory();
            
            if (this.currentChatId === chatId) {
                this.startNewChat();
            }
        }
    }
    
    toggleFavorite(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.favorite = !chat.favorite;
            this.saveChats();
            this.renderChatHistory();
        }
    }
    
    renderChatHistory(filteredChats = null) {
        const chatsToRender = filteredChats || this.chats;
        this.elements.chatHistory.innerHTML = '';
        
        if (chatsToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'padding: 20px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;';
            emptyMessage.textContent = filteredChats ? 'No chats found' : 'No chat history yet';
            this.elements.chatHistory.appendChild(emptyMessage);
            return;
        }
        
        chatsToRender.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            if (chat.id === this.currentChatId) {
                chatItem.classList.add('active');
            }
            chatItem.dataset.chatId = chat.id;
            
            chatItem.innerHTML = `
                <svg class="chat-history-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <div class="chat-history-item-content">
                    <div class="chat-history-item-title">${this.escapeHtml(chat.title)}</div>
                    <div class="chat-history-item-preview">${this.escapeHtml(chat.preview)}</div>
                </div>
                <div class="chat-history-item-actions">
                    <button class="chat-action-btn favorite ${chat.favorite ? 'active' : ''}" data-action="favorite">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${chat.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                    <button class="chat-action-btn" data-action="delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            // Click to load chat
            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-action-btn')) {
                    this.loadChat(chat.id);
                }
            });
            
            // Action buttons
            const favoriteBtn = chatItem.querySelector('[data-action="favorite"]');
            const deleteBtn = chatItem.querySelector('[data-action="delete"]');
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(chat.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChat(chat.id);
            });
            
            this.elements.chatHistory.appendChild(chatItem);
        });
    }
    
    searchChats(query) {
        if (!query.trim()) {
            this.renderChatHistory();
            return;
        }
        
        const filtered = this.chats.filter(chat => {
            const searchText = query.toLowerCase();
            return chat.title.toLowerCase().includes(searchText) ||
                   chat.preview.toLowerCase().includes(searchText) ||
                   chat.messages.some(msg => msg.content.toLowerCase().includes(searchText));
        });
        
        this.renderChatHistory(filtered);
    }
    
    saveChats() {
        try {
            localStorage.setItem('loreal_chats', JSON.stringify(this.chats));
        } catch (error) {
            console.error('Error saving chats:', error);
        }
    }
    
    loadChats() {
        try {
            const saved = localStorage.getItem('loreal_chats');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading chats:', error);
            return [];
        }
    }
    
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }
    
    formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LOrealBeautyAdvisor();
});
