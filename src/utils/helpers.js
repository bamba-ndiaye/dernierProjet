// Format a timestamp to a readable time
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format a timestamp to a readable date
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

// Count unread messages in a conversation
export const countUnreadMessages = (conversation, currentUserId) => {
  return conversation.messages.filter(
    message => !message.isRead && message.senderId !== currentUserId
  ).length;
};

// Get user from participants list
export const getUserFromParticipants = (participants, userId) => {
  return participants.find(participant => participant.id === userId);
};

// Get other user in a one-to-one conversation
export const getOtherParticipant = (conversation, currentUserId, contacts) => {
  if (conversation.isGroup) return null;
  
  const otherUserId = conversation.participants.find(id => id !== currentUserId);
  return contacts.find(contact => contact.id === otherUserId);
};

// Get theme preference from localStorage
export const getThemePreference = () => {
  const preference = localStorage.getItem('darkMode');
  return preference === 'true';
};

// Set theme preference in localStorage
export const setThemePreference = (isDarkMode) => {
  localStorage.setItem('darkMode', isDarkMode);
};

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Generate a unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Truncate text to a certain length
export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Get conversation name
export const getConversationName = (conversation, contacts, currentUserId) => {
  if (conversation.isGroup) {
    return conversation.name;
  } else {
    const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
    const otherParticipant = contacts.find(contact => contact.id === otherParticipantId);
    return otherParticipant ? otherParticipant.name : 'Unknown Contact';
  }
};

// Get conversation avatar
export const getConversationAvatar = (conversation, contacts, currentUserId) => {
  if (conversation.isGroup) {
    // Return a generic group avatar
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversation.name) + '&background=128C7E&color=fff';
  } else {
    const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
    const otherParticipant = contacts.find(contact => contact.id === otherParticipantId);
    return otherParticipant ? otherParticipant.avatar : 'https://ui-avatars.com/api/?name=Unknown&background=128C7E&color=fff';
  }
};