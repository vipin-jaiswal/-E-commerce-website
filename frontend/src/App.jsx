import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

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
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import AllConcernsPage from './pages/AllConcernsPage';
import Admin from './pages/Admin';
import PhoneAuth from "./components/PhoneAuth";
import FaceScan from './pages/FaceScan';


const AppLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
    <AnnouncementBar />
    <Header />
    <main className="flex-1 pt-20 pb-20">
      <Outlet />
    </main>
    <Footer />
    <BottomNavigation />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/phone-auth" element={<PhoneAuth />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/category/:category" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/concerns" element={<AllConcernsPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/face-scan" element={<FaceScan />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
