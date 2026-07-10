import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const shellVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },

  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 3,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.2,
    },
  },

  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const columnVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction * 150,
    rotateY: direction * 50,
    scale: 0.9,
  }),

  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: 'spring', // Changed to a spring transition for a bouncier effect
      stiffness: 40,
      damping: 15,
      duration: 2.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },

  exit: (direction) => ({
    opacity: 0,
    x: direction * -150,
    rotateY: direction * -50,
    scale: 0.95,
    transition: {
      duration: 1.5,
      ease: [0.4, 0, 1, 1],
    },
  }),
};

const floatingBlobs = [
  {
    className: 'left-10 top-16 h-20 w-20 bg-white/10',
    delay: 0,
  },
  {
    className: 'right-10 top-24 h-24 w-24 bg-pink-400/20',
    delay: 0.2,
  },
  {
    className: 'left-16 bottom-20 h-16 w-16 bg-white/12',
    delay: 0.35,
  },
  {
    className: 'right-24 bottom-16 h-20 w-20 bg-black/10',
    delay: 0.15,
  },
];

export default function AuthShell({
  panelSide = 'left',
  panelTitle,
  panelCopy,
  panelCtaLabel,
  panelCtaTo,
  children,
}) {
  const reduceMotion = useReducedMotion();

  const panelFirst = panelSide === 'right';

  const contentDirection = panelFirst ? 1 : -1;
  const panelDirection = panelFirst ? -1 : 1;

  const panelRounded = panelFirst
    ? 'lg:rounded-l-[10rem]'
    : 'lg:rounded-r-[10rem]';

  return (
    <motion.div
      className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(217,70,130,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(26,26,46,0.14),_transparent_25%),linear-gradient(180deg,_#faf8f5_0%,_#f2f5fb_100%)]"
      variants={reduceMotion ? undefined : shellVariants}
      initial={reduceMotion ? false : 'initial'}
      animate={reduceMotion ? undefined : 'animate'}
      exit={reduceMotion ? undefined : 'exit'}
    >
      {/* Top Border */}
      <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-black via-pink-500 to-black" />

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-pink-500 via-black to-pink-500" />

      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingBlobs.map((blob, index) => (
          <motion.span
            key={index}
            className={`absolute rounded-full blur-3xl ${blob.className}`}
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 14 + index,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: blob.delay,
                  }
            }
          />
        ))}
      </div>

      <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
        <motion.div
          className="relative h-[92vh] w-[96vw] overflow-hidden rounded-[2rem] bg-white/90 shadow-[0_20px_70px_rgba(26,26,46,0.18)] backdrop-blur-md lg:max-w-7xl"
          style={{ perspective: '1200px' }}
        >
          <div
            className={`flex h-full flex-col lg:flex-row ${
              panelFirst ? '' : 'lg:flex-row-reverse'
            }`}
          >
            {/* Form Section */}
            <motion.section
              className="relative flex h-full flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-12"
              variants={reduceMotion ? undefined : columnVariants}
              custom={contentDirection}
              initial={reduceMotion ? false : 'initial'}
              animate={reduceMotion ? undefined : 'animate'}
              exit={reduceMotion ? undefined : 'exit'}
            >
              <div className="w-full max-w-md">
                {children}
              </div>
            </motion.section>

            {/* Pink Panel */}
            <motion.aside
              className={`relative flex h-full flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-pink-500 via-pink-500 to-pink-400 px-6 py-10 text-white sm:px-10 lg:px-12 ${panelRounded}`}
              variants={reduceMotion ? undefined : columnVariants}
              custom={panelDirection}
              initial={reduceMotion ? false : 'initial'}
              animate={reduceMotion ? undefined : 'animate'}
              exit={reduceMotion ? undefined : 'exit'}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),_transparent_35%)]" />

              <div className="absolute -left-12 top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 right-6 h-44 w-44 rounded-full bg-black/10 blur-3xl" />

              <div className="relative z-10 mx-auto max-w-sm text-center">
                <p className="mb-4 text-[20px] font-bold uppercase tracking-[0.45em] text-white/75 sm:text-[22px]">
                  DYVA
                </p>

                <h2 className="text-[2rem] font-semibold leading-tight sm:text-5xl">
                  {panelTitle}
                </h2>

                <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/85">
                  {panelCopy}
                </p>

                <Link
  to={panelCtaTo}
  className="
    mt-8 inline-flex min-w-40 items-center justify-center
    rounded-full border border-white/50
    bg-white/10
    px-7 py-3
    text-xs font-semibold uppercase tracking-[0.25em]
    text-white
    shadow-[0_8px_24px_rgba(26,26,46,0.18)]
    transition-all
    duration-1000
    ease-[cubic-bezier(0.22,1,0.36,1)]
    hover:-translate-y-1
    hover:bg-white
    hover:text-pink-500
    active:scale-95
  "
>
  {panelCtaLabel}
</Link>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
