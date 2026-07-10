import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthShell from '../components/auth/AuthShell';
import EmailAuth from '../components/EmailAuth';

export default function Register() {
  const navigate = useNavigate();

  return (
    <AuthShell
      panelSide="right"
      panelTitle="Hello, Friend!"
      panelCopy="Create an account to discover personalized skincare products and offers."
      panelCtaLabel="Sign In"
      panelCtaTo="/login"
    >
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="text-center">
          <Link to="/" className="font-display text-3xl font-bold tracking-tight text-pink-600 hover:text-pink-400">
            DYVA
          </Link>
          <h1 className="font-display text-3xl font-semibold text-charcoal dark:text-slate-100">
            Create Account
          </h1>
          <p className="text-sm text-muted dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-dark hover:underline text-pink-400 hover:text-pink-300">
              Sign in
            </Link>
          </p>
        </div>

        <EmailAuth mode="register" onSuccess={() => navigate('/')} />

        <p className="px-2 text-center text-xs leading-6 text-muted dark:text-slate-400">
          By registering you agree to our{' '}
          <Link to="#" className="font-medium text-accent text-sm hover:text-accent-dark hover:underline text-pink-400 hover:text-pink-300">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="#" className="font-medium text-sm text-accent hover:text-accent-dark hover:underline text-pink-400 hover:text-pink-300">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </AuthShell>
  );
}
