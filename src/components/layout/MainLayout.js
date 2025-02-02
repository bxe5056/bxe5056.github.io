import React from "react";
import NavBar from "./NavBar";
import FootBar from "./Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow pt-16">{children}</main>
      <FootBar />
    </div>
  );
};

export default MainLayout;
