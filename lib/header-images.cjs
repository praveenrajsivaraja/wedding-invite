const fs = require('fs');
const path = require('path');

const HEADER_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp|gif)$/i;
const HEADER_FOLDER = 'header';

function getHeaderImagesDir() {
    return path.join(process.cwd(), 'photos', HEADER_FOLDER);
}

function listHeaderImages() {
    const headerPath = getHeaderImagesDir();
    if (!fs.existsSync(headerPath)) {
        return [];
    }

    return fs.readdirSync(headerPath)
        .filter((file) => HEADER_IMAGE_PATTERN.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function syncHeaderManifest() {
    const headerPath = getHeaderImagesDir();
    if (!fs.existsSync(headerPath)) {
        return;
    }

    const images = listHeaderImages();
    const manifestPath = path.join(headerPath, 'manifest.json');
    const payload = { folder: HEADER_FOLDER, images };
    fs.writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

module.exports = {
    HEADER_IMAGE_PATTERN,
    HEADER_FOLDER,
    getHeaderImagesDir,
    listHeaderImages,
    syncHeaderManifest
};
