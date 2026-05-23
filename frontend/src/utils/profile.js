const key = (userId) => `profile_ext_${userId}`;

export const getExtProfile = (userId) => {
    try {
        return JSON.parse(localStorage.getItem(key(userId))) ||
            { skills: [], education: [], experience: [] };
    } catch {
        return { skills: [], education: [], experience: [] };
    }
};

export const saveExtProfile = (userId, data) => {
    localStorage.setItem(key(userId), JSON.stringify(data));
};
