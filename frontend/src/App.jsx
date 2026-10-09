import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { ReviewStatsProvider } from './context/ReviewStatsContext';
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

export default App;
