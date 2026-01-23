import { Shield, Crown, Briefcase, Users, User } from "lucide-react";

/**
 * ROLE CONSTANTS
 * Centralized constants for role management and display
 */

export const ROLE_ICONS = {
  1: Crown,        // Super Admin
  2: Shield,       // Admin
  3: Briefcase,    // Business Owner
  4: Users,        // Staff
  5: User,         // Guest
};

export const ROLE_COLORS = {
  1: "text-red-600 bg-red-50",       // Super Admin
  2: "text-purple-600 bg-purple-50", // Admin
  3: "text-teal-600 bg-teal-50",     // Business Owner
  4: "text-blue-600 bg-blue-50",     // Staff
  5: "text-gray-600 bg-gray-50",     // Guest
};

export const ROLE_GRADIENTS = {
  1: "from-red-500 to-pink-600",
  2: "from-purple-500 to-indigo-600",
  3: "from-teal-500 to-cyan-600",
  4: "from-blue-500 to-indigo-600",
  5: "from-gray-400 to-gray-600",
};
