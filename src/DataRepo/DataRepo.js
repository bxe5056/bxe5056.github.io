import React from "react";
import { Container } from "react-bootstrap";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import dataItemList from "./DataItemList";

const ProjectCard = ({ title, subtitle, href }) => {
  return (
    <div className="lg:w-1/3 md:w-1/2 w-full p-4">
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className="p-6">
          <div className="h-2 w-20 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full mb-4"></div>
          <h3 className="text-xl font-bold font-montserrat text-gray-800 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            {href && (
              <a
                href={href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-primary-600 hover:bg-primary-50 transition-colors duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaExternalLinkAlt className="text-sm" />
                <span>View Project</span>
              </a>
            )}
            <a
              href="https://github.com/bxe5056"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-primary-600 hover:bg-primary-50 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="text-sm" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataRepo = () => {
  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-montserrat text-gray-900 mb-4">
            Portfolio
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A collection of my academic and personal projects
          </p>
        </div>
        <div className="flex flex-wrap -m-4">
          {dataItemList.map((item, index) => (
            <ProjectCard
              key={index}
              href={item[0]}
              title={item[1]}
              subtitle={item[2]}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default DataRepo;
