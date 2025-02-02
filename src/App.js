import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Tools from "./pages/Tools";
import TextTools from "./pages/tools/text";
import ColorTools from "./pages/tools/color";
import ImageTools from "./pages/tools/image";
import SvgTools from "./pages/tools/svg";
import DataTools from "./pages/tools/data";
import DevTools from "./pages/tools/dev";
import PDFTools from "./pages/tools/pdf";
import Experience from "./pages/Experience";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import posthog from "./utils/analytics";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    posthog.capture("$pageview");
  }, [location]);

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/about" element={<About />} />
        <Route path="/experience" element={<Experience />} />

        {/* Tools Routes */}
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/text" element={<TextTools />} />
        <Route path="/tools/text/:tool" element={<TextTools />} />
        <Route path="/tools/color" element={<ColorTools />} />
        <Route path="/tools/color/:tool" element={<ColorTools />} />
        <Route path="/tools/image" element={<ImageTools />} />
        <Route path="/tools/image/:tool" element={<ImageTools />} />
        <Route path="/tools/svg" element={<SvgTools />} />
        <Route path="/tools/svg/:tool" element={<SvgTools />} />
        <Route path="/tools/data" element={<DataTools />} />
        <Route path="/tools/data/:tool" element={<DataTools />} />
        <Route path="/tools/dev" element={<DevTools />} />
        <Route path="/tools/dev/:tool" element={<DevTools />} />
        <Route path="/tools/pdf" element={<PDFTools />} />
        <Route path="/tools/pdf/:tool" element={<PDFTools />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
