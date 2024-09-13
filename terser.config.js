const fs = require('fs');
const path = require('path');
const Terser = require('terser');

const inputDir = './'; // Directory where your original files are located
const outputDir = 'dist'; // Directory where minified files will be saved

// List of files and directories to exclude
const excludeFiles = [
    '.prettierrc',
    'package.json',
    'package-lock.json',
    'README.md',
    'LICENSE.txt',
    'terser.config.js',
    // Add other excluded files here
];

const excludeDirs = ['node_modules', 'dist', '.git']; // List of directories to exclude

// Function to check if a file should be excluded
function isExcludedFile(filePath) {
    const fileName = path.basename(filePath);
    return excludeFiles.includes(fileName);
}

// Function to check if a directory should be excluded
function isExcludedDir(dirPath) {
    const dirName = path.basename(dirPath);
    return excludeDirs.includes(dirName);
}

// Function to create the corresponding directory in the output directory
function ensureOutputDir(filePath) {
    const relativePath = path.relative(inputDir, filePath); // Get the relative path from inputDir
    const outputPath = path.join(outputDir, path.dirname(relativePath)); // Append the relative path to outputDir
    return new Promise((resolve, reject) => {
        fs.mkdir(outputPath, { recursive: true }, err => {
            if (err) {
                return reject(
                    new Error(`Error creating directory ${outputPath}: ${err}`)
                );
            }
            resolve(outputPath);
        });
    });
}

// Function to minify and move .js files
function minifyFile(filePath) {
    const fileName = path.basename(filePath);

    ensureOutputDir(filePath)
        .then(outputPath => {
            const outputFilePath = path.join(outputPath, fileName);

            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err);
                    return;
                }

                Terser.minify(data).then(result => {
                    if (result.error) {
                        console.error(
                            `Error minifying file ${filePath}:`,
                            result.error
                        );
                        return;
                    }

                    fs.writeFile(outputFilePath, result.code, 'utf8', err => {
                        if (err) {
                            console.error(
                                `Error writing file ${outputFilePath}:`,
                                err
                            );
                        } else {
                            console.log(
                                `Minified and moved ${filePath} to ${outputFilePath}`
                            );
                        }
                    });
                });
            });
        })
        .catch(error => console.error(error.message));
}

// Function to copy non-.js files
function copyFile(filePath) {
    const fileName = path.basename(filePath);

    ensureOutputDir(filePath)
        .then(outputPath => {
            const outputFilePath = path.join(outputPath, fileName);

            fs.copyFile(filePath, outputFilePath, err => {
                if (err) {
                    console.error(`Error copying file ${filePath}:`, err);
                } else {
                    console.log(`Copied ${filePath} to ${outputFilePath}`);
                }
            });
        })
        .catch(error => console.error(error.message));
}

// Function to process the directory, minifying .js files and copying others
function processDirectory(dir) {
    if (isExcludedDir(dir)) {
        console.log(`Skipping excluded directory: ${dir}`);
        return;
    }

    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${dir}:`, err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(
                        `Error getting stats for file ${filePath}:`,
                        err
                    );
                    return;
                }

                if (isExcludedFile(filePath)) {
                    console.log(`Skipping excluded file: ${filePath}`);
                    return;
                }

                if (stats.isFile()) {
                    if (filePath.endsWith('.js')) {
                        minifyFile(filePath); // Minify and move .js files
                    } else {
                        copyFile(filePath); // Copy non-.js files
                    }
                } else if (stats.isDirectory()) {
                    processDirectory(filePath); // Recursively process subdirectories
                }
            });
        });
    });
}

processDirectory(inputDir);
