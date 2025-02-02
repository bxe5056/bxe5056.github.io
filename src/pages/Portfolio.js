import React from "react";
import PageContainer from "../components/common/PageContainer";
import ProjectCard from "../components/sections/portfolio/ProjectCard";
import ScytheProject from "../components/sections/portfolio/ScytheProject";
import Masonry from "react-masonry-css";
import { projects } from "../utils/projectsData";
import "../styles/masonry.css";

const Portfolio = () => {
  // Separate featured and regular projects
  const featuredProjects = projects.filter(
    (p) => p.title === "Scythe Robotics Mobile App"
  );
  const regularProjects = projects.filter(
    (p) => p.title !== "Scythe Robotics Mobile App"
  );

  const breakpointColumns = {
    default: 3,
    1024: 2,
    640: 1,
  };

  return (
    <PageContainer
      title="Portfolio"
      subtitle="A collection of my projects and research work"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Featured Projects */}
        {featuredProjects.map((project) => (
          <div key={project.title} className="mb-6">
            <ScytheProject {...project} />
          </div>
        ))}

        {/* Regular Projects */}
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {regularProjects.map((project) => (
            <div key={project.title} className="mb-6">
              <ProjectCard {...project} />
            </div>
          ))}
        </Masonry>
      </div>
    </PageContainer>
  );
};

export default Portfolio;
