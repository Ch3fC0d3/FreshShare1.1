// Load header when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
    const publicPages = ['/login', '/signup', '/about', '/'];
    
    if (!token && !publicPages.some(page => currentPath.includes(page))) {
        window.location.href = '/login';
        return;
    }

    // Load header
    fetch('/components/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading header:', error);
            // Add a basic header if loading fails
            document.getElementById('header-container').innerHTML = `
                <header class="header">
                    <div class="container">
                        <nav class="navbar">
                            <a href="/" class="logo">
                                <i class="fas fa-leaf"></i>
                                FreshShare
                            </a>
                        </nav>
                    </div>
                </header>
            `;
        });

    // Function to toggle mobile menu
    window.toggleMenu = function() {
        const navLinks = document.getElementById('navLinks');
        navLinks.classList.toggle('show');
    };

    // Function to toggle sidebar
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('chat-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    };

    // Function to handle logout
    window.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };
});
