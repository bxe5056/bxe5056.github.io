import React from "react";
import { motion } from "framer-motion";
import ExperienceItem from "../components/sections/experience/ExperienceItem";

// Add these category constants at the top of the file
const CATEGORIES = {
  EMPLOYMENT: {
    name: "Employment",
    color: "bg-blue-400",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  COLLEGE: {
    name: "College Activity",
    color: "bg-green-400",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  VOLUNTEER: {
    name: "Volunteer",
    color: "bg-purple-400",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

const Experience = () => {
  const experiences = [
    {
      title: "USA Climbing Volunteer Bouldering Judge",
      company: "USA Climbing",
      date: "October 2024 - Ongoing",
      location: "Central & Northern CO (Region 42)",
      category: CATEGORIES.VOLUNTEER,
      keywords: ["Competition Judging", "Indoor Rock Climbing", "Safety"],
      points: [
        "Certified Level 2 Bouldering Judge responsible for ensuring safety and rule compliance at USA Climbing competitions.",
        "Evaluate climber attempts according to official rules and standards, maintaining competition integrity.",
        "Collaborate with other judges and event staff to facilitate smooth competition operations.",
        "Contribute to the climbing community by supporting youth and adult competitive climbing events.",
      ],
    },
    {
      title: "Lead Front-End Mobile/Web Engineer",
      company: "Scythe Robotics",
      date: "Jan 2023 - Jan 2025",
      location: "Longmont, CO",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "Mobile Development",
        "Web Development",
        "Team Leadership",
        "UX Design",
      ],
      technologies: [
        "Ionic",
        "React",
        "TypeScript",
        "JavaScript",
        "GraphQL",
        "Zustand",
        "GitLab CI/CD",
        "AWS",
        "Docker",
        "Firebase",
        "Push Notifications",
        "Capacitor",
      ],
      points: [
        "Architected and led the development of a cross-platform mobile application using Ionic React, enabling real-time tracking, monitoring, and management of autonomous mowers.",
        "Integrated Zustand for state management, TypeScript, RESTful APIs, GraphQL, and GitLab CI/CD pipelines, enhancing scalability and performance.",
        "Led product strategy and UX design to ensure seamless and intuitive user experiences for landscaping companies.",
        "Scaled the application to support hundreds of autonomous mowers nationwide with real-time synchronization and efficient API communication.",
        "Designed and implemented robust authentication solutions for operators without traditional corporate credentials, improving security and accessibility.",
      ],
    },
    {
      title: "Head of Information Technology",
      company: "Scythe Robotics",
      date: "Sep 2023 - Jan 2025",
      location: "Longmont, CO",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "IT Infrastructure",
        "Process Automation",
        "Cost Optimization",
        "System Administration",
      ],
      technologies: [
        "Python",
        "Bash Scripting",
        "MDM (Mobile Device Management) Solutions",
        "Network Infrastructure",
        "Cloud Services",
        "Ubiquity Unifi",
        "Aruba Instant On",
        "Atlassian",
        "Jira",
        "YoDeck Screen Management",
        "Meeting Room Conferencing Solutions",
        "Tailscale",
        "Google Workspace",
        "GitLab",
      ],
      points: [
        "Oversaw IT infrastructure across multiple office locations and testing facilities, ensuring operational efficiency and reliability.",
        "Automated developer workstation and production line machine setup, reducing provisioning time from 3+ days to a few hours.",
        "Optimized IT expenditures, reducing hardware costs by 66% while upgrading to higher-spec machines.",
        "Implemented network and system upgrades that improved office connectivity, security, and developer productivity.",
      ],
    },
    {
      title: "Software Developer - US Claims",
      company: "Liberty Mutual Insurance",
      date: "Jul 2021 - Jan 2023",
      location: "Boston, MA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "Full Stack Development",
        "Team Mentoring",
        "Employee Onboarding",
        "System Architecture",
        "API Design",
        "CI/CD",
        "AWS",
        "JavaScript",
        "TypeScript",
        "GraphQL",
        "Jenkins",
        "Bamboo",
        "BitBucket",
        "Jira",
        "Confluence",
      ],
      technologies: [
        "React",
        "Node.js",
        "AWS Lambda",
        "GraphQL",
        "RESTful APIs",
      ],
      points: [
        "Developed a customer-facing claims management platform using React, Node.js, and AWS, improving policyholder self-service capabilities.",
        "Onboarded and mentored a newly formed auto claims team, accelerating their contributions through structured technical training and process optimization.",
        "Refactored and modernized legacy back-end services, migrating from monolithic structures to scalable RESTful and GraphQL APIs on AWS Lambda.",
        "Spearheaded CI/CD enhancements, reducing deployment times and increasing engineering efficiency.",
      ],
    },
    {
      title: "Associate Software Developer - US Architecture",
      company: "Liberty Mutual Insurance",
      date: "Feb 2020 - Jul 2021",
      location: "Boston, MA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "Software Patterns",
        "DevOps",
        "Documentation",
        "Best Practices",
        "Automated Migrations",
        "System Architecture",
        "API Design",
        "CI/CD",
        "AWS",
        "Bamboo",
        "BitBucket",
        "Jira",
        "Confluence",
      ],
      technologies: [
        "Node.js",
        "React",
        "Java",
        "AWS Lambda",
        "Docker",
        "Kubernetes",
      ],
      points: [
        "Developed reusable software code patterns adopted by over 1,000 internal developers, establishing best practices for Node.js, React, Java, and AWS Lambda.",
        "Led the design and implementation of an automated migration tool, facilitating Docker Swarm application transitions to Kubernetes.",
        "Standardized coding practices and documentation to improve onboarding speed and maintainability across multiple teams.",
      ],
    },
    {
      title: "TechStart Developer",
      company: "Liberty Mutual Insurance",
      date: "Jun 2019 - Feb 2020",
      location: "Boston, MA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "Web Development",
        "CI/CD",
        "Process Improvement",
        "SMS Integration",
        "Project Management",
      ],
      technologies: [
        "React",
        "Bamboo",
        "SMS Integration",
        "Twilio",
        "AWS",
        "Node.js",
        "Python",
        "Jira",
        "Confluence",
        "BitBucket",
      ],
      points: [
        "Developed a React-based web platform enabling in-field managers to oversee support agents using the SMS Connects platform.",
        "Engineered a Bamboo CI/CD pipeline script that reduced deployment times by 10 minutes per commit, improving efficiency across six development teams.",
      ],
    },
    {
      title: "Software Development Intern",
      company: "Liberty Mutual Insurance",
      date: "May 2018 - Aug 2018",
      location: "Boston, MA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: ["Full Stack Development", "Agile Development"],
      technologies: ["Django", "Python", "Jinja", "AWS", "Bamboo", "BitBucket"],
      points: [
        "Developed a full-stack web application using Django, Jinja, and Python, earning 1st place in a company-wide software innovation challenge.",
        "Expanded a Python-based application to support additional insurance product lines, improving operational efficiency.",
        "Collaborated with cross-functional teams in an Agile environment to enhance software quality and deliverables.",
      ],
    },
    {
      title: "Instructional Aide",
      company: "Penn State College of IST",
      date: "Aug 2018 - Dec 2018",
      location: "University Park, PA",
      category: CATEGORIES.COLLEGE,
      keywords: ["Teaching", "Mentoring", "Programming Concepts"],
      technologies: ["Java", "Object-Oriented Programming"],
      points: [
        "Provided mentorship and academic support to students in an intermediate Java programming course.",
        "Facilitated lab sessions, assisting students in debugging, object-oriented programming, and software architecture concepts.",
      ],
    },
    {
      title: "Resident Assistant - IST Special Living Option",
      company: "Penn State Residence Life",
      date: "Aug 2016 - May 2019",
      location: "University Park, PA",
      category: CATEGORIES.COLLEGE,
      keywords: [
        "Community Leadership",
        "Event Planning",
        "Crisis Management",
        "Student Mentoring",
      ],
      points: [
        "Led a specialized residential community of 62 students passionate about Information Sciences and Technology (IST), fostering collaboration and engagement.",
        "Developed and organized IST-focused events such as hackathons, coding workshops, cybersecurity challenges, and industry networking sessions.",
        "Mentored students in technical projects, resume building, and internship applications, facilitating career development opportunities.",
        "Handled crisis situations in a 440-resident hall, coordinating emergency responses, conflict resolution, and wellness support.",
        "Implemented initiatives to bridge the gap between academic coursework and real-world applications, connecting students with faculty, campus resources, and tech organizations.",
      ],
    },
    {
      title: "Night Auditor & Front Desk Agent",
      company: "Hampton Inn & Suites",
      date: "Jun 2016 - Aug 2017",
      location: "State College, PA",
      category: CATEGORIES.EMPLOYMENT,
      points: [
        "Implemented process improvements that reduced nightly audit times by 20 minutes through scripting and workflow optimizations.",
        "Trained and mentored new hires on hotel management systems, enhancing operational efficiency and customer satisfaction.",
      ],
    },
    {
      title: "IT Officer",
      company: "Penn State 3D Printing Club",
      date: "Aug 2015 - May 2017",
      location: "University Park, PA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: ["3D Printing", "IoT", "Raspberry Pi"],
      technologies: [
        "Network Infrastructure",
        "IoT",
        "Repetier Host",
        "Cura Slicer",
        "OctoPrint",
        "MakerBot",
        "Prusa",
        "Creality",
        "FlashForge",
        "Formlabs",
        "Ultimaker",
      ],
      points: [
        "Designed and deployed the club's first networked 3D printer farm, allowing remote job submission and real-time monitoring.",
        "Implemented a server-based queuing system that optimized print scheduling and increased equipment utilization by 40%.",
        "Integrated IoT-based sensor monitoring for print quality tracking, reducing failed prints and improving operational efficiency.",
        "Managed IT infrastructure, providing technical support for student-led 3D printing projects and research initiatives.",
      ],
    },
    {
      title: "Webmaster",
      company: "Penn State South Halls Residence Association",
      date: "Aug 2015 - May 2016",
      location: "University Park, PA",
      category: CATEGORIES.EMPLOYMENT,
      points: [
        "Developed and maintained the organization's website, ensuring up-to-date information and improved user engagement.",
      ],
    },
    {
      title: "Tech Team Member",
      company: "Penn State Red Cell Analytics Lab",
      date: "Aug 2015 - May 2017",
      location: "University Park, PA",
      category: CATEGORIES.EMPLOYMENT,
      points: [
        "Conducted data-driven security analytics and developed software solutions for intelligence applications.",
      ],
    },
    {
      title: "IT Intern",
      company: "Everett Cash Mutual Insurance Company",
      date: "Jun 2015 - Aug 2015",
      location: "Everett, PA",
      category: CATEGORIES.EMPLOYMENT,
      points: [
        "Performed data verification and assisted in migrating legacy databases from FoxPro to WebDev 20 Analysis.",
        "Provided IT support and assisted in the validation and accuracy of data entry during conversion processes.",
      ],
    },
    {
      title: "Farm Laborer, Sales, and Technology Consultant",
      company: "Brush Creek Evergreens",
      date: "November 2011 - 2017",
      location: "Breezewood, PA",
      category: CATEGORIES.EMPLOYMENT,
      keywords: [
        "Agriculture",
        "Sales Operations",
        "Network Infrastructure",
        "Payment Systems",
      ],
      technologies: [
        "Point-to-Point Wireless",
        "Square POS",
        "Wireless Networks",
      ],
      points: [
        "Worked year-round in farm operations, assisting with planting, trimming, fertilizing, and maintaining Christmas trees to ensure high-quality growth.",
        "Helped onboard and train new employees, teaching best practices for tree care, customer interactions, and sales processes.",
        "Played a key role in seasonal sales operations, assisting with inventory management, customer service, and winter retail logistics.",
        "Identified inefficiencies in the business's payment system and implemented a custom-built point-to-point wireless network, allowing the company to adopt Square for credit card processing—saving thousands annually in transaction fees.",
        "Designed and deployed an outdoor wireless network, extending connectivity to remote retail areas despite infrastructure limitations—an implementation that remains in use over a decade later.",
      ],
    },
  ];

  // Track displayed years to ensure each appears only once
  const displayedYears = new Set();

  // Helper function to get year from date
  const getYear = (date) => {
    const fullYear = date.split(" - ")[0].split(" ")[1] || date.split(" ")[1];
    return `'${fullYear.slice(-2)}`; // Convert to 'YY format
  };

  // Pre-process experiences to find last item of each year
  const lastItemOfYear = experiences.reduce((acc, exp, idx) => {
    const year = getYear(exp.date);
    const nextExp = experiences[idx + 1];
    const nextYear = nextExp ? getYear(nextExp.date) : null;

    if (year !== nextYear) {
      acc[year] = idx;
    }
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-800 mb-12">
        Professional Experience & Community Involvement
      </h1>
      <div className="relative">
        <div className="absolute left-12 top-0 h-full w-1 bg-primary-400"></div>
        <div className="space-y-8 pl-20">
          {experiences.map((experience, index) => {
            const year = getYear(experience.date);
            const showYear = lastItemOfYear[year] === index;

            return (
              <div key={index} className="relative flex flex-col items-start">
                <div className="w-full">
                  <ExperienceItem
                    {...experience}
                    category={experience.category}
                  />
                  {showYear && (
                    <div className="absolute -left-28 top-4 flex items-center">
                      <span className="text-gray-500 text-sm">{year}</span>
                      <div className="w-16 h-1 bg-primary-400 ml-2"></div>
                    </div>
                  )}
                  <div className="absolute -left-4 top-4 w-8 h-8 bg-primary-400 rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Experience;
