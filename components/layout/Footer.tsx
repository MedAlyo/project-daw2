import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
        <p>&copy; {currentYear} LocaShop. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;