import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicCareerPathsDir = join(repoRoot, "public", "career-paths");
const careerPathSeoSource = join(repoRoot, "src", "features", "career", "career-path-seo.ts");
const slugPattern = /^[a-z0-9-]+$/u;

function registerTypeScriptRequireHook() {
  if (registerTypeScriptRequireHook.didRegister) return;

  require.extensions[".ts"] = (module, filename) => {
    const source = readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        resolveJsonModule: true,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });

    module._compile(output.outputText, filename);
  };

  registerTypeScriptRequireHook.didRegister = true;
}

function loadCareerPathSlugs() {
  registerTypeScriptRequireHook();
  const careerPathSeo = require(careerPathSeoSource);

  if (typeof careerPathSeo.getCareerPathSlugs !== "function") {
    throw new Error("Expected getCareerPathSlugs() export in career-path-seo.ts");
  }

  return careerPathSeo.getCareerPathSlugs();
}

function findSlugProblems(slugs) {
  const seen = new Map();
  const problems = [];

  slugs.forEach((slug, index) => {
    if (typeof slug !== "string" || slug.length === 0) {
      problems.push(`Slug at index ${index} is not a non-empty string.`);
      return;
    }

    if (!slugPattern.test(slug)) {
      problems.push(`Slug "${slug}" does not match ${slugPattern.toString()}.`);
    }

    const existingIndex = seen.get(slug);
    if (existingIndex !== undefined) {
      problems.push(`Duplicate slug "${slug}" at indexes ${existingIndex} and ${index}.`);
    }

    seen.set(slug, index);
  });

  return problems;
}

async function ensureGitkeepWhenEmpty(folderPath) {
  const entries = await readdir(folderPath);
  const meaningfulEntries = entries.filter((entry) => entry !== ".DS_Store");

  if (meaningfulEntries.length > 0) return false;

  const gitkeepPath = join(folderPath, ".gitkeep");
  if (existsSync(gitkeepPath)) return false;

  await writeFile(gitkeepPath, "");
  return true;
}

async function main() {
  const slugs = loadCareerPathSlugs();
  const slugProblems = findSlugProblems(slugs);
  let createdFolders = 0;
  let existingFolders = 0;
  let gitkeepFilesAdded = 0;

  await mkdir(publicCareerPathsDir, { recursive: true });

  for (const slug of slugs) {
    const folderPath = join(publicCareerPathsDir, slug);
    const existed = existsSync(folderPath);

    await mkdir(folderPath, { recursive: true });

    if (existed) {
      existingFolders += 1;
    } else {
      createdFolders += 1;
    }

    if (await ensureGitkeepWhenEmpty(folderPath)) {
      gitkeepFilesAdded += 1;
    }
  }

  console.log(`Career path slugs discovered: ${slugs.length}`);
  console.log(`Folders created: ${createdFolders}`);
  console.log(`Folders already existed: ${existingFolders}`);
  console.log(`.gitkeep files added: ${gitkeepFilesAdded}`);

  if (slugProblems.length === 0) {
    console.log("Slug problems: none");
    return;
  }

  console.error("Slug problems:");
  slugProblems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
