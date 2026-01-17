"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { fadeInUp, fadeIn } from "./motion-variants";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "none";
  delay?: number;
}

export function FadeIn({
  children,
  className,
  direction = "up",
  delay = 0,
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = direction === "up" ? fadeInUp : fadeIn;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
