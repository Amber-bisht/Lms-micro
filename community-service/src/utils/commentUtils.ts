const badWords = ['spam', 'scam', 'hate', 'offensive'];

export const filterBadWords = (content: string): string => {
  let filtered = content;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

export const containsURL = (content: string): boolean => {
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  return urlPattern.test(content);
};

export const generateDisplayUsername = (user: any): string => {
  if (!user) return 'Anonymous';
  return user.username || user.email?.split('@')[0] || 'User';
};

