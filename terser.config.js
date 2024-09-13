const fs = require('fs');
const path = require('path');
const Terser = require('terser');

const inputDir = 'src'; // Directory where your original files are located
const outputDir = 'dist'; // Directory where minified files will be saved

// List of files to exclude from minification
const excludeFiles = [
    'terser.config.js',
    'package.json',
    'README.md',
    'LICENSE.txt',
    'babel.config.js',
    'jest.config.js',
    'webpack.config.js',
    'postcss.config.js',
    'vite.config.js',
    '.eslintrc.js',
    '.prettierrc.js',
    '.browserslistrc',
    '.env',
    '.env.development',
    '.env.production',
    '.env.test',
    '.env.local',
    '.env.development.local',
    '.env.production.local',
    '.env.test.local',
    '.env.shared',
    '.env.development.shared',
    '.env.production.shared',
    '.env.test.shared',
    '.env.development.cjs',
    '.env.production.cjs',
    '.env.test.cjs',
    '.env.cjs',
    '.env.development.'
]; 

// Function to minify individual JavaScript files
function minifyFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Skip files listed in excludeFiles
    if (excludeFiles.includes(fileName)) {
        console.log(`Skipping ${filePath}`);
        return;
    }

    const outputFilePath = path.join(outputDir, path.relative(inputDir, filePath));

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
        }

        Terser.minify(data).then((result) => {
            if (result.error) {
                console.error(`Error minifying file ${filePath}:`, result.error);
                return;
            }

            // Ensure the output directory exists
            fs.mkdir(path.dirname(outputFilePath), { recursive: true }, (err) => {
                if (err) {
                    console.error(`Error creating directory ${path.dirname(outputFilePath)}:`, err);
                    return;
                }

                fs.writeFile(outputFilePath, result.code, 'utf8', (err) => {
                    if (err) {
                        console.error(`Error writing file ${outputFilePath}:`, err);
                    } else {
                        console.log(`Minified ${filePath} to ${outputFilePath}`);
                    }
                });
            });
        });
    });
}

// Function to recursively minify files in a directory
function minifyDirectory(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${dir}:`, err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for file ${filePath}:`, err);
                    return;
                }

                if (stats.isFile() && filePath.endsWith('.js')) {
                    minifyFile(filePath);
                } else if (stats.isDirectory()) {
                    minifyDirectory(filePath);
                }
            });
        });
    });
}

// Start minification process
minifyDirectory(inputDir);
