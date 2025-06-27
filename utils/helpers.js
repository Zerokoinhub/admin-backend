// utils/helpers.js

module.exports = {
  formatDate(date) {
    return new Date(date).toISOString();
  },

  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `TXN_${timestamp}_${random}`;
  },

  // Add more helper functions as needed
};
