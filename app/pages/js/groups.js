// Groups service for handling group-related functionality
const groups = {
    async fetchActiveGroups() {
        try {
            const position = locationService.currentPosition;
            if (!position) {
                throw new Error('Location not available');
            }

            const response = await fetch(`${config.apiUrl}${config.endpoints.groups.list}?lat=${position.lat}&lng=${position.lng}`);
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }

            const groups = await response.json();
            this.displayGroups(groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            this.displayError();
        }
    },

    displayGroups(groups) {
        const container = document.getElementById('active-groups');
        if (!container) return;

        if (!groups || groups.length === 0) {
            container.innerHTML = `
                <div class="no-groups">
                    <p>No active groups found in your area.</p>
                    <a href="/create-group" class="btn btn-primary">Create a Group</a>
                </div>
            `;
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="group-card">
                <img src="${group.image || 'assets/images/default-group.jpg'}" alt="${group.name}" class="group-image">
                <div class="group-content">
                    <h3>${group.name}</h3>
                    <p>${group.description}</p>
                    <div class="group-meta">
                        <span class="group-members">
                            <i class="fas fa-users"></i>
                            ${group.memberCount} members
                        </span>
                        <span class="group-distance">
                            ${this.formatDistance(group.distance)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    displayError() {
        const container = document.getElementById('active-groups');
        if (!container) return;

        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load groups. Please try again later.</p>
            </div>
        `;
    },

    formatDistance(distance) {
        if (distance < 1) {
            return 'Less than 1 km';
        }
        return `${Math.round(distance)} km away`;
    }
};
