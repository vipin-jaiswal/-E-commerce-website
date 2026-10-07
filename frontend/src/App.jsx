import React from 'react';
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

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import ShippingReturns from './pages/ShippingReturns';
import FAQ from './pages/FAQ';
import TrackOrder from './pages/TrackOrder';
import Contact from './pages/Contact';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import AllConcernsPage from './pages/AllConcernsPage';
import Account from './pages/Account';
import { Login, Register } from './pages/AuthPages';
import { ForgotPassword } from './pages/AuthRecovery';
import OrderSuccess from './pages/OrderSuccess';
import OrderDetails from './pages/OrderDetails';

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
  return localStorage.getItem('token')
    ? children
    : <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
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
        </WishlistProvider>
      </CartProvider>
          </ReviewStatsProvider>
          </SearchOverlayProvider>
    </ThemeProvider>
  );
}

export default App;
