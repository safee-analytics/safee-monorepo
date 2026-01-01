/* eslint-disable no-console */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "..", "..", "migrations");

function getMigrationFiles(branch: string): string[] {
  // Safely quote branch and directory for shell execution
  const safeBranch = JSON.stringify(branch);
  const safeMigrationsDir = JSON.stringify(`${migrationsDir}/*`);
  const command = `git ls-tree -r --name-only ${safeBranch} -- ${safeMigrationsDir}`;
  const output = execSync(command).toString();
  return output.split("\n").filter((file) => file.endsWith(".sql"));
}

function getNewMigrationFiles(): string[] {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  // Safely quote branch and directory for shell execution
  const safeBranch = JSON.stringify(currentBranch);
  const safeMigrationsDir = JSON.stringify(`${migrationsDir}/*`);
  const baseCommand = `git diff --name-only origin/main...${safeBranch} -- ${safeMigrationsDir}`;
  const stagedAndCommittedFiles = execSync(baseCommand)
    .toString()
    .split("\n")
    .map((x) => x.replace("database/", ""));

  const uncommittedCommand = `git ls-files --others --exclude-standard --modified ${safeMigrationsDir}`;
  const uncommittedFiles = execSync(uncommittedCommand).toString().split("\n");

  const allFiles = [...stagedAndCommittedFiles, ...uncommittedFiles];

  return allFiles.filter((file) => file.endsWith(".sql") && file.trim() !== "");
}

function extractMigrationNumber(filename: string): number {
  const match = /^(?:.*\/)?(\d+)/.exec(filename);
  return match ? parseInt(match[1], 10) : -1;
}

function bumpMigrationNum(filename: string, newNum: number): string {
  const parts = filename.split("/");
  const lastPart = parts[parts.length - 1];
  const [_oldNum, ...rest] = lastPart.split(".");
  const newLastPart = [newNum.toString().padStart(3, "0"), ...rest].join(".");
  parts[parts.length - 1] = newLastPart;
  return parts.join("/");
}

function modifyMigrationFile(oldFilename: string, newNum: number): void {
  const newFilename = bumpMigrationNum(oldFilename, newNum);

  if (fs.existsSync(oldFilename)) {
    fs.renameSync(oldFilename, newFilename);
    console.log(`Gotchu bro: renamed ${oldFilename} to ${newFilename}`);
  } else {
    console.error(`Bro its straight up erroring rn: File ${oldFilename} does not exist.`);
  }
}

function checkMigrationClashes() {
  const newMigrationFiles = getNewMigrationFiles();
  console.log("bro check these new migration files:", newMigrationFiles);

  if (newMigrationFiles.length > 1) {
    console.log("sorry bro too many files, you should just do one migration");
    return;
  }

  if (newMigrationFiles.length === 0) {
    console.log("ehhhh look at that no new migrations, why you run this script fool?");
    return;
  }
  const newMigrationFile = newMigrationFiles[0];
  const mainMigrations = getMigrationFiles("main");
  const mainNumbers = mainMigrations.map(extractMigrationNumber);
  const mainMax = Math.max(...mainNumbers);

  const newNum = extractMigrationNumber(newMigrationFile);
  if (newNum !== mainMax + 1) {
    console.log("yoooo on main the highest migration is", mainMax);
    console.log("Ight ima fix this for you");
    modifyMigrationFile(newMigrationFile, mainMax + 1);
  } else {
    console.log("That new migration looking GOOD, no need to bump");
  }
}

checkMigrationClashes();
