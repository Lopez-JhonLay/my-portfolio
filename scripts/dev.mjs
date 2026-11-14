import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error("Run this development command through npm.");
}

const services = [
  {
    name: "public portfolio",
    url: "http://127.0.0.1:5173",
    arguments: ["run", "dev:public"],
  },
  {
    name: "Admin CMS",
    url: "http://127.0.0.1:5174",
    arguments: ["run", "dev", "--workspace", "@portfolio-cms/admin"],
  },
  {
    name: "backend API",
    url: "http://127.0.0.1:3000",
    arguments: ["run", "dev", "--workspace", "@portfolio-cms/server"],
  },
];

console.log("Starting Portfolio CMS development services:");
for (const service of services) {
  console.log(`- ${service.name}: ${service.url}`);
}
console.log("Press Ctrl+C once to stop all services.\n");

const children = services.map((service) => ({
  ...service,
  process: spawn(process.execPath, [npmCli, ...service.arguments], {
    env: process.env,
    stdio: "inherit",
  }),
}));

let stopping = false;

function stopAll(signal) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (child.process.exitCode === null && !child.process.killed) {
      child.process.kill(signal);
    }
  }
}

for (const child of children) {
  child.process.on("error", (error) => {
    console.error(`Could not start ${child.name}: ${error.message}`);
    process.exitCode = 1;
    stopAll("SIGTERM");
  });

  child.process.on("exit", (code, signal) => {
    if (!stopping && (code !== 0 || signal !== null)) {
      console.error(
        `${child.name} stopped unexpectedly${
          code === null ? ` (${signal ?? "unknown signal"})` : ` (exit ${code})`
        }.`,
      );
      process.exitCode = code ?? 1;
      stopAll("SIGTERM");
    }
  });
}

process.once("SIGINT", () => stopAll("SIGINT"));
process.once("SIGTERM", () => stopAll("SIGTERM"));
