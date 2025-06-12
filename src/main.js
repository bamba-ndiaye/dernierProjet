import './style.css';
import { renderApp } from './app.js';
import { getCurrentUser, setupAuthListeners } from './utils/auth.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const currentUser = getCurrentUser();
  
  // Render the app with the appropriate view
  renderApp(currentUser);
  
  // Setup auth-related event listeners
  setupAuthListeners();
});