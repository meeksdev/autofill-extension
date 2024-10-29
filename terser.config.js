const fs = require('fs').promises;
const path = require('path');
const Terser = require('terser');

const inputDir = './'; // Directory where your original files are located
const outputDir = 'dist'; // Directory where minified files will be saved
const manifestPath = path.join(outputDir, 'manifest.json');

// List of files and directories to exclude
const excludeFiles = [
    '.gitignore',
    '.prettierrc',
    'package.json',
    'package-lock.json',
    'README.md',
    'LICENSE.txt',
    'terser.config.js',
    // 'manifest.json',
    // Add other excluded files here
];

const excludeDirs = ['node_modules', 'dist', '.git']; // List of directories to exclude

/**
 * Updates the manifest.json file based on the current environment (development or production).
 * Modifies the manifest version and name, and adjusts the OAuth client ID accordingly.
 */
async function updateManifest() {
    try {
        const manifestData = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestData);

        // Check the current environment
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            // Modify manifest for production
            manifest.version = '1.5.1'; // Set version for production
            manifest.name = 'Sarena Autofill'; // Add a production-specific name
            manifest.oauth2.client_id = '746464567000-u21pn0pa9a5q18fpmeqg9hp7jr2vt3d1.apps.googleusercontent.com';
        } else {
            // Modify manifest for development
            manifest.version = '1.5.1'; // Set version for development
            manifest.name = 'Sarena Autofill (Testing)'; // Add a development-specific name
            manifest.oauth2.client_id = '746464567000-su8m4egfppi7mvhln595jjbgg2fh3vcj.apps.googleusercontent.com';
        }

        // Write the updated manifest back to file
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`Manifest updated for ${process.env.NODE_ENV}`);
    } catch (error) {
        console.error('Error updating manifest:', error);
    }
}

/**
 * Checks if a given file path should be excluded based on the predefined excludeFiles list.
 * @param {string} filePath - The path of the file to check.
 * @returns {boolean} - Returns true if the file is in the excludeFiles list, otherwise false.
 */
function isExcludedFile(filePath) {
    const fileName = path.basename(filePath);
    return excludeFiles.includes(fileName);
}

/**
 * Checks if a given directory path should be excluded based on the predefined excludeDirs list.
 * @param {string} dirPath - The path of the directory to check.
 * @returns {boolean} - Returns true if the directory is in the excludeDirs list, otherwise false.
 */
function isExcludedDir(dirPath) {
    const dirName = path.basename(dirPath);
    return excludeDirs.includes(dirName);
}

/**
 * Ensures that the corresponding output directory exists for the specified file path.
 * Creates the directory structure in the output directory as needed.
 * @param {string} filePath - The original file path to ensure the output directory for.
 * @returns {Promise<string>} - Returns a promise that resolves to the output directory path.
 * @throws Will throw an error if there is an issue creating the directory.
 */
async function ensureOutputDir(filePath) {
    const relativePath = path.relative(inputDir, filePath); // Get the relative path from inputDir
    const outputPath = path.join(outputDir, path.dirname(relativePath)); // Append the relative path to outputDir
    try {
        await fs.mkdir(outputPath, { recursive: true });
        return outputPath;
    } catch (err) {
        throw new Error(`Error creating directory ${outputPath}: ${err}`);
    }
}

/**
 * Minifies a specified JavaScript file and saves it to the corresponding output directory.
 * @param {string} filePath - The path of the JavaScript file to minify.
 * @returns {Promise<void>} - A promise that resolves when the file has been minified and saved.
 */
async function minifyFile(filePath) {
    const fileName = path.basename(filePath);

    try {
        const outputPath = await ensureOutputDir(filePath);
        const outputFilePath = path.join(outputPath, fileName);

        const data = await fs.readFile(filePath, 'utf8');
        const result = await Terser.minify(data);

        if (result.error) {
            console.error(`Error minifying file ${filePath}:`, result.error);
            return;
        }

        await fs.writeFile(outputFilePath, result.code, 'utf8');
        console.log(`Minified and moved ${filePath} to ${outputFilePath}`);
    } catch (error) {
        console.error(error.message);
    }
}

/**
 * Copies a non-JavaScript file to the corresponding output directory.
 * @param {string} filePath - The path of the file to copy.
 * @returns {Promise<void>} - A promise that resolves when the file has been copied.
 */
async function copyFile(filePath) {
    const fileName = path.basename(filePath);

    try {
        const outputPath = await ensureOutputDir(filePath);
        const outputFilePath = path.join(outputPath, fileName);

        await fs.copyFile(filePath, outputFilePath);
        console.log(`Copied ${filePath} to ${outputFilePath}`);
    } catch (error) {
        console.error(`Error copying file ${filePath}:`, error);
    }
}

/**
 * Processes the specified directory by minifying .js files and copying non-.js files.
 * Recursively processes subdirectories while excluding specified files and directories.
 * @param {string} dir - The directory to process.
 */
async function processDirectory(dir) {
    if (isExcludedDir(dir)) {
        console.log(`Skipping excluded directory: ${dir}`);
        return;
    }

    try {
        const files = await fs.readdir(dir);
        await Promise.all(
            files.map(async file => {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                if (isExcludedFile(filePath)) {
                    console.log(`Skipping excluded file: ${filePath}`);
                    return;
                }

                if (stats.isFile()) {
                    if (filePath.endsWith('.js')) {
                        await minifyFile(filePath); // Minify and move .js files
                    } else {
                        await copyFile(filePath); // Copy non-.js files
                    }
                } else if (stats.isDirectory()) {
                    await processDirectory(filePath); // Recursively process subdirectories
                }
            })
        );
    } catch (error) {
        console.error(`Error processing directory ${dir}:`, error);
    }
}

// Recursively delete the folder and its contents
fs.rm(outputDir, { recursive: true, force: true })
    .then(() => {
        console.log(`Folder '${outputDir}' deleted successfully.`);
        return processDirectory(inputDir);
    })
    .then(() => {
        return updateManifest();
    })
    .catch(err => {
        console.error(`Error deleting folder: ${err.message}`);
    });
