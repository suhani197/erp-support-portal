# Logo Image Placement

## Where to Add Your Logo Image

Place your logo image file in this directory: `frontend/src/assets/images/`

## Supported Formats
- **SVG** (recommended for scalability): `logo.svg`
- **PNG** (for raster images): `logo.png`
- **WebP** (modern format): `logo.webp`

## Recommended Sizes
- **Login page**: 120x48px (rectangular)
- **Navbar**: 24x24px (square)

## Current Implementation
The application is currently configured to use:
- **Login page**: `logologin.svg`
- **Navbar**: `logo.svg`

If you use different filenames or formats, update the image references in:

1. **Login page**: `frontend/src/app/features/auth/login.component.ts`
2. **Navbar**: `frontend/src/app/app.component.ts`

## Example Usage
```html
<!-- For login page (120x48) -->
<img src="assets/images/logologin.svg" alt="Your Company Logo" width="120" height="48" />

<!-- For navbar (24x24) -->
<img src="assets/images/logo.svg" alt="Your Company Logo" width="24" height="24" />
```

## Sample Logo
A sample SVG logo has been created for you. Replace it with your actual company logo.

## Note
You now need two logo files:
- `logologin.svg` - For the login page (120x48px)
- `logo.svg` - For the navbar (24x24px)

You can use the same logo file for both if you want, just copy it to both filenames.
