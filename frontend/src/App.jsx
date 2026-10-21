import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { ReviewStatsProvider } from './context/ReviewStatsContext';
import ReviewSection from './components/review/ReviewSection';
import { SearchOverlayProvider } from './context/SearchOverlayContext';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AnnouncementBar from './components/layout/AnnouncementBar';
import BottomNavigation from './components/layout/BottomNavigation';

import api from './services/api';

// Load page code only when its route is visited.
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ShippingReturns = lazy(() => import('./pages/ShippingReturns'));
const FAQ = lazy(() => import('./pages/FAQ'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const AllConcernsPage = lazy(() => import('./pages/AllConcernsPage'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/AuthRecovery').then((module) => ({ default: module.ForgotPassword })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));

const LoginInvitation = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  useEffect(() => {
    if (isAuthPage || localStorage.getItem('token')) {
      setVisible(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setVisible(true), 7000);
    return () => window.clearTimeout(timer);
  }, [isAuthPage, location.pathname]);

  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (isAuthPage || !visible || localStorage.getItem('token')) return null;
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 md:items-end md:p-0" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVisible(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="login-invitation-title" className="relative flex h-[75vh] w-full flex-col justify-center rounded-3xl border border-gray-200 bg-white/40 p-8 text-center shadow-md backdrop-blur-xl dark:border-[#2A2A2A]/70 dark:bg-black/20 md:h-[85vh] md:w-full md:rounded-t-3xl md:rounded-b-none md:border-b-0 md:px-16 lg:px-24">
        <button type="button" onClick={() => setVisible(false)} aria-label="Close login invitation" className="absolute right-4 top-4 rounded-full p-2 text-black hover:bg-gray-100 dark:hover:bg-white/10">✕</button>
        <p className="text-2xl font-semibold  uppercase tracking-[0.2em] text-pink-600">Welcome to DYVA</p>
        <h2 id="login-invitation-title" className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Sign in for a more personal shopping experience</h2>
        <p className="mt-6 text-sm leading-7 text-gray-600 dark:text-gray-300 md:mx-auto md:max-w-3xl md:text-base md:leading-8">Sign in to keep track of your orders, manage your account, and pick up where you left off. Create a wishlist, save your details for faster checkout, and discover products selected for your routine.</p>
        <div className="mt-8 hidden gap-4 text-left md:mx-auto md:grid md:w-full md:max-w-5xl md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-gray-200/70 bg-white/25 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-semibold text-gray-900 dark:text-white">Your orders, all in one place</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Check your order details and keep up with delivery updates.</p></div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/25 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-semibold text-gray-900 dark:text-white">A routine picked for you</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Save products you love and return to your wishlist anytime.</p></div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/25 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-semibold text-gray-900 dark:text-white">A smoother checkout</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Keep your account details handy to make your next order easier.</p></div>
        </div>
        <a href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mx-auto mt-8 block w-fit rounded-xl bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-500">Go to login</a>
        <button type="button" onClick={() => setVisible(false)} className="mt-3 min-h-11 w-full text-sm font-medium text-gray-600 underline underline-offset-4 dark:text-gray-300">Continue browsing</button>
      </section>
    </div>
  );
};

const PageLoading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500" role="status">
    Loading page...
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const AppLayout = () => (
  <div className="flex flex-col min-h-screen bg-white text-[#171717] dark:bg-[#090909] dark:text-white">
    <AnnouncementBar />
    <Header />
    <main className="flex-1 pt-4 pb-1 sm:pt-20 sm:pb-5">
      <Outlet />
    </main>
    <Footer />
    <BottomNavigation />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [validatedToken, setValidatedToken] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    api.get('/auth/me')
      .then(({ data }) => {
        if (active && data?.data?.customer) setValidatedToken(token);
      })
      .catch((error) => {
        // Keep a saved session during network/server outages; the API interceptor
        // clears and redirects when the backend explicitly rejects the JWT.
        if (active && error.response?.status !== 401 && localStorage.getItem('token') === token) {
          setValidatedToken(token);
        }
      });
    return () => { active = false; };
  }, [token]);

  if (!token) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  if (validatedToken !== token) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">Checking your session...</div>;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <SearchOverlayProvider>
      <ReviewStatsProvider>
      <CartProvider>
        <WishlistProvider>
          <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />
          <ScrollToTop />
          <LoginInvitation />
          <ProductReviewModalHost />
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/category/:category" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/order-details" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/shipping-returns" element={<ShippingReturns />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/concerns" element={<AllConcernsPage />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/address" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/payment" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            </Route>
          </Routes>
          </Suspense>
        </WishlistProvider>
      </CartProvider>
          </ReviewStatsProvider>
          </SearchOverlayProvider>
    </ThemeProvider>
  );
}

function ProductReviewModalHost() {
  const [request, setRequest] = React.useState(null);

  React.useEffect(() => {
    const openReview = (event) => {
      const productHandle = event.detail?.productHandle;
      if (productHandle) setRequest((current) => ({ productHandle, key: (current?.key || 0) + 1 }));
    };
    window.addEventListener('dyva:open-review', openReview);
    return () => window.removeEventListener('dyva:open-review', openReview);
  }, []);

  if (!request) return null;
  return <ReviewSection key={request.key} productHandle={request.productHandle} autoOpen modalOnly />;
}

export default App;
