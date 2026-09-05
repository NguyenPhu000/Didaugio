export const getRoleDisplay = (log) => {
  const role = log?.user?.role;
  if (role?.displayName) return role.displayName;
  if (role?.name) {
    const names = {
      super_admin: "Super Admin",
      admin: "Admin",
      business: "Business",
      staff: "Staff",
      user: "User",
      guest: "Guest",
    };
    return names[role.name] || role.name;
  }
  return "N/A";
};
