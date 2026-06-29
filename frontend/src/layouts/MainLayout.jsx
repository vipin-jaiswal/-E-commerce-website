import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import BottomNavigation from '../components/layout/BottomNavigation';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-ivory dark:bg-dark-bg">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;