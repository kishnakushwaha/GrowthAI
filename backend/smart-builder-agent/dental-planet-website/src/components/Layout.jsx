import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <WhatsAppButton />
            <Footer />
        </div>
    );
};

export default Layout;
