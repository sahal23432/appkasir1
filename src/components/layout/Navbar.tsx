import React from "react";

interface NavbarProps {
  title?: string;
  userName?: string;
  userRole?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = "Sistem Kasir Cashless RFID",
  userName,
  userRole,
}) => {
  return (
    <header className="w-full border-b bg-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-lg tracking-tight text-gray-900">{title}</span>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {userName && (
          <div className="text-right">
            <p className="font-medium text-gray-800">{userName}</p>
            {userRole && <p className="text-xs text-gray-500">{userRole}</p>}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
