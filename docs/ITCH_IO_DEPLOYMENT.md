# Itch.io Deployment Guide for Quaternion Game

This guide will help you deploy your Phaser.js game to Itch.io as a playable HTML5 game.

## Prerequisites

- An Itch.io account (free at https://itch.io)
- Node.js and npm installed
- Your game project built and ready

## Step 1: Build the Game

First, build your game for production:

```bash
npm run build
```

This will create a `dist` folder with all the necessary files.

## Step 2: Prepare for Itch.io

Itch.io requires a specific structure. The game should be playable directly from an `index.html` file.

### Option A: Direct Upload (Recommended)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Navigate to the dist folder:**
   ```bash
   cd dist
   ```

3. **Create a zip file:**
   - On Mac/Linux: `zip -r quaternion-game.zip .`
   - On Windows: Right-click the dist folder → Send to → Compressed folder

4. **Upload to Itch.io:**
   - Go to your Itch.io dashboard
   - Create a new project
   - Upload the zip file
   - Set the game to "HTML" type
   - Set the main file to `index.html`

### Option B: Standalone HTML File

If you need a single HTML file (for easier hosting), you can use the build output directly. The Vite build already creates a self-contained bundle.

## Step 3: Configure Itch.io Project

1. **Project Settings:**
   - **Kind of project:** HTML
   - **Embed options:** Enable "Embed game in page"
   - **Viewport size:** 1200x700 (or your game's resolution)
   - **Embed dimensions:** 1200x700

2. **Upload your files:**
   - Upload the entire `dist` folder contents
   - Or upload the zip file created in Step 2

3. **Test the game:**
   - Use Itch.io's preview feature to test
   - Make sure all assets load correctly
   - Test on different browsers

## Step 4: Optimize for Web

### Performance Tips

1. **Minimize bundle size:**
   - The build process already minifies code
   - Consider code splitting if the bundle is too large

2. **Asset optimization:**
   - Compress images before adding them
   - Use WebP format for better compression
   - Remove unused assets

3. **Loading times:**
   - The game shows a loading screen during initialization
   - Consider adding a progress bar for asset loading

## Step 5: Game Configuration

Your game is configured with:
- **Resolution:** 1200x700
- **Physics:** Arcade Physics
- **Rendering:** WebGL with Canvas fallback

These settings work well for browser-based games on Itch.io.

## Troubleshooting

### Game doesn't load
- Check browser console for errors
- Ensure all asset paths are relative
- Verify the `index.html` file is in the root of your upload

### Assets not loading
- Check that all assets are included in the dist folder
- Verify asset paths are correct (should be relative)
- Check browser console for 404 errors

### Performance issues
- Enable performance stats in-game (click the Activity icon)
- Consider reducing particle effects for lower-end devices
- Test on different browsers and devices

## Alternative Hosting Options

If Itch.io doesn't work for your needs, consider:

1. **GitHub Pages:**
   - Free hosting for static sites
   - Easy deployment with GitHub Actions

2. **Netlify/Vercel:**
   - Free tier available
   - Automatic deployments from Git

3. **Game Jolt:**
   - Similar to Itch.io
   - Good for indie games

4. **Newgrounds:**
   - Popular for Flash/HTML5 games
   - Good community

## Build Script for Itch.io

You can create a custom build script:

```json
{
  "scripts": {
    "build:itch": "vite build && cd dist && zip -r ../quaternion-itch.zip ."
  }
}
```

Then run:
```bash
npm run build:itch
```

This will create a ready-to-upload zip file.

## Testing Locally

Before uploading, test the build locally:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test your built game.

## Notes

- Itch.io supports games up to 1GB in size
- Free accounts have some limitations
- Consider creating a thumbnail and screenshots for your game page
- Write a good description and add tags for discoverability

## Support

If you encounter issues:
1. Check the browser console for errors
2. Test in multiple browsers (Chrome, Firefox, Safari)
3. Verify all dependencies are included in the build
4. Check Itch.io's documentation for HTML game requirements


