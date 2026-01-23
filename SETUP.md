# Simple Setup Guide

## Project Structure

Only **3 files** needed:
- `index.html` - Main HTML file
- `styles.css` - All styles
- `script.js` - All JavaScript

## How to Use

### 1. Open the Website

Simply **double-click `index.html`** to open in your browser.

No server, no installation needed!

### 2. Add Photos

1. Create these folders next to `index.html`:
   ```
   photos/
   ├── wedding/
   ├── engagement/
   └── others/
   ```

2. Place your images in the folders

3. Open `script.js` and add filenames to `CONFIG.PHOTOS`:

```javascript
PHOTOS: {
    wedding: [
        'image1.jpg',
        'image2.jpg',
        'image3.jpg'
    ],
    engagement: [
        'photo1.jpg',
        'photo2.jpg'
    ],
    others: [
        'upload1.jpg'
    ]
}
```

4. Refresh the page

### 3. Google Maps (Optional)

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Edit `index.html` line 116, replace `YOUR_GOOGLE_MAPS_API_KEY`
3. Enable "Maps JavaScript API"

## That's It!

No dependencies, no server, no build process. Just 3 files!

