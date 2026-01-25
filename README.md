# Engagement & Wedding Website

A simple, beautiful website for engagement and wedding celebration.

## Files

This project uses only **3 files**:
- `index.html` - Complete HTML structure
- `styles.css` - All styling
- `script.js` - All JavaScript functionality

## Quick Start

1. **Start the server** (required):
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:2801`

2. **Open your browser**:
   ```
   http://localhost:2801
   ```

**Important**: The server must be running for images to load. The server reads all image files directly from the folders.

## Adding Photos

1. Create folders in the same directory as `index.html`:
   - `photos/wedding/` - For wedding photos
   - `photos/engagement/` - For engagement photos
   - `photos/others/` - For other photos

2. Place your images in these folders

3. Refresh the page - images will be automatically discovered and displayed!

**Note:** Images are automatically discovered from the folders. No scripts or configuration needed!

## Google Maps Setup

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Edit `index.html` (line 116) and replace `YOUR_GOOGLE_MAPS_API_KEY` with your key
3. Enable "Maps JavaScript API" in Google Cloud Console

## Features

- ✅ Countdown Timer (Engagement: 28/01/2026 → Wedding: 18/06/2026)
- ✅ Photo Gallery (Wedding, Engagement, Others)
- ✅ Location Map (Engagement & Wedding venues)
- ✅ Beautiful Premium UI

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for free hosting options (Render, Railway, Fly.io, etc.)

### Vercel Deployment with File Uploads

For file uploads to work on Vercel, you need to set up Vercel Blob Storage. See [BLOB_SETUP.md](./BLOB_SETUP.md) for detailed instructions.

**Quick setup:**
1. Create a Blob store in your Vercel project (Storage tab)
2. Deploy - the `BLOB_READ_WRITE_TOKEN` is automatically available
3. Uploads will be stored in Vercel Blob Storage

## Local Development

This requires a Node.js server to run. See "Quick Start" above.

## Notes

- Photos must be in JPG, PNG, GIF, WebP, or BMP format
- Image preview feature helps you see images before adding them to the config
- All code is in 3 simple files - easy to customize!
