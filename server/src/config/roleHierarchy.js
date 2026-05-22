/**
 * Re-export from constants.js for backward compatibility.
 * All role hierarchy logic is now centralized in constants.js.
 */
export {
  ROLE_HIERARCHY,
  canManageRole,
  canManageUser,
  getManagedRoles,
  getManagedRoleIds,
} from "./constants.js";
