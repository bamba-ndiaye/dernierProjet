// Base URL for the JSON Server API
const BASE_URL = 'http://localhost:3002';

// Generic fetch function with error handling
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

// User-related API calls
export const fetchUsers = async () => {
  return await fetchAPI('/users');
};

export const fetchUserById = async (userId) => {
  return await fetchAPI(`/users/${userId}`);
};

export const createUser = async (userData) => {
  return await fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (userId, userData) => {
  return await fetchAPI(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (userId) => {
  return await fetchAPI(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// Conversation-related API calls
export const fetchConversations = async () => {
  return await fetchAPI('/conversations');
};

export const fetchConversationById = async (conversationId) => {
  return await fetchAPI(`/conversations/${conversationId}`);
};

export const createConversation = async (conversationData) => {
  return await fetchAPI('/conversations', {
    method: 'POST',
    body: JSON.stringify({
      ...conversationData,
      messages: conversationData.messages || [],
      lastUpdated: new Date().toISOString(),
    }),
  });
};

export const updateConversation = async (conversationId, conversationData) => {
  return await fetchAPI(`/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...conversationData,
      lastUpdated: new Date().toISOString(),
    }),
  });
};

export const deleteConversation = async (conversationId) => {
  return await fetchAPI(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
};

// Message-related API calls
export const sendMessage = async (conversationId, messageData) => {
  const conversation = await fetchConversationById(conversationId);
  
  const newMessage = {
    id: conversation.messages.length > 0 
      ? Math.max(...conversation.messages.map(m => m.id)) + 1 
      : 1,
    ...messageData,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  
  const updatedMessages = [...conversation.messages, newMessage];
  
  await updateConversation(conversationId, {
    messages: updatedMessages,
  });
  
  return newMessage;
};

export const markMessageAsRead = async (conversationId, messageId) => {
  const conversation = await fetchConversationById(conversationId);
  
  const updatedMessages = conversation.messages.map(message => 
    message.id === messageId ? { ...message, isRead: true } : message
  );
  
  await updateConversation(conversationId, {
    messages: updatedMessages,
  });
};

export const deleteMessage = async (conversationId, messageId) => {
  const conversation = await fetchConversationById(conversationId);
  
  const updatedMessages = conversation.messages.filter(message => message.id !== messageId);
  
  await updateConversation(conversationId, {
    messages: updatedMessages,
  });
};

// Alias function for better semantics when fetching contacts
export const fetchContacts = fetchUsers;

// Status-related API calls
export const fetchStatuses = async () => {
  return await fetchAPI('/status');
};

export const createStatus = async (statusData) => {
  // Set expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  return await fetchAPI('/status', {
    method: 'POST',
    body: JSON.stringify({
      ...statusData,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      viewedBy: [],
    }),
  });
};

export const markStatusAsViewed = async (statusId, userId) => {
  const status = await fetchAPI(`/status/${statusId}`);
  
  if (!status.viewedBy.includes(userId)) {
    const updatedViewedBy = [...status.viewedBy, userId];
    
    await fetchAPI(`/status/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        viewedBy: updatedViewedBy,
      }),
    });
  }
};