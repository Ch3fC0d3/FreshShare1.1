// Load header component
async function loadHeader() {
    try {
        const response = await fetch('/header.html');
        const headerHtml = await response.text();
        document.body.insertAdjacentHTML('afterbegin', headerHtml);
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

// Load footer component
async function loadFooter() {
    try {
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) {
            console.error('Footer container not found');
            return;
        }
        const response = await fetch('/footer.html');
        const footerHtml = await response.text();
        footerContainer.innerHTML = footerHtml;
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

// Call loadHeader and loadFooter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
});
