// Main application logic
const app = {
    init: async function() {
        try {
            // Initialize location service
            if (window.locationService) {
                await locationService.init();
            }

            // Load active groups if the function exists
            if (window.groups && typeof groups.fetchActiveGroups === 'function') {
                await groups.fetchActiveGroups();
            }
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => app.init());
