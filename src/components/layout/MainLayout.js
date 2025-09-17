import React from "react";
import { useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import FootBar from "./Footer";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isPresentPage = location.pathname === "/present";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main 
        className="flex-grow pt-16"
        style={isPresentPage ? { backgroundColor: '#1f2937' } : {}}
      >
        {children}
      </main>
      <FootBar />
    </div>
  );
};

export default MainLayout;
