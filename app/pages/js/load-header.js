// Load header
document.addEventListener('DOMContentLoaded', function() {
    const headerPath = window.location.pathname.startsWith('/pages/') ? '/pages/components/header.html' : '/components/header.html';
    fetch(headerPath)
        .then(response => response.text())
        .then(data => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = data;
            }
        })
        .catch(error => console.error('Error loading header:', error));
});
