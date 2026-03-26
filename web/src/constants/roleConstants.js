import { Shield, Crown, Briefcase, Users, User, UserX } from "lucide-react";
import { ROLES } from "./constants";

export const ROLE_ICONS = {
  [ROLES.SUPER_ADMIN]: Crown,
  [ROLES.ADMIN]: Shield,
  [ROLES.BUSINESS]: Briefcase,
  [ROLES.STAFF]: Users,
  [ROLES.USER]: User,
  [ROLES.GUEST]: UserX,
};

export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: "text-red-600 bg-red-50",
  [ROLES.ADMIN]: "text-purple-600 bg-purple-50",
  [ROLES.BUSINESS]: "text-teal-600 bg-teal-50",
  [ROLES.STAFF]: "text-blue-600 bg-blue-50",
  [ROLES.USER]: "text-green-600 bg-green-50",
  [ROLES.GUEST]: "text-gray-600 bg-gray-50",
};

export const ROLE_GRADIENTS = {
  [ROLES.SUPER_ADMIN]: "from-red-500 to-pink-600",
  [ROLES.ADMIN]: "from-purple-500 to-indigo-600",
  [ROLES.BUSINESS]: "from-teal-500 to-cyan-600",
  [ROLES.STAFF]: "from-blue-500 to-indigo-600",
  [ROLES.USER]: "from-green-500 to-emerald-600",
  [ROLES.GUEST]: "from-gray-400 to-gray-600",
};
