const key = (userId) => `bookmarks_${userId}`;

export const getBookmarks = (userId) => {
    try { return JSON.parse(localStorage.getItem(key(userId))) || []; }
    catch { return []; }
};

export const isBookmarked = (userId, jobId) => getBookmarks(userId).includes(jobId);

export const toggleBookmark = (userId, jobId) => {
    const current = getBookmarks(userId);
    const updated = current.includes(jobId)
        ? current.filter(id => id !== jobId)
        : [...current, jobId];
    localStorage.setItem(key(userId), JSON.stringify(updated));
    return updated;
};
