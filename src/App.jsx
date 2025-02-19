import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  FaGithub,
  FaFacebook,
  FaLinkedin,
  FaHtml5,
  FaCss3Alt,
  FaJs,
  FaPhp,
  FaBootstrap,
  FaReact,
  FaAngular,
  FaGitAlt,
} from "react-icons/fa";

import {
  SiTailwindcss,
  SiExpress,
  SiMysql,
  SiMongodb,
  SiPostman,
  SiTypescript,
} from "react-icons/si";
import {
  FileText,
  Mail,
  MapPin,
  ArrowRight,
  User,
  Briefcase,
  FolderOpen,
  FolderGit,
  Link2,
  Code,
} from "lucide-react";
import { motion } from "framer-motion";

import profile from "./assets/profile.png";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

function App() {
  return (
    <>
      <ThemeProvider>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            scale: { type: "spring", visualDuration: 0.6, bounce: 0.6 },
          }}
        >
          <div className="min-w-xl max-w-4xl mx-auto px-4 py-8 font-geist">
            <div className="grid sm:grid-cols-3 grid-cols-1 p-2">
              <div className=" rounded-lg sm:w-60 sm:h-60 border-2">
                <img
                  src={profile}
                  alt="profile"
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="w-full py-8">
                <div className="flex items-center justify-between">
                  <h1 className="sm:text-3xl text-2xl font-bold">
                    Jhon Lay Lopez
                  </h1>
                  <div className="block sm:hidden">
                    <ThemeSwitcher />
                  </div>
                </div>
                <p className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Pasay, Philippines
                </p>
                <p className="text-lg mt-2">Aspiring Software Engineer</p>
                <div className="flex gap-2 mt-4">
                  <Button asChild>
                    <a href="mailto:jhonlaylopez.2003@gmail.com">
                      <Mail />
                      Send Email
                      <ArrowRight />
                    </a>
                  </Button>
                  <Button asChild>
                    <a href="/resume.pdf" download="Lopez_Jhon_Lay.pdf">
                      <FileText />
                      Download CV
                    </a>
                  </Button>
                </div>
              </div>
              <div className="py-6 items-start justify-end sm:flex hidden">
                <ThemeSwitcher />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid sm:grid-cols-12 grid-cols-1 gap-2">
              <div className="sm:col-span-8">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex gap-2">
                      <User />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-justify">
                      I’m a 4th-year IT student passionate about software
                      development, particularly in web technologies and
                      artificial intelligence.
                      <br />
                      <br />
                      With hands-on experience in React, Angular, JavaScript and
                      TypeScript, I enjoy building real-world applications that
                      solve practical problems.
                      <br />
                      <br />
                      Currently, I’m expanding my skills in DevOps and AI to
                      stay ahead in the evolving tech landscape. I’ve worked on
                      full-stack web app projects, and I continuously seek
                      opportunities to enhance my problem-solving abilities.
                      <br />
                      <br />I am actively seeking an internship where I can
                      apply my technical skills, learn from industry
                      professionals, and gain hands-on experience in a
                      collaborative environment. My goal is to transition into a
                      software engineering role after graduation, contributing
                      to innovative projects and growing as a developer.
                      <br />
                      <br />
                      Let’s connect!🚀
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="sm:col-span-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex gap-2">
                      <Briefcase />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Web Development Cadet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Google Developer Groups on Campus - PUP
                      </p>
                      <div className="flex justify-between">
                        <p className="text-sm text-muted-foreground">
                          PUP-Manila
                        </p>
                        <Badge variant="outline">2025</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Project Manager
                      </p>
                      <p className="text-sm text-muted-foreground">
                        App Development Project
                      </p>
                      <div className="flex justify-between">
                        <p className="text-sm text-muted-foreground">
                          PUP-Taguig
                        </p>
                        <Badge variant="outline">2024</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Technical Lead
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Web Development Project
                      </p>
                      <div className="flex justify-between">
                        <p className="text-sm text-muted-foreground">
                          PUP-Taguig
                        </p>
                        <Badge variant="outline">2023</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        BS in Information Technology
                      </p>
                      <div className="flex justify-between">
                        <p className="text-sm text-muted-foreground">
                          PUP-Taguig
                        </p>
                        <Badge variant="outline">2021</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Hello World
                      </p>
                      <div className="flex justify-between">
                        <p className="text-sm text-muted-foreground">
                          Wrote my first line of code
                        </p>
                        <Badge variant="outline">2018</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="sm:col-span-12">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex gap-2">
                    <FolderOpen />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 grid-cols-1 gap-2">
                    <motion.div
                      whileHover={{
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex gap-2">
                            Barangay Information System
                          </CardTitle>
                          <CardDescription>Capstone</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Integrated Solutions for Brgy Central Bicutan Taguig
                        </CardContent>
                        <CardFooter>
                          <FolderGit />
                          <Button asChild variant="link">
                            <Link to="https://github.com/PUPT-2025-CAPRO-BIS">
                              View Repository
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                    <motion.div
                      whileHover={{
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex gap-2">
                            PUPConnect
                          </CardTitle>
                          <CardDescription>App Development</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Job Listing / Job Hunting App for PUP Students
                        </CardContent>
                        <CardFooter>
                          <FolderGit />
                          <Button asChild variant="link">
                            <Link to="https://github.com/PUP-BSIT/project-devdynasty">
                              View Repository
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                    <motion.div
                      whileHover={{
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex gap-2">
                            Ecommerce (Seller)
                          </CardTitle>
                          <CardDescription>Web Development</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Ecommerce (Seller Side) integrated with other services
                        </CardContent>
                        <CardFooter>
                          <FolderGit />
                          <Button asChild variant="link">
                            <Link to="https://github.com/PUP-BSIT/project-fusion">
                              View Repository
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
              <div className="sm:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex gap-2">
                      <Link2 />
                      Connect
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-3">Email</p>
                    <Badge variant="outline" className="text-md mb-2">
                      jhonlaylopez.2003@gmail
                    </Badge>
                    <p className="text-sm font-medium mb-3">Social Links</p>
                    <div className="flex gap-2 justify-evenly">
                      <a
                        href="https://github.com/Lopez-JhonLay"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaGithub size={30} />
                      </a>
                      <a
                        href="https://www.facebook.com/jhonlay.lopez.1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaFacebook size={30} />
                      </a>
                      <a
                        href="http://www.linkedin.com/in/jhon-lay-lopez"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaLinkedin size={30} />
                      </a>
                    </div>
                  </CardContent>
                  <CardFooter></CardFooter>
                </Card>
              </div>
              <div className="sm:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex gap-2">
                      <Code />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex gap-2 justify-around mb-2">
                      <FaHtml5 title="HTML5" size={30} />
                      <FaCss3Alt title="CSS3" size={30} />
                      <FaJs title="JavaScript" size={30} />
                      <FaPhp title="PHP" size={30} />
                    </div>
                    <div className="flex gap-2 justify-around mb-2">
                      <FaBootstrap title="Bootstrap" size={30} />
                      <SiTailwindcss title="Tailwind CSS" size={30} />
                      <FaReact title="React" size={30} />
                      <FaAngular title="Angular" size={30} />
                    </div>
                    <div className="flex gap-2 justify-around mb-2">
                      <SiExpress title="Express" size={30} />
                      <SiMysql title="MySQL" size={30} />
                      <SiMongodb title="MongoDB" size={30} />
                      <SiPostman title="Postman" size={30} />
                    </div>
                    <div className="flex gap-2 justify-evenly mb-3">
                      <FaGitAlt title="Git" size={30} />
                      <SiTypescript title="TypeScript" size={30} />
                    </div>
                  </CardContent>
                  <CardFooter></CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </ThemeProvider>
    </>
  );
}

export default App;
