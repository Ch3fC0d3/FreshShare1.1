// Location service for handling geolocation
const locationService = {
    currentPosition: null,

    init: async function() {
        try {
            if (navigator.geolocation) {
                const position = await this.getCurrentPosition();
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                return this.currentPosition;
            } else {
                throw new Error('Geolocation is not supported by this browser.');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    },

    getCurrentPosition: function() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    },

    // Calculate distance between two points in km
    calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    },

    deg2rad: function(deg) {
        return deg * (Math.PI/180);
    }
};
