// L'Oréal Beauty Advisor Chatbot - Main JavaScript
// Handles OpenAI API integration, chat UI, conversation history, and advanced features

// ============================================
// CONFIGURATION
// ============================================

// Cloudflare Worker endpoint - UPDATE THIS with your deployed worker URL
const CLOUDFLARE_WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL_HERE';

// System prompt for L'Oréal brand guidance
const SYSTEM_PROMPT = `You are an expert L'Oréal Beauty Advisor AI assistant. Your role is to provide personalized beauty guidance exclusively about L'Oréal products and beauty topics.

CORE RESPONSIBILITIES:
- Answer questions ONLY about L'Oréal products (makeup, skincare, haircare, fragrances)
- Provide personalized product recommendations based on user needs
- Offer beauty tips, routines, and application techniques
- Help users find the right L'Oréal products for their concerns
- Be warm, friendly, professional, and knowledgeable

IMPORTANT RULES:
- ONLY discuss L'Oréal products and beauty topics
- Politely decline questions about competitor brands or unrelated topics
- If asked about non-L'Oréal products, redirect to L'Oréal alternatives
- Never provide medical advice - suggest consulting professionals for skin conditions
- Remember user preferences and context from the conversation
- Be concise but helpful in your responses

BRAND KNOWLEDGE:
L'Oréal product categories include:
- Makeup: Foundations, lipsticks, mascaras, eyeshadows, etc.
- Skincare: Serums, moisturizers, cleansers, anti-aging products
- Haircare: Shampoos, conditioners, treatments, styling products
- Fragrances: Perfumes and colognes

Always maintain L'Oréal's premium brand image while being accessible and helpful.`;

// ============================================
// STATE MANAGEMENT
// ============================================

let currentConversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      timestamp: Date.now(),
      isFavorite: false
};

let allConversations = loadConversations();
let isLoading = false;

// ============================================
// DOM ELEMENTS
// ============================================

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat-button');
const welcomeScreen = document.getElementById('welcome-screen');
const chatHistoryList = document.getElementById('chat-history-list');
const searchInput = document.getElementById('search-input');
const suggestionCards = document.querySelectorAll('.suggestion-card');

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
      initializeApp();
});

sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
      }
});

newChatButton.addEventListener('click', startNewChat);
searchInput.addEventListener('input', handleSearch);

suggestionCards.forEach(card => {
      card.addEventListener('click', () => {
                const question = card.querySelector('p').textContent;
                userInput.value = question;
                handleSendMessage();
      });
});

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
      renderChatHistory();
      checkWorkerConfiguration();

    // Load current conversation if exists
    if (currentConversation.messages.length > 0) {
              hideWelcomeScreen();
              renderMessages();
    }
}

function checkWorkerConfiguration() {
      if (CLOUDFLARE_WORKER_URL === 'YOUR_CLOUDFLARE_WORKER_URL_HERE') {
                console.warn('⚠️ Cloudflare Worker URL not configured. Please update CLOUDFLARE_WORKER_URL in script.js');
      }
}

// ============================================
// MESSAGE HANDLING
// ============================================

async function handleSendMessage() {
      const message = userInput.value.trim();

    if (!message || isLoading) return;

    // Validate Cloudflare Worker configuration
    if (CLOUDFLARE_WORKER_URL === 'YOUR_CLOUDFLARE_WORKER_URL_HERE') {
              showError('Configuration Error: Please set up your Cloudflare Worker URL in script.js');
              return;
    }

    // Hide welcome screen on first message
    if (currentConversation.messages.length === 0) {
              hideWelcomeScreen();
    }

    // Add user message
    addMessage('user', message);
      userInput.value = '';
      adjustTextareaHeight();

    // Update conversation title if first message
    if (currentConversation.messages.length === 1) {
              currentConversation.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }

    // Show loading indicator
    showLoading();

    try {
              // Send to OpenAI via Cloudflare Worker
          const response = await sendToOpenAI(message);

          // Hide loading and add assistant response
          hideLoading();
              addMessage('assistant', response);

          // Save conversation
          saveConversations();
              renderChatHistory();

    } catch (error) {
              hideLoading();
              console.error('Error:', error);
              showError('Sorry, I encountered an error. Please try again.');
    }
}

async function sendToOpenAI(userMessage) {
      // Build conversation history for context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
              ...currentConversation.messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
              }))
          ];

    const requestBody = {
              model: 'gpt-3.5-turbo',
              messages: messages,
              temperature: 0.7,
              max_tokens: 500
    };

    const response = await fetch(CLOUDFLARE_WORKER_URL, {
              method: 'POST',
              headers: {
                            'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
      return data.choices[0].message.content;
}

function addMessage(role, content) {
      const message = {
                role,
                content,
                timestamp: Date.now()
      };

    currentConversation.messages.push(message);
      renderMessage(message);
      scrollToBottom();
}

function renderMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.role}-message`;

    const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = message.content;

    const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = formatTime(message.timestamp);

    messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(timeDiv);
      chatMessages.appendChild(messageDiv);
}

function renderMessages() {
      chatMessages.innerHTML = '';
      currentConversation.messages.forEach(msg => renderMessage(msg));
      scrollToBottom();
}

// ============================================
// LOADING & ERROR HANDLING
// ============================================

function showLoading() {
      isLoading = true;
      sendButton.disabled = true;

    const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message assistant-message loading-message';
      loadingDiv.id = 'loading-indicator';

    const loadingContent = document.createElement('div');
      loadingContent.className = 'message-content';
      loadingContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

    loadingDiv.appendChild(loadingContent);
      chatMessages.appendChild(loadingDiv);
      scrollToBottom();
}

function hideLoading() {
      isLoading = false;
      sendButton.disabled = false;

    const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
                loadingIndicator.remove();
      }
}

function showError(errorMessage) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'message assistant-message error-message';

    const errorContent = document.createElement('div');
      errorContent.className = 'message-content';
      errorContent.textContent = errorMessage;

    errorDiv.appendChild(errorContent);
      chatMessages.appendChild(errorDiv);
      scrollToBottom();
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

function startNewChat() {
      // Save current conversation if it has messages
    if (currentConversation.messages.length > 0) {
              saveCurrentConversation();
    }

    // Create new conversation
    currentConversation = {
              id: generateId(),
              title: 'New Chat',
              messages: [],
              timestamp: Date.now(),
              isFavorite: false
    };

    // Clear chat and show welcome screen
    chatMessages.innerHTML = '';
      welcomeScreen.style.display = 'block';
      userInput.value = '';
      adjustTextareaHeight();

    renderChatHistory();
}

function loadConversation(conversationId) {
      // Save current conversation first
    if (currentConversation.messages.length > 0) {
              saveCurrentConversation();
    }

    // Load selected conversation
    const conversation = allConversations.find(c => c.id === conversationId);
      if (conversation) {
                currentConversation = { ...conversation };
                hideWelcomeScreen();
                renderMessages();
      }
}

function deleteConversation(conversationId, event) {
      event.stopPropagation();

    if (confirm('Are you sure you want to delete this chat?')) {
              allConversations = allConversations.filter(c => c.id !== conversationId);
              saveConversations();
              renderChatHistory();

          // If deleted conversation is current, start new chat
          if (currentConversation.id === conversationId) {
                        startNewChat();
          }
    }
}

function toggleFavorite(conversationId, event) {
      event.stopPropagation();

    const conversation = allConversations.find(c => c.id === conversationId);
      if (conversation) {
                conversation.isFavorite = !conversation.isFavorite;

          // Update current conversation if it's the same
          if (currentConversation.id === conversationId) {
                        currentConversation.isFavorite = conversation.isFavorite;
          }

          saveConversations();
                renderChatHistory();
      }
}

function saveCurrentConversation() {
      const existingIndex = allConversations.findIndex(c => c.id === currentConversation.id);

    if (existingIndex !== -1) {
              allConversations[existingIndex] = { ...currentConversation };
    } else {
              allConversations.unshift({ ...currentConversation });
    }

    saveConversations();
}

function saveConversations() {
      try {
                localStorage.setItem('lorealConversations', JSON.stringify(allConversations));
      } catch (error) {
                console.error('Error saving conversations:', error);
      }
}

function loadConversations() {
      try {
                const saved = localStorage.getItem('lorealConversations');
                return saved ? JSON.parse(saved) : [];
      } catch (error) {
                console.error('Error loading conversations:', error);
                return [];
      }
}

// ============================================
// CHAT HISTORY UI
// ============================================

function renderChatHistory() {
      chatHistoryList.innerHTML = '';

    // Filter conversations based on search
    const searchTerm = searchInput.value.toLowerCase();
      const filtered = allConversations.filter(conv => 
                                                       conv.title.toLowerCase().includes(searchTerm) ||
                conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm))
                                                   );

    // Sort: favorites first, then by timestamp
    const sorted = filtered.sort((a, b) => {
              if (a.isFavorite && !b.isFavorite) return -1;
              if (!a.isFavorite && b.isFavorite) return 1;
              return b.timestamp - a.timestamp;
    });

    if (sorted.length === 0 && searchTerm) {
              const noResults = document.createElement('div');
              noResults.className = 'no-results';
              noResults.textContent = 'No chats found';
              chatHistoryList.appendChild(noResults);
              return;
    }

    sorted.forEach(conversation => {
              const item = document.createElement('div');
              item.className = `chat-history-item ${conversation.id === currentConversation.id ? 'active' : ''}`;
              item.onclick = () => loadConversation(conversation.id);

                           const content = document.createElement('div');
              content.className = 'chat-history-content';

                           const title = document.createElement('div');
              title.className = 'chat-history-title';
              title.textContent = conversation.title;

                           const timestamp = document.createElement('div');
              timestamp.className = 'chat-history-timestamp';
              timestamp.textContent = formatDate(conversation.timestamp);

                           content.appendChild(title);
              content.appendChild(timestamp);

                           const actions = document.createElement('div');
              actions.className = 'chat-history-actions';

                           const favoriteBtn = document.createElement('button');
              favoriteBtn.className = 'icon-button';
              favoriteBtn.innerHTML = conversation.isFavorite ? '⭐' : '☆';
              favoriteBtn.title = conversation.isFavorite ? 'Unfavorite' : 'Favorite';
              favoriteBtn.onclick = (e) => toggleFavorite(conversation.id, e);

                           const deleteBtn = document.createElement('button');
              deleteBtn.className = 'icon-button';
              deleteBtn.innerHTML = '🗑️';
              deleteBtn.title = 'Delete';
              deleteBtn.onclick = (e) => deleteConversation(conversation.id, e);

                           actions.appendChild(favoriteBtn);
              actions.appendChild(deleteBtn);

                           item.appendChild(content);
              item.appendChild(actions);
              chatHistoryList.appendChild(item);
    });
}

function handleSearch() {
      renderChatHistory();
}

// ============================================
// UI HELPERS
// ============================================

function hideWelcomeScreen() {
      welcomeScreen.style.display = 'none';
}

function scrollToBottom() {
      chatMessages.scrollTop = chatMessages.scrollHeight;
}

function adjustTextareaHeight() {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

userInput.addEventListener('input', adjustTextareaHeight);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
                                             hour: '2-digit', 
                minute: '2-digit' 
      });
}

function formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
              return 'Today';
    } else if (diffDays === 1) {
              return 'Yesterday';
    } else if (diffDays < 7) {
              return `${diffDays} days ago`;
    } else {
              return date.toLocaleDateString('en-US', { 
                                                         month: 'short', 
                            day: 'numeric' 
              });
    }
}

// ============================================
// RESPONSIVE SIDEBAR TOGGLE (Mobile)
// ============================================

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');

if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
      });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                              sidebar.classList.remove('active');
                }
      }
});

console.log('✨ L\'Oréal Beauty Advisor initialized successfully!');
