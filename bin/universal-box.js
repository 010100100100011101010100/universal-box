#!/usr/bin/env node

const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

const cloneRepository1 = require("./get/clone-dir.js");
const { generateFromConfig } = require("./generate/generate-from-config.js");

// Scaffold directory is maintained as a mirror version of the templates directory. Maintained by maintainers.
const scaffoldDir = path.resolve(__dirname, "../scaffold");
const templatesRepoBaseURL =
  "https://github.com/Abhishek-Mallick/universal-box/tree/main/template";

const user_selection = process.argv.slice(2);
const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    initProject();
    break;
  case "--help":
    showHelp();
    break;
  case "deploy":
    console.log(
      chalk.yellow(
        "Deployment utility function is still under development in a UAT environment and will be published soon."
      )
    );
    break;
  case "get":
    const repoUrl = args[0];
    if (!repoUrl) {
      console.error("Please provide a repository URL.");
      process.exit(1);
    }
    cloneRepository1(repoUrl, "universal-box");
    break;
  case "generate":
      const configFileName = args[0];
      if (!configFileName) {
        console.error("Please provide a configuration file name (e.g., idea.yml).");
        process.exit(1);
      }
      generateFromConfig(configFileName);
      break;
  
  default:
    console.log(
      chalk.red(
        'Unknown command. Use "universal-box --help" for available commands.'
      )
    );
}

function initProject() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "projectName",
        message: "Enter the project name:",
      },
    ])
    .then(async (answers) => {
      const projectName = answers.projectName;

      // Error handling for same dir name
      const projectDir = path.resolve(process.cwd(), projectName);
      if (fs.existsSync(projectDir)) {
        console.error(
          chalk.red(
            `❌ A project with the name "${projectName}" already exists. Please choose a different name.`
          )
        );
        return;
      }

      const selectedTemplate = await selectTemplate(scaffoldDir);
      let relativeTemplatePath = path.relative(scaffoldDir, selectedTemplate);
      relativeTemplatePath = relativeTemplatePath.replace(/\\/g, "/");

      const encodedTemplatePath = relativeTemplatePath
        .replace(/ /g, "%20") // Encode spaces
        .replace(/\+/g, "%2B"); // Encode plus sign
      const repoURL = `${templatesRepoBaseURL}/${encodedTemplatePath}`;

      console.log("Codebase available at: ", repoURL);

      try {
        await cloneRepository1(repoURL, projectName);

        console.log(
          chalk.green(
            `✅ Success! Project "${projectName}" has been initialized with the selected template.`
          )
        );
        console.log(chalk.yellow("\nNext steps:"));
        console.log(chalk.yellow(`1. Change to your new project directory:`));
        console.log(chalk.cyan(`   cd ${projectName}`));
        console.log(
          chalk.yellow(
            "2. Refer to the README.md file for installation and running commands."
          )
        );
        console.log(
          chalk.yellow(
            "   This file contains all necessary instructions specific to your project type."
          )
        );
        console.log(
          chalk.yellow(
            "3. Start your development server (check package.json or README.md for specific commands)"
          )
        );
        console.log(
          chalk.yellow(
            "\nFor more information, refer to the README.md file in your project directory."
          )
        );
        console.log(
          chalk.blue("\n------ Happy Coding with Universal-Box 🚀 ------")
        );
        console.log(
          chalk.gray(
            "Need help? Visit our documentation: https://universal-box.dev/"
          )
        );
      } catch (error) {
        console.error(
          chalk.red("An error occurred while cloning the repository."),
          error.message
        );
      }
    });
}

function showHelp() {
  console.log(`
${chalk.blue.bold("Universal Box - The Ultimate Project Scaffolding Tool")}

${chalk.bold("Usage:")}
  ${chalk.green("universal-box")} <command>

${chalk.bold("Commands:")}
  ${chalk.cyan("init")}         ${chalk.dim("Initialize a new project")}
  ${chalk.cyan("get")}          ${chalk.dim(
    "Clone a GitHub repository or a specific subdirectory from it"
  )}
  ${chalk.cyan("deploy")}       ${chalk.dim(
    "Trigger build and deployment pipeline"
  )}
  ${chalk.cyan("generate")}     ${chalk.dim("Generate project from a configuration file")}
  ${chalk.cyan("--help")}       ${chalk.dim("Display this help message")}

${chalk.bold("Examples:")}
  ${chalk.green("universal-box --help")}
  ${chalk.green("universal-box init")}
  ${chalk.green("universal-box deploy")}
  ${chalk.green("universal-box generate <idea.yml>")}
  ${chalk.green("universal-box get https://github.com/username/repo")}
  ${chalk.green(
    "universal-box get https://github.com/username/repo/tree/<path_to_sub-directory>"
  )}

${chalk.gray("Need help? Visit our documentation:")} ${chalk.underline.blue(
    "https://universal-box.dev/"
  )}
`);
}

async function selectTemplate(currentDir) {
  const contents = getDirectoryContents(currentDir);

  if (
    contents.includes("README.md") ||
    contents.includes("server") ||
    contents.includes("client") ||
    contents.includes("dump")
  ) {
    return currentDir;
  }

  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message: "Choose a template or subdirectory:",
      choices: contents,
    },
  ]);

  const newPath = path.join(currentDir, selection);
  if (fs.statSync(newPath).isDirectory()) {
    return selectTemplate(newPath);
  }
  return newPath;
}

function getDirectoryContents(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() ||
        (dirent.isFile() &&
          (dirent.name === "README.md" || dirent.name === "dump"))
    )
    .map((dirent) => dirent.name);
}
