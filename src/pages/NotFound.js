import React from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";
import { FaHome } from "react-icons/fa";

const NotFound = () => {
  return (
    <PageContainer>
      <div className="text-center py-16 max-w-2xl mx-auto">
        <h1 className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 mb-6">
          404
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Oops! The page you're looking for seems to have wandered off.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <FaHome />
          Back to Home
        </Link>
      </div>
    </PageContainer>
  );
};

export default NotFound;
