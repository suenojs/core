'use client';
import { cn } from '@/lib/utils';
import { useMotionValue, motion, useMotionTemplate } from 'framer-motion';
import React from 'react';

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <div
      className={cn(
        'relative h-screen flex items-center bg-background/95 justify-center w-full group',
        containerClassName
      )}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0db4f0a_1px,transparent_1px),linear-gradient(to_bottom,#f0db4f0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle, rgba(240, 219, 79, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      <div className={cn('relative z-20', className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{
        backgroundSize: '0% 100%',
      }}
      animate={{
        backgroundSize: '100% 100%',
      }}
      transition={{
        duration: 1.5,
        ease: 'easeOut',
        delay: 0.2,
      }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        'relative inline-block px-1 rounded-lg bg-gradient-to-r from-yellow-400 to-green-500',
        className
      )}
    >
      {children}
    </motion.span>
  );
};
