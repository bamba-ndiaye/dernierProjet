import { toggleTheme, handleLogout } from '../app.js';
import { 
  fetchConversationById, 
  sendMessage, 
  markMessageAsRead, 
  deleteMessage,
  createConversation,
  updateConversation,
  deleteConversation,
  createStatus,
  markStatusAsViewed,
  fetchStatuses
} from '../api/api.js';
import {
  formatTime,
  formatDate,
  countUnreadMessages,
  getOtherParticipant,
  fileToBase64,
  truncateText,
  getConversationName,
  getConversationAvatar
} from '../utils/helpers.js';

// Global variables to store state
let currentUser = null;
let allContacts = [];
let allConversations = [];
let selectedConversation = null;
let messageUpdateInterval = null;
let contactSearchTerm = '';
let allStatuses = [];

export const renderChatPage = (user, contacts, conversations) => {
  // Set global state
  currentUser = user;
  allContacts = contacts;
  allConversations = conversations;
  
  const appContainer = document.getElementById('app');
  
  // Sort conversations by last updated
  const sortedConversations = [...conversations].sort((a, b) => 
    new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );
  
  // Render main layout
  appContainer.innerHTML = `
    <div class="h-screen flex flex-col">
      <!-- Header -->
      <header class="bg-whatsapp-teal dark:bg-whatsapp-dark text-white py-2 px-4 flex justify-between items-center">
        <h1 class="text-xl font-bold">WhatsApp Clone</h1>
        <div class="flex space-x-4">
          <button id="theme-toggle" class="p-2 rounded-full hover:bg-whatsapp-dark dark:hover:bg-whatsapp-teal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path class="sun hidden dark:block" fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              <path class="moon dark:hidden" fill-rule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clip-rule="evenodd" />
            </svg>
          </button>
          <button id="logout-button" class="p-2 rounded-full hover:bg-whatsapp-dark dark:hover:bg-whatsapp-teal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 2h10v10H4V5zm7 4a1 1 0 10-2 0v2a1 1 0 102 0V9z" clip-rule="evenodd" />
              <path d="M13 7a1 1 0 100 2h3a1 1 0 100-2h-3z" />
            </svg>
          </button>
        </div>
      </header>
      
      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        <div class="w-1/3 border-r border-gray-300 dark:border-gray-700 flex flex-col">
          <!-- Sidebar Header -->
          <div class="p-2 bg-gray-100 dark:bg-gray-800">
            <div class="flex items-center p-2">
              <img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full mr-3">
              <div>
                <h2 class="font-medium text-gray-900 dark:text-white">${user.name}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">${user.phone}</p>
              </div>
            </div>
            
            <!-- Tabs -->
            <div class="flex border-b border-gray-300 dark:border-gray-700 mt-2">
              <div class="sidebar-tab active" data-tab="chats">Chats</div>
              <div class="sidebar-tab" data-tab="status">Status</div>
              <div class="sidebar-tab" data-tab="contacts">Contacts</div>
            </div>
            
            <!-- Search -->
            <div class="mt-2">
              <div class="relative">
                <input type="text" id="search-input" placeholder="Search..." class="w-full bg-white dark:bg-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white">
                <div class="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sidebar Content -->
          <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <!-- Tabs Content -->
            <div id="tab-content" class="h-full">
              <!-- Chats Tab (Default) -->
              <div id="chats-tab" class="h-full">
                <div id="conversations-list">
                  ${renderConversationsList(sortedConversations, contacts, user.id)}
                </div>
                
                <!-- New Chat Button -->
                <div class="fixed bottom-20 right-[calc(66.6%-1rem)] z-10">
                  <button id="new-chat-button" class="bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-full p-3 shadow-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Status Tab (Hidden) -->
              <div id="status-tab" class="h-full hidden">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center">
                    <div class="relative">
                      <img src="${user.avatar}" alt="${user.name}" class="w-12 h-12 rounded-full">
                      <button id="add-status-button" class="absolute bottom-0 right-0 bg-whatsapp-green text-white rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div class="ml-3">
                      <h3 class="font-medium text-gray-900 dark:text-white">My Status</h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">Add a status update</p>
                    </div>
                  </div>
                </div>
                
                <div class="p-2">
                  <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 p-2">Recent updates</h3>
                  <div id="status-list"></div>
                </div>
              </div>
              
              <!-- Contacts Tab (Hidden) -->
              <div id="contacts-tab" class="h-full hidden">
                <div id="contacts-list">
                  ${renderContactsList(contacts, user.id)}
                </div>
                
                <!-- New Contact Button -->
                <div class="fixed bottom-20 right-[calc(66.6%-1rem)] z-10">
                  <button id="new-contact-button" class="bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-full p-3 shadow-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Chat Area -->
        <div id="chat-area" class="w-2/3 flex flex-col bg-gray-100 dark:bg-gray-800">
          <!-- Empty state -->
          <div class="h-full flex items-center justify-center text-center p-6">
            <div>
              <div class="text-whatsapp-teal dark:text-whatsapp-green text-6xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">WhatsApp Web Clone</h2>
              <p class="text-gray-600 dark:text-gray-400 max-w-md">Select a conversation or start a new chat to begin messaging.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Chat Modal (Hidden) -->
    <div id="new-chat-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-full">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">New Chat</h3>
        </div>
        
        <div class="p-4">
          <div class="mb-4">
            <input type="text" id="new-chat-search" placeholder="Search contacts..." class="w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white">
          </div>
          
          <div id="new-chat-contacts-list" class="max-h-64 overflow-y-auto"></div>
          
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Create Group Chat</h4>
            <button id="create-group-chat" class="flex items-center space-x-3 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <div class="bg-whatsapp-green text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-gray-700 dark:text-gray-300">New group</span>
            </button>
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button id="close-new-chat-modal" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <!-- New Contact Modal (Hidden) -->
    <div id="new-contact-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-full">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">New Contact</h3>
        </div>
        
        <div class="p-4">
          <form id="new-contact-form" class="space-y-4">
            <div>
              <label for="contact-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input type="text" id="contact-name" class="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white" required>
            </div>
            
            <div>
              <label for="contact-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input type="tel" id="contact-phone" class="mt-1 block w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white" required>
            </div>
          </form>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
          <button id="close-new-contact-modal" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
          <button id="save-new-contact" class="bg-whatsapp-green hover:bg-whatsapp-teal text-white font-medium py-2 px-4 rounded-md transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create Group Modal (Hidden) -->
    <div id="create-group-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-full">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Create Group</h3>
        </div>
        
        <div class="p-4">
          <div class="mb-4">
            <label for="group-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
            <input type="text" id="group-name" class="w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white" placeholder="Group name" required>
          </div>
          
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Participants</label>
          <div class="mb-2">
            <input type="text" id="group-search" placeholder="Search contacts..." class="w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white">
          </div>
          
          <div id="group-contacts-list" class="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md"></div>
          
          <div id="selected-participants" class="mt-3 flex flex-wrap gap-2"></div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
          <button id="close-create-group-modal" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
          <button id="create-group" class="bg-whatsapp-green hover:bg-whatsapp-teal text-white font-medium py-2 px-4 rounded-md transition-colors">
            Create Group
          </button>
        </div>
      </div>
    </div>
    
    <!-- Add Status Modal (Hidden) -->
    <div id="add-status-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-full">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Add Status</h3>
        </div>
        
        <div class="p-4">
          <div class="mb-4">
            <textarea id="status-text" class="w-full bg-gray-100 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green dark:text-white h-24" placeholder="What's on your mind?"></textarea>
          </div>
          
          <div class="mb-4">
            <label for="status-media" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Image (optional)</label>
            <input type="file" id="status-media" class="w-full text-gray-700 dark:text-gray-300" accept="image/*">
            <div id="status-media-preview" class="mt-2 hidden">
              <img id="status-image-preview" class="max-h-32 rounded" src="" alt="Status preview">
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
          <button id="close-add-status-modal" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
          <button id="save-status" class="bg-whatsapp-green hover:bg-whatsapp-teal text-white font-medium py-2 px-4 rounded-md transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
    
    <!-- View Status Modal (Hidden) -->
    <div id="view-status-modal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
      <div class="w-full max-w-2xl">
        <div class="relative">
          <button id="close-view-status-modal" class="absolute top-2 right-2 text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div id="status-content" class="bg-gray-800 rounded-lg overflow-hidden p-4">
            <div class="flex items-center mb-4">
              <img id="status-user-avatar" src="" alt="" class="w-10 h-10 rounded-full mr-3">
              <div>
                <h3 id="status-user-name" class="font-medium text-white"></h3>
                <p id="status-timestamp" class="text-sm text-gray-400"></p>
              </div>
            </div>
            
            <div id="status-media-container" class="mb-4 hidden">
              <img id="status-media-content" src="" alt="" class="max-w-full max-h-[70vh] mx-auto rounded">
            </div>
            
            <p id="status-text-content" class="text-white text-lg"></p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Set up all the event listeners
  setupEventListeners();
  
  // Set up the message update interval
  messageUpdateInterval = setInterval(updateMessages, 5000);
  
  // Load statuses
  loadStatuses();
};

// Function to render the conversations list
const renderConversationsList = (conversations, contacts, currentUserId) => {
  if (conversations.length === 0) {
    return `
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">
        No conversations yet. Start a new chat!
      </div>
    `;
  }
  
  return conversations
    .map(conversation => {
      const unreadCount = countUnreadMessages(conversation, currentUserId);
      const lastMessage = conversation.messages.length > 0 
        ? conversation.messages[conversation.messages.length - 1] 
        : null;
      
      const conversationName = getConversationName(conversation, contacts, currentUserId);
      const conversationAvatar = getConversationAvatar(conversation, contacts, currentUserId);
      
      let lastMessageText = 'Start a conversation';
      if (lastMessage) {
        if (lastMessage.type === 'image') {
          lastMessageText = '📷 Photo';
        } else if (lastMessage.type === 'file') {
          lastMessageText = '📎 File';
        } else if (lastMessage.type === 'voice') {
          lastMessageText = '🎤 Voice message';
        } else if (lastMessage.type === 'code') {
          lastMessageText = '💻 Code snippet';
        } else {
          lastMessageText = truncateText(lastMessage.text);
        }
        
        // Add sender name for groups
        if (conversation.isGroup && lastMessage.senderId !== currentUserId) {
          const sender = contacts.find(c => c.id === lastMessage.senderId);
          const senderName = sender ? sender.name.split(' ')[0] : 'Unknown';
          lastMessageText = `${senderName}: ${lastMessageText}`;
        }
      }
      
      return `
        <div class="chat-list-item" data-conversation-id="${conversation.id}">
          <div class="relative">
            <img src="${conversationAvatar}" alt="${conversationName}" class="w-12 h-12 rounded-full">
            ${conversation.isGroup ? `
              <span class="absolute bottom-0 right-0 bg-gray-300 dark:bg-gray-600 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </span>
            ` : ''}
          </div>
          <div class="ml-3 flex-1">
            <div class="flex justify-between">
              <h3 class="font-medium text-gray-900 dark:text-white">${conversationName}</h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">${lastMessage ? formatTime(lastMessage.timestamp) : ''}</span>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${lastMessageText}</p>
              ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
};

// Function to render the contacts list
const renderContactsList = (contacts, currentUserId) => {
  const filteredContacts = contacts.filter(contact => contact.id !== currentUserId);
  
  if (filteredContacts.length === 0) {
    return `
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">
        No contacts yet. Add a new contact!
      </div>
    `;
  }
  
  return filteredContacts
    .map(contact => `
      <div class="chat-list-item contact-item" data-contact-id="${contact.id}">
        <img src="${contact.avatar}" alt="${contact.name}" class="w-12 h-12 rounded-full">
        <div class="ml-3 flex-1">
          <div class="flex justify-between">
            <h3 class="font-medium text-gray-900 dark:text-white">${contact.name}</h3>
            <button class="delete-contact-btn text-gray-400 hover:text-red-500" data-contact-id="${contact.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">${contact.status || 'Hey there! I am using WhatsApp'}</p>
        </div>
      </div>
    `)
    .join('');
};

// Function to render the status list
const renderStatusList = (statuses, contacts) => {
  if (statuses.length === 0) {
    return `
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">
        No status updates yet.
      </div>
    `;
  }
  
  // Group statuses by user
  const statusesByUser = statuses.reduce((acc, status) => {
    if (!acc[status.userId]) {
      acc[status.userId] = [];
    }
    acc[status.userId].push(status);
    return acc;
  }, {});
  
  return Object.entries(statusesByUser)
    .map(([userId, userStatuses]) => {
      const user = contacts.find(c => c.id === parseInt(userId));
      if (!user) return '';
      
      const latestStatus = userStatuses.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      const isViewed = latestStatus.viewedBy.includes(currentUser.id);
      
      return `
        <div class="chat-list-item status-item" data-user-id="${userId}">
          <div class="relative">
            <div class="w-12 h-12 rounded-full ${isViewed ? 'border-2 border-gray-300 dark:border-gray-600' : 'border-2 border-whatsapp-green'}">
              <img src="${user.avatar}" alt="${user.name}" class="w-full h-full rounded-full object-cover">
            </div>
          </div>
          <div class="ml-3 flex-1">
            <div class="flex justify-between">
              <h3 class="font-medium text-gray-900 dark:text-white">${user.name}</h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">${formatTime(latestStatus.timestamp)}</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ${latestStatus.type === 'image' ? '📷 Photo' : truncateText(latestStatus.content)}
            </p>
          </div>
        </div>
      `;
    })
    .join('');
};

// Function to render a chat
const renderChat = async (conversation, contacts) => {
  if (!conversation) return;
  
  selectedConversation = conversation;
  
  // Mark unread messages as read
  const unreadMessages = conversation.messages.filter(
    msg => !msg.isRead && msg.senderId !== currentUser.id
  );
  
  for (const message of unreadMessages) {
    await markMessageAsRead(conversation.id, message.id);
    // Update the message in the current conversation object
    message.isRead = true;
  }
  
  // Update the conversations list to reflect read messages
  updateConversationsList();
  
  const chatName = getConversationName(conversation, contacts, currentUser.id);
  const chatAvatar = getConversationAvatar(conversation, contacts, currentUser.id);
  
  // Group messages by date
  const messagesByDate = conversation.messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  let chatHTML = `
    <div class="flex flex-col h-full">
      <!-- Chat Header -->
      <div class="bg-gray-200 dark:bg-gray-800 p-3 flex items-center border-b border-gray-300 dark:border-gray-700">
        <img src="${chatAvatar}" alt="${chatName}" class="w-10 h-10 rounded-full mr-3">
        <div class="flex-1">
          <h2 class="font-medium text-gray-900 dark:text-white">${chatName}</h2>
          ${conversation.isGroup ? 
            `<p class="text-sm text-gray-500 dark:text-gray-400">${conversation.participants.length} participants</p>` : 
            `<p class="text-sm text-gray-500 dark:text-gray-400">last seen ${formatTime(
              contacts.find(c => c.id === conversation.participants.find(id => id !== currentUser.id))?.lastSeen || new Date()
            )}</p>`
          }
        </div>
        ${conversation.isGroup ? `
          <button id="group-info-button" class="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </button>
        ` : ''}
      </div>
      
      <!-- Chat Messages -->
      <div id="messages-container" class="flex-1 overflow-y-auto p-4 bg-[#e5ded8] dark:bg-gray-900">
  `;
  
  // Add messages grouped by date
  Object.entries(messagesByDate).forEach(([date, messages]) => {
    chatHTML += `
      <div class="flex justify-center mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
          ${date}
        </div>
      </div>
    `;
    
    messages.forEach(message => {
      const isSentByMe = message.senderId === currentUser.id;
      const senderName = conversation.isGroup && !isSentByMe ? 
        contacts.find(c => c.id === message.senderId)?.name || 'Unknown' : null;
      
      chatHTML += `
        <div class="message-wrapper ${isSentByMe ? 'flex justify-end' : 'flex justify-start'} mb-4 group">
          <div class="relative max-w-[75%]">
            ${senderName ? `<p class="text-xs text-whatsapp-teal dark:text-whatsapp-green font-medium ml-2 mb-1">${senderName}</p>` : ''}
            <div class="${isSentByMe ? 'chat-bubble-sent' : 'chat-bubble-received'}">
              ${renderMessageContent(message)}
              <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="delete-message-btn p-1 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:text-red-500" data-message-id="${message.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });
  });
  
  chatHTML += `
      </div>
      
      <!-- Chat Input -->
      <div class="bg-gray-200 dark:bg-gray-800 p-3 border-t border-gray-300 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <button id="attach-file-button" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <input type="file" id="file-input" class="hidden" accept="image/*,application/pdf,application/msword,application/vnd.ms-excel">
          <input type="text" id="message-input" class="chat-input" placeholder="Type a message">
          <button id="send-message-button" class="p-2 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-teal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('chat-area').innerHTML = chatHTML;
  
  // Scroll to the bottom of the messages container
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add event listeners for the chat
  setupChatEventListeners(conversation.id);
};

// Function to render message content based on message type
const renderMessageContent = (message) => {
  switch (message.type) {
    case 'image':
      return `<img src="${message.text}" alt="Image" class="max-w-full rounded mb-1">`;
    case 'file':
      return `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
          </svg>
          <a href="${message.text}" target="_blank" class="text-blue-600 dark:text-blue-400 underline">Download file</a>
        </div>
      `;
    case 'voice':
      return `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
          </svg>
          <span>${message.text} voice message</span>
        </div>
      `;
    case 'code':
      return `<pre class="bg-gray-800 text-white p-2 rounded overflow-x-auto text-xs">${message.text}</pre>`;
    default:
      return `<p>${message.text}</p>`;
  }
};

// Set up all event listeners
const setupEventListeners = () => {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Logout button
  document.getElementById('logout-button').addEventListener('click', handleLogout);
  
  // Tabs
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('#tab-content > div').forEach(content => content.classList.add('hidden'));
      
      // Show selected tab content
      const tabId = tab.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    });
  });
  
  // Search input
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    contactSearchTerm = searchInput.value.toLowerCase();
    updateConversationsList();
    document.getElementById('contacts-list').innerHTML = renderContactsList(
      allContacts.filter(contact => 
        contact.id !== currentUser.id && 
        contact.name.toLowerCase().includes(contactSearchTerm)
      ),
      currentUser.id
    );
  });
  
  // Conversation click
  document.getElementById('conversations-list').addEventListener('click', async (e) => {
    const conversationItem = e.target.closest('.chat-list-item');
    if (conversationItem) {
      const conversationId = parseInt(conversationItem.dataset.conversationId);
      const conversation = await fetchConversationById(conversationId);
      renderChat(conversation, allContacts);
      
      // Mark conversation as active
      document.querySelectorAll('.chat-list-item').forEach(item => item.classList.remove('active'));
      conversationItem.classList.add('active');
    }
  });
  
  // Contact click
  document.getElementById('contacts-list').addEventListener('click', async (e) => {
    if (e.target.closest('.delete-contact-btn')) {
      const contactId = parseInt(e.target.closest('.delete-contact-btn').dataset.contactId);
      handleDeleteContact(contactId);
      return;
    }
    
    const contactItem = e.target.closest('.contact-item');
    if (contactItem) {
      const contactId = parseInt(contactItem.dataset.contactId);
      handleStartConversation(contactId);
    }
  });
  
  // New chat button
  document.getElementById('new-chat-button').addEventListener('click', () => {
    const modal = document.getElementById('new-chat-modal');
    modal.classList.remove('hidden');
    
    // Populate contacts list in modal
    const contactsList = document.getElementById('new-chat-contacts-list');
    contactsList.innerHTML = allContacts
      .filter(contact => contact.id !== currentUser.id)
      .map(contact => `
        <div class="chat-list-item new-chat-contact" data-contact-id="${contact.id}">
          <img src="${contact.avatar}" alt="${contact.name}" class="w-10 h-10 rounded-full">
          <div class="ml-3">
            <h3 class="font-medium text-gray-900 dark:text-white">${contact.name}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${contact.status || 'Hey there! I am using WhatsApp'}</p>
          </div>
        </div>
      `)
      .join('');
  });
  
  // Close new chat modal
  document.getElementById('close-new-chat-modal').addEventListener('click', () => {
    document.getElementById('new-chat-modal').classList.add('hidden');
  });
  
  // New chat contact click
  document.getElementById('new-chat-contacts-list').addEventListener('click', (e) => {
    const contactItem = e.target.closest('.new-chat-contact');
    if (contactItem) {
      const contactId = parseInt(contactItem.dataset.contactId);
      document.getElementById('new-chat-modal').classList.add('hidden');
      handleStartConversation(contactId);
    }
  });
  
  // New chat search
  document.getElementById('new-chat-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const contactsList = document.getElementById('new-chat-contacts-list');
    contactsList.innerHTML = allContacts
      .filter(contact => 
        contact.id !== currentUser.id && 
        contact.name.toLowerCase().includes(searchTerm)
      )
      .map(contact => `
        <div class="chat-list-item new-chat-contact" data-contact-id="${contact.id}">
          <img src="${contact.avatar}" alt="${contact.name}" class="w-10 h-10 rounded-full">
          <div class="ml-3">
            <h3 class="font-medium text-gray-900 dark:text-white">${contact.name}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${contact.status || 'Hey there! I am using WhatsApp'}</p>
          </div>
        </div>
      `)
      .join('');
  });
  
  // Create Group Chat
  document.getElementById('create-group-chat').addEventListener('click', () => {
    document.getElementById('new-chat-modal').classList.add('hidden');
    document.getElementById('create-group-modal').classList.remove('hidden');
    
    // Reset group form
    document.getElementById('group-name').value = '';
    document.getElementById('selected-participants').innerHTML = '';
    
    // Populate contacts list in group modal
    const contactsList = document.getElementById('group-contacts-list');
    contactsList.innerHTML = allContacts
      .filter(contact => contact.id !== currentUser.id)
      .map(contact => `
        <div class="p-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700">
          <input type="checkbox" id="contact-${contact.id}" class="group-contact-checkbox mr-2" value="${contact.id}">
          <label for="contact-${contact.id}" class="flex items-center cursor-pointer flex-1">
            <img src="${contact.avatar}" alt="${contact.name}" class="w-8 h-8 rounded-full mr-2">
            <span class="text-gray-800 dark:text-white">${contact.name}</span>
          </label>
        </div>
      `)
      .join('');
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.group-contact-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        updateSelectedParticipants();
      });
    });
  });
  
  // Close create group modal
  document.getElementById('close-create-group-modal').addEventListener('click', () => {
    document.getElementById('create-group-modal').classList.add('hidden');
  });
  
  // Group search
  document.getElementById('group-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const contactsList = document.getElementById('group-contacts-list');
    
    // Keep checked state when filtering
    const checkedContacts = [...document.querySelectorAll('.group-contact-checkbox:checked')].map(cb => parseInt(cb.value));
    
    contactsList.innerHTML = allContacts
      .filter(contact => 
        contact.id !== currentUser.id && 
        contact.name.toLowerCase().includes(searchTerm)
      )
      .map(contact => `
        <div class="p-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700">
          <input type="checkbox" id="contact-${contact.id}" class="group-contact-checkbox mr-2" value="${contact.id}" ${checkedContacts.includes(contact.id) ? 'checked' : ''}>
          <label for="contact-${contact.id}" class="flex items-center cursor-pointer flex-1">
            <img src="${contact.avatar}" alt="${contact.name}" class="w-8 h-8 rounded-full mr-2">
            <span class="text-gray-800 dark:text-white">${contact.name}</span>
          </label>
        </div>
      `)
      .join('');
    
    // Re-add event listeners
    document.querySelectorAll('.group-contact-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        updateSelectedParticipants();
      });
    });
  });
  
  // Create group button
  document.getElementById('create-group').addEventListener('click', async () => {
    const groupName = document.getElementById('group-name').value.trim();
    const selectedContacts = [...document.querySelectorAll('.group-contact-checkbox:checked')].map(cb => parseInt(cb.value));
    
    if (groupName === '') {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }
    
    // Create the group conversation
    try {
      const newConversation = await createConversation({
        name: groupName,
        participants: [currentUser.id, ...selectedContacts],
        admins: [currentUser.id],
        isGroup: true,
        messages: [],
      });
      
      // Add the new conversation to the list
      allConversations.push(newConversation);
      updateConversationsList();
      
      // Close the modal
      document.getElementById('create-group-modal').classList.add('hidden');
      
      // Switch to the new conversation
      renderChat(newConversation, allContacts);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  });
  
  // New contact button
  document.getElementById('new-contact-button').addEventListener('click', () => {
    document.getElementById('new-contact-modal').classList.remove('hidden');
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
  });
  
  // Close new contact modal
  document.getElementById('close-new-contact-modal').addEventListener('click', () => {
    document.getElementById('new-contact-modal').classList.add('hidden');
  });
  
  // Save new contact
  document.getElementById('save-new-contact').addEventListener('click', async () => {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    
    if (name === '' || phone === '') {
      alert('Please fill in all fields');
      return;
    }
    
    if (!/^\d{9,12}$/.test(phone)) {
      alert('Please enter a valid phone number (9-12 digits)');
      return;
    }
    
    try {
      // Check if contact already exists
      const existingContact = allContacts.find(c => c.phone === phone);
      if (existingContact) {
        alert('A contact with this phone number already exists');
        return;
      }
      
      // Create contact
      const newContact = await createUser({
        name,
        phone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=128C7E&color=fff`,
        status: "Hey there! I am using WhatsApp",
        lastSeen: new Date().toISOString()
      });
      
      // Add to contacts list
      allContacts.push(newContact);
      document.getElementById('contacts-list').innerHTML = renderContactsList(
        allContacts.filter(contact => contact.id !== currentUser.id),
        currentUser.id
      );
      
      // Close modal
      document.getElementById('new-contact-modal').classList.add('hidden');
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact. Please try again.');
    }
  });
  
  // Add status button
  document.getElementById('add-status-button').addEventListener('click', () => {
    document.getElementById('add-status-modal').classList.remove('hidden');
    document.getElementById('status-text').value = '';
    document.getElementById('status-media').value = '';
    document.getElementById('status-media-preview').classList.add('hidden');
  });
  
  // Status media preview
  document.getElementById('status-media').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        document.getElementById('status-image-preview').src = base64;
        document.getElementById('status-media-preview').classList.remove('hidden');
      } catch (error) {
        console.error('Error converting image:', error);
      }
    } else {
      document.getElementById('status-media-preview').classList.add('hidden');
    }
  });
  
  // Close add status modal
  document.getElementById('close-add-status-modal').addEventListener('click', () => {
    document.getElementById('add-status-modal').classList.add('hidden');
  });
  
  // Save status
  document.getElementById('save-status').addEventListener('click', async () => {
    const statusText = document.getElementById('status-text').value.trim();
    const statusMedia = document.getElementById('status-media').files[0];
    
    if (!statusText && !statusMedia) {
      alert('Please add text or an image to your status');
      return;
    }
    
    try {
      let mediaUrl = null;
      if (statusMedia && statusMedia.type.startsWith('image/')) {
        mediaUrl = await fileToBase64(statusMedia);
      }
      
      await createStatus({
        userId: currentUser.id,
        content: statusText,
        type: mediaUrl ? 'image' : 'text',
        mediaUrl,
      });
      
      // Close modal
      document.getElementById('add-status-modal').classList.add('hidden');
      
      // Refresh statuses
      loadStatuses();
    } catch (error) {
      console.error('Error creating status:', error);
      alert('Failed to create status. Please try again.');
    }
  });
  
  // Status item click
  document.getElementById('status-list').addEventListener('click', async (e) => {
    const statusItem = e.target.closest('.status-item');
    if (statusItem) {
      const userId = parseInt(statusItem.dataset.userId);
      
      // Get the latest status for this user
      const userStatuses = allStatuses.filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (userStatuses.length > 0) {
        const status = userStatuses[0];
        const user = allContacts.find(c => c.id === userId);
        
        // Mark as viewed
        await markStatusAsViewed(status.id, currentUser.id);
        
        // Show status
        document.getElementById('status-user-avatar').src = user.avatar;
        document.getElementById('status-user-name').textContent = user.name;
        document.getElementById('status-timestamp').textContent = formatTime(status.timestamp);
        document.getElementById('status-text-content').textContent = status.content;
        
        if (status.type === 'image' && status.mediaUrl) {
          document.getElementById('status-media-content').src = status.mediaUrl;
          document.getElementById('status-media-container').classList.remove('hidden');
        } else {
          document.getElementById('status-media-container').classList.add('hidden');
        }
        
        document.getElementById('view-status-modal').classList.remove('hidden');
      }
    }
  });
  
  // Close view status modal
  document.getElementById('close-view-status-modal').addEventListener('click', () => {
    document.getElementById('view-status-modal').classList.add('hidden');
    loadStatuses(); // Refresh to update viewed status
  });
};

// Set up chat-specific event listeners
const setupChatEventListeners = (conversationId) => {
  // Send message
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-message-button');
  
  const sendMessage = async () => {
    const text = messageInput.value.trim();
    if (text === '') return;
    
    try {
      await sendMessageToConversation(conversationId, text);
      messageInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  sendButton.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Attach file
  const attachButton = document.getElementById('attach-file-button');
  const fileInput = document.getElementById('file-input');
  
  attachButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      if (file.type.startsWith('image/')) {
        // Image file
        const base64 = await fileToBase64(file);
        await sendMessageToConversation(conversationId, base64, 'image');
      } else {
        // Other file - in a real app, you'd upload this to a server and get a URL
        // For this demo, we'll just use the filename
        await sendMessageToConversation(conversationId, file.name, 'file');
      }
      
      fileInput.value = '';
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    }
  });
  
  // Delete message
  document.querySelectorAll('.delete-message-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const messageId = parseInt(button.dataset.messageId);
      try {
        await deleteMessage(conversationId, messageId);
        
        // Update the current conversation
        const updatedConversation = await fetchConversationById(conversationId);
        renderChat(updatedConversation, allContacts);
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message. Please try again.');
      }
    });
  });
  
  // Group info button
  const groupInfoButton = document.getElementById('group-info-button');
  if (groupInfoButton) {
    groupInfoButton.addEventListener('click', () => {
      // In a real app, show group info modal
      alert('Group info functionality would be shown here.');
    });
  }
};

// Function to send a message to a conversation
const sendMessageToConversation = async (conversationId, text, type = 'text') => {
  try {
    // Send the message
    await sendMessage(conversationId, {
      senderId: currentUser.id,
      text,
      type,
    });
    
    // Fetch the updated conversation
    const updatedConversation = await fetchConversationById(conversationId);
    
    // Update the global conversations array
    const index = allConversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      allConversations[index] = updatedConversation;
    }
    
    // Render the updated chat
    renderChat(updatedConversation, allContacts);
    
    // Update the conversations list
    updateConversationsList();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Function to start a conversation with a contact
const handleStartConversation = async (contactId) => {
  // Check if conversation already exists
  let conversation = allConversations.find(c => 
    !c.isGroup && 
    c.participants.includes(currentUser.id) && 
    c.participants.includes(contactId)
  );
  
  if (!conversation) {
    // Create a new conversation
    conversation = await createConversation({
      participants: [currentUser.id, contactId],
      isGroup: false,
      messages: [],
    });
    
    // Add to conversations list
    allConversations.push(conversation);
    updateConversationsList();
  }
  
  // Switch to the conversation tab
  document.querySelectorAll('.sidebar-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector('.sidebar-tab[data-tab="chats"]').classList.add('active');
  
  document.querySelectorAll('#tab-content > div').forEach(content => content.classList.add('hidden'));
  document.getElementById('chats-tab').classList.remove('hidden');
  
  // Render the conversation
  renderChat(conversation, allContacts);
};

// Function to delete a contact
const handleDeleteContact = async (contactId) => {
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  try {
    // Delete contact from server
    await deleteUser(contactId);
    
    // Remove from contacts list
    allContacts = allContacts.filter(contact => contact.id !== contactId);
    
    // Update the contacts list
    document.getElementById('contacts-list').innerHTML = renderContactsList(
      allContacts.filter(contact => contact.id !== currentUser.id),
      currentUser.id
    );
    
    // Remove related conversations
    const conversationsToDelete = allConversations.filter(c => 
      !c.isGroup && c.participants.includes(contactId)
    );
    
    for (const conversation of conversationsToDelete) {
      await deleteConversation(conversation.id);
    }
    
    allConversations = allConversations.filter(c => 
      c.isGroup || !c.participants.includes(contactId)
    );
    
    updateConversationsList();
  } catch (error) {
    console.error('Error deleting contact:', error);
    alert('Failed to delete contact. Please try again.');
  }
};

// Update selected participants in the group creation modal
const updateSelectedParticipants = () => {
  const checkedContacts = [...document.querySelectorAll('.group-contact-checkbox:checked')];
  const selectedParticipantsEl = document.getElementById('selected-participants');
  
  selectedParticipantsEl.innerHTML = checkedContacts.map(checkbox => {
    const contactId = parseInt(checkbox.value);
    const contact = allContacts.find(c => c.id === contactId);
    return contact ? `
      <div class="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
        <img src="${contact.avatar}" alt="${contact.name}" class="w-5 h-5 rounded-full mr-1">
        <span class="text-sm text-gray-800 dark:text-white">${contact.name}</span>
      </div>
    ` : '';
  }).join('');
};

// Update conversations list
const updateConversationsList = () => {
  // Sort conversations by last updated
  const sortedConversations = [...allConversations].sort((a, b) => 
    new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );
  
  // Filter by search term if needed
  const filteredConversations = sortedConversations.filter(conversation => {
    if (!contactSearchTerm) return true;
    
    if (conversation.isGroup) {
      return conversation.name.toLowerCase().includes(contactSearchTerm);
    } else {
      const otherParticipantId = conversation.participants.find(id => id !== currentUser.id);
      const otherParticipant = allContacts.find(c => c.id === otherParticipantId);
      return otherParticipant && otherParticipant.name.toLowerCase().includes(contactSearchTerm);
    }
  });
  
  document.getElementById('conversations-list').innerHTML = renderConversationsList(
    filteredConversations,
    allContacts,
    currentUser.id
  );
  
  // If a conversation is selected, mark it as active
  if (selectedConversation) {
    const conversationItem = document.querySelector(`.chat-list-item[data-conversation-id="${selectedConversation.id}"]`);
    if (conversationItem) {
      conversationItem.classList.add('active');
    }
  }
};

// Load and render statuses
const loadStatuses = async () => {
  try {
    allStatuses = await fetchStatuses();
    
    // Filter out expired statuses
    allStatuses = allStatuses.filter(status => 
      new Date(status.expiresAt) > new Date()
    );
    
    document.getElementById('status-list').innerHTML = renderStatusList(allStatuses, allContacts);
  } catch (error) {
    console.error('Error loading statuses:', error);
  }
};

// Update messages periodically
const updateMessages = async () => {
  if (selectedConversation) {
    try {
      const updatedConversation = await fetchConversationById(selectedConversation.id);
      
      // Check if there are new messages
      if (updatedConversation.messages.length > selectedConversation.messages.length) {
        // Update the global conversations array
        const index = allConversations.findIndex(c => c.id === selectedConversation.id);
        if (index !== -1) {
          allConversations[index] = updatedConversation;
        }
        
        // Render the updated chat
        renderChat(updatedConversation, allContacts);
        
        // Update the conversations list
        updateConversationsList();
      }
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  }
};