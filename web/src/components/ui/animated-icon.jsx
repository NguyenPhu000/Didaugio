import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

/**
 * AnimatedIcon Component
 * Wraps a Lucide icon with Framer Motion animations.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - The Lucide icon component (e.g. Home, Settings)
 * @param {string} [props.type='hover'] - Animation type: 'hover', 'rotate', 'pulse', 'tap', 'draw'
 * @param {string} [props.className] - Tailwind classes
 * @param {Object} [props...rest] - Other props passed to the icon
 */
const AnimatedIcon = ({ icon: Icon, type = "hover", className, ...rest }) => {
  if (!Icon) return null;

  // Base transition
  const transition = {
    type: "spring",
    stiffness: 400,
    damping: 17,
  };

  // Define variants based on animation type
  const variants = {
    hover: {
      whileHover: { scale: 1.2 },
      whileTap: { scale: 0.9 },
    },
    rotate: {
      whileHover: { rotate: 45 },
      whileTap: { scale: 0.9 },
      transition: { duration: 0.2 },
    },
    pulse: {
      animate: {
        scale: [1, 1.1, 1],
        opacity: [1, 0.8, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      },
    },
    tap: {
      whileTap: { scale: 0.8 },
      whileHover: { scale: 1.05 },
    },
    draw: {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      transition: { duration: 1.5, ease: "easeInOut" },
    },
    none: {},
  };

  // Select variant group based on type
  const selectedVariant = variants[type] || variants.hover;

  // Render
  // Note: We wrap the Icon in a motion.div to handle the specific framer motions
  // effectively without needing to forwardRef on every Lucide icon if not supported.
  return (
    <MotionDiv
      className={cn("inline-flex items-center justify-center", className)}
      {...selectedVariant}
      transition={selectedVariant.transition || transition}
    >
      <Icon className="w-full h-full" {...rest} />
    </MotionDiv>
  );
};

export default AnimatedIcon;
