import { renderLoginPage } from './pages/Login.js';
import { renderChatPage } from './pages/Chat.js';
import { fetchContacts, fetchConversations } from './api/api.js';
import { setThemePreference, getThemePreference } from './utils/helpers.js';

// Apply theme from localStorage
const applyTheme = () => {
  const isDarkMode = getThemePreference();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Render the application based on authentication status
export const renderApp = async (currentUser) => {
  const appContainer = document.getElementById('app');
  
  // Apply theme
  applyTheme();
  
  // Clear the container
  appContainer.innerHTML = '';
  
  if (!currentUser) {
    // User is not logged in, show login page
    renderLoginPage();
  } else {
    // User is logged in, show chat interface
    try {
      // Fetch initial data
      const contacts = await fetchContacts();
      const conversations = await fetchConversations();
      
      // Render chat page
      renderChatPage(currentUser, contacts, conversations);
    } catch (error) {
      console.error('Error loading data:', error);
      appContainer.innerHTML = `
        <div class="h-full flex items-center justify-center">
          <div class="text-center p-8 max-w-md">
            <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
            <p class="mb-6 text-gray-700 dark:text-gray-300">There was a problem loading the application data. Please ensure JSON Server is running.</p>
            <button id="retry-button" class="px-4 py-2 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-teal transition-colors">
              Retry
            </button>
          </div>
        </div>
      `;
      
      document.getElementById('retry-button').addEventListener('click', () => {
        renderApp(currentUser);
      });
    }
  }
};

// Handle theme toggle
export const toggleTheme = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  setThemePreference(!isDarkMode);
  document.documentElement.classList.toggle('dark');
};

// Handle logout
export const handleLogout = () => {
  localStorage.removeItem('currentUser');
  renderApp(null);
};