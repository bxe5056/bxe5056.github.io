import React, { Suspense, lazy, useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Experience from "./pages/Experience";
import Present from "./pages/Present";
import ToolsSuspenseFallback from "./components/tools/ToolsSuspenseFallback";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import posthog from "./utils/analytics";

const Tools = lazy(() => import("./pages/Tools"));
const TextTools = lazy(() => import("./pages/tools/text"));
const ColorTools = lazy(() => import("./pages/tools/color"));
const ImageTools = lazy(() => import("./pages/tools/image"));
const SvgTools = lazy(() => import("./pages/tools/svg"));
const DataTools = lazy(() => import("./pages/tools/data"));
const DevTools = lazy(() => import("./pages/tools/dev"));
const PDFTools = lazy(() => import("./pages/tools/pdf"));

const ToolsSuspenseLayout = () => (
  <Suspense fallback={<ToolsSuspenseFallback />}>
    <Outlet />
  </Suspense>
);

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
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/present" element={<Present />} />

        {/* Tools Routes - lazy-loaded; one Suspense boundary via layout route */}
        <Route element={<ToolsSuspenseLayout />}>
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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
