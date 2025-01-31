// Load footer
document.addEventListener('DOMContentLoaded', function() {
    const footerPath = window.location.pathname.startsWith('/pages/') ? '/pages/components/footer.html' : '/components/footer.html';
    fetch(footerPath)
        .then(response => response.text())
        .then(data => {
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = data;
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});
