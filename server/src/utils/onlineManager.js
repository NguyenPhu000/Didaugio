// Map luu tru userId -> lastActiveTimestamp
const onlineUsers = new Map();

// Thoi gian het han cho mot session hoat dong (90 giay)
const ONLINE_EXPIRY_MS = 90 * 1000;

export const setOnline = (userId) => {
  if (!userId) return;
  onlineUsers.set(Number(userId), Date.now());
};

export const setOffline = (userId) => {
  if (!userId) return;
  onlineUsers.delete(Number(userId));
};

export const isOnline = (userId) => {
  if (!userId) return false;
  const id = Number(userId);
  const lastActive = onlineUsers.get(id);
  if (!lastActive) return false;

  // Neu qua thoi gian expiry, tu dong xoa va tra ve false (offline)
  if (Date.now() - lastActive > ONLINE_EXPIRY_MS) {
    onlineUsers.delete(id);
    return false;
  }
  return true;
};

export const getOnlineUsers = () => {
  const now = Date.now();
  const activeUsers = [];
  for (const [userId, lastActive] of onlineUsers.entries()) {
    if (now - lastActive <= ONLINE_EXPIRY_MS) {
      activeUsers.push(userId);
    } else {
      onlineUsers.delete(userId);
    }
  }
  return activeUsers;
};
