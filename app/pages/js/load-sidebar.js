import MessageSidebar from './components/sidebar.js';

// Initialize the sidebar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        const sidebar = new MessageSidebar();
        // Load initial messages
        sidebar.loadMessages();
    }
});
