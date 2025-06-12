import { createUser, fetchUsers } from '../api/api.js';
import { setCurrentUser, isValidName, isValidPhoneNumber } from '../utils/auth.js';
import { renderApp } from '../app.js';

export const renderLoginPage = () => {
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div class="bg-whatsapp-teal dark:bg-whatsapp-dark p-4 text-center">
          <h1 class="text-2xl font-bold text-white">Projet WhatsApp</h1>
          <p class="text-green-100">Connecter avec vos Amis et la famille</p>
        </div>
        
        <div class="p-6">
          <form id="login-form" class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Votre Nom</label>
              <input type="text" id="name" name="name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-whatsapp-green focus:border-whatsapp-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            </div>
            
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Numero de Telephone</label>
              <input type="tel" id="phone" name="phone" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-whatsapp-green focus:border-whatsapp-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Votre numero doit contenir Enter (9-12 chiffres)</p>
            </div>
            
            <div class="pt-2">
              <button type="submit" class="w-full bg-whatsapp-green hover:bg-whatsapp-teal text-white font-bold py-2 px-4 rounded-md transition-colors">
                Log In
              </button>
            </div>
          </form>
          
          <div id="error-message" class="mt-4 text-red-500 text-center hidden"></div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-300">En vous connectant, vous acceptez nos conditions générales et notre politique de confidentialité.</p>
        </div>
      </div>
    </div>
  `;
  
  // Ajouter des écouteurs d'événements
  document.getElementById('login-form').addEventListener('submit', handleLogin);
};

const handleLogin = async (event) => {
  event.preventDefault();
  
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const errorMessageElement = document.getElementById('error-message');
  
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  // Valider les champs
  if (!isValidName(name)) {
    showError(errorMessageElement, 'Please enter a valid name (at least 3 characters)');
    return;
  }
  
  if (!isValidPhoneNumber(phone)) {
    showError(errorMessageElement, 'Please enter a valid phone number (9-12 digits)');
    return;
  }
  
  try {
// Vérifier si l'utilisateur existe
    const users = await fetchUsers();
    let user = users.find(u => u.phone === phone);
    
    if (user) {
// L'utilisateur existe, vérifiez si le nom correspond
      if (user.name !== name) {
        showError(errorMessageElement, 'Phone number already registered with a different name');
        return;
      }
    } else {
// Créer un nouvel utilisateur
      user = await createUser({
        name,
        phone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=128C7E&color=fff`,
        status: "Hey there! I am using WhatsApp",
        lastSeen: new Date().toISOString()
      });
    }
    
// Enregistrer l'utilisateur dans localStorage et rediriger
    setCurrentUser(user);
    renderApp(user);
    
  } catch (error) {
    console.error('Login error:', error);
    showError(errorMessageElement, 'An error occurred. Please try again later.');
  }
};

const showError = (element, message) => {
  element.textContent = message;
  element.classList.remove('hidden');
  
// Masquer l'erreur après 5 secondes
  setTimeout(() => {
    element.classList.add('hidden');
  }, 5000);
};