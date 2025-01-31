// Application configuration
const config = {
    apiUrl: 'http://localhost:3001/api',
    endpoints: {
        auth: {
            signup: '/auth/signup',
            signin: '/auth/signin',
            signout: '/auth/signout'
        },
        groups: {
            list: '/groups',
            create: '/groups/create',
            join: '/groups/join',
            leave: '/groups/leave'
        }
    },
    mapDefaults: {
        zoom: 12,
        maxRadius: 50 // kilometers
    }
};
