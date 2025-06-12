// Get the current user from localStorage
export const getCurrentUser = () => {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
};

// Save a user to localStorage
export const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('currentUser');
};

// Set up event listeners for authentication events
export const setupAuthListeners = () => {
  // Listen for logout events
  document.addEventListener('logout-event', () => {
    logoutUser();
    window.location.reload();
  });
};

// Validate phone number format
export const isValidPhoneNumber = (phone) => {
  return /^\d{9,12}$/.test(phone);
};

// Validate user name
export const isValidName = (name) => {
  return name.length >= 3;
};