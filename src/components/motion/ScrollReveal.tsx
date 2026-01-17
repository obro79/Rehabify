"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";
import { sectionFadeIn } from "./motion-variants";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  threshold = 0.2,
  once = true
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: threshold,
    once
  });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={sectionFadeIn}
    >
      {children}
    </motion.div>
  );
}
