# White Label System Documentation

## Overview

The SunLMS White Label System allows organizations to completely customize the appearance and branding of their learning management system. This includes custom logos, colors, domains, and even custom CSS to create a fully branded experience for their users.

## Features

### Branding Customization
- **Logo Management**: Upload custom logos for header and favicon
- **Color Scheme**: Customize primary, secondary, and accent colors
- **Typography**: Custom font selection and styling
- **Custom CSS**: Advanced styling capabilities for complete control
- **Revert to Defaults**: One-click restoration of SunLMS brand colors with confirmation modal

### Domain Management
- **Custom Domains**: Use your own domain (e.g., lms.yourcompany.com)
- **Subdomain Support**: Automatic subdomain generation
- **SSL Certificates**: Automatic SSL certificate management
- **DNS Configuration**: Step-by-step DNS setup guidance

### Content Customization
- **Company Information**: Custom company name and details
- **Support Integration**: Branded support channels and contact information
- **Footer Customization**: Custom footer text and links
- **Email Templates**: Branded email notifications

## Implementation

### Frontend Components

#### WhiteLabelProvider
```typescript
import { WhiteLabelProvider, useWhiteLabel } from './contexts/WhiteLabelContext';

// Provider wraps the entire application
<WhiteLabelProvider>
  <App />
</WhiteLabelProvider>

// Hook for accessing white label settings
const { whiteLabelSettings, updateWhiteLabelSettings, getBrandingConfig } = useWhiteLabel();
```

#### WhiteLabelSettingsModal
```typescript
import WhiteLabelSettingsModal from './components/settings/WhiteLabelSettingsModal';

// Modal for configuring white label settings
<WhiteLabelSettingsModal
  isOpen={showWhiteLabelModal}
  onClose={() => setShowWhiteLabelModal(false)}
/>
```

### Backend Services

#### WhiteLabelService
```javascript
import whiteLabelService from './services/whiteLabel.service.js';

// Get white label settings
const settings = await whiteLabelService.getWhiteLabelSettings(tenantId, userRole);

// Update white label settings
const updatedSettings = await whiteLabelService.updateWhiteLabelSettings(
  tenantId, 
  userRole, 
  newSettings
);

// Get branding configuration
const branding = await whiteLabelService.getBrandingConfig(tenantId, userRole);
```

#### API Routes
```javascript
// GET /api/settings/white-label
router.get('/', asyncHandler(async (req, res) => {
  const settings = await whiteLabelService.getWhiteLabelSettings(tenantId, user.role);
  res.json({ success: true, settings });
}));

// PUT /api/settings/white-label
router.put('/', asyncHandler(async (req, res) => {
  const updatedSettings = await whiteLabelService.updateWhiteLabelSettings(
    tenantId, 
    user.role, 
    req.body
  );
  res.json({ success: true, settings: updatedSettings });
}));
```

## Configuration Options

### Branding Settings

#### Logo Configuration
```json
{
  "logoUrl": "/uploads/branding/company-logo.png",
  "faviconUrl": "/uploads/branding/company-favicon.ico",
  "companyName": "Your Company LMS"
}
```

#### Color Scheme
```json
{
  "primaryColor": "#B98C1B",
  "secondaryColor": "#6A4F10",
  "accentColor": "#D4A730"
}
```

**Note**: The default colors are now SunLMS brand colors:
- **Primary**: `#B98C1B` (Gold/Bronze) - Main brand color
- **Secondary**: `#6A4F10` (Deep Gold) - Secondary elements
- **Accent**: `#D4A730` (Lighter Gold) - Highlights and accents

These defaults can be reverted to at any time using the "Revert to Defaults" button in the White Label Settings modal.

#### Custom CSS
```css
/* Custom CSS for advanced styling */
:root {
  --custom-primary: #1e40af;
  --custom-secondary: #059669;
}

.header {
  background: linear-gradient(135deg, var(--custom-primary), var(--custom-secondary));
}

.custom-button {
  background: var(--custom-primary);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Domain Configuration

#### Custom Domain Setup
```json
{
  "customDomain": "lms.yourcompany.com",
  "enableCustomDomain": true,
  "sslEnabled": true
}
```

#### Subdomain Configuration
```json
{
  "subdomain": "yourcompany",
  "subdomainUrl": "https://yourcompany.sunlms.com"
}
```

### Support Integration

#### Support Channels
```json
{
  "supportEmail": "support@yourcompany.com",
  "supportUrl": "https://help.yourcompany.com",
  "supportPhone": "+1-555-0123",
  "customFooterText": "© 2025 Your Company. All rights reserved."
}
```

## Usage Examples

### Reverting to SunLMS Brand Defaults

The White Label Settings modal includes a "Revert to Defaults" button that allows you to quickly restore the SunLMS brand colors. This is a critical action that requires confirmation via a modal dialog.

#### Using the Revert Functionality

1. **Access White Label Settings**
   - Navigate to Settings → White Label (Super Admin only)
   - Open the White Label Settings modal

2. **Revert Colors**
   - Click the "Revert to Defaults" button
   - Confirm the action in the confirmation modal
   - The system will restore:
     - Primary Color: `#B98C1B` (Gold/Bronze)
     - Secondary Color: `#6A4F10` (Deep Gold)
     - Accent Color: `#D4A730` (Lighter Gold)

3. **Implementation Details**
   ```typescript
   const SUNLMS_DEFAULTS = {
     primaryColor: '#B98C1B', // SunLMS brand-accent-500
     secondaryColor: '#6A4F10', // SunLMS brand-accent-700
     accentColor: '#D4A730', // SunLMS brand-accent-400
   };

   const handleRevertDefaults = async () => {
     setConfirmRevertOpen(false); // Close confirmation modal
     try {
       setSettings(prev => ({
         ...prev,
         ...SUNLMS_DEFAULTS,
       }));
       await updateWhiteLabelSettings(SUNLMS_DEFAULTS);
       showToast('Colors reverted to SunLMS brand defaults', 'success');
     } catch (error) {
       showToast('Failed to revert colors', 'error');
     }
   };
   ```

**Note**: The revert functionality is protected by a confirmation modal to prevent accidental changes. This ensures that users are aware they are performing a critical action that will override their custom branding.

### Basic White Label Setup

1. **Access White Label Settings**
   ```typescript
   // In SystemSettingsModal or SchoolSettingsModal
   const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);
   
   <button onClick={() => setShowWhiteLabelModal(true)}>
     Configure White Label
   </button>
   ```

2. **Upload Branding Assets**
   ```typescript
   const handleFileUpload = async (field: 'logoUrl' | 'faviconUrl', file: File) => {
     const formData = new FormData();
     formData.append('file', file);
     formData.append('type', field === 'logoUrl' ? 'logo' : 'favicon');
     
     const response = await fetch('/api/upload/branding', {
       method: 'POST',
       body: formData
     });
     
     const data = await response.json();
     handleInputChange(field, data.url);
   };
   ```

3. **Apply Custom Colors**
   ```typescript
   const updateColors = async () => {
     await updateWhiteLabelSettings({
       primaryColor: '#B98C1B', // SunLMS brand primary
       secondaryColor: '#6A4F10', // SunLMS brand secondary
       accentColor: '#D4A730' // SunLMS brand accent
     });
   };
   ```

### Advanced Customization

#### Custom CSS Implementation
```typescript
const applyCustomStyles = () => {
  const root = document.documentElement;
  
  // Apply custom colors
  if (whiteLabelSettings.primaryColor) {
    root.style.setProperty('--color-primary', whiteLabelSettings.primaryColor);
  }
  
  // Apply custom CSS
  if (whiteLabelSettings.customCss) {
    let customStyleElement = document.getElementById('white-label-custom-css');
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'white-label-custom-css';
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = whiteLabelSettings.customCss;
  }
};
```

#### Dynamic Branding
```typescript
const getBrandingConfig = () => {
  const defaultConfig = {
    logoUrl: '/sunlms-logo-wide.png',
    companyName: 'SunLMS',
    primaryColor: '#B98C1B', // SunLMS brand primary
    secondaryColor: '#6A4F10', // SunLMS brand secondary
    accentColor: '#D4A730', // SunLMS brand accent
  };

  if (!whiteLabelSettings) return defaultConfig;

  return {
    logoUrl: whiteLabelSettings.logoUrl || defaultConfig.logoUrl,
    companyName: whiteLabelSettings.companyName || defaultConfig.companyName,
    primaryColor: whiteLabelSettings.primaryColor || defaultConfig.primaryColor,
    secondaryColor: whiteLabelSettings.secondaryColor || defaultConfig.secondaryColor,
    accentColor: whiteLabelSettings.accentColor || defaultConfig.accentColor,
  };
};
```

## File Upload System

### Branding Asset Upload

#### Supported File Types
- **Logos**: PNG, JPG, SVG (recommended: PNG with transparent background)
- **Favicons**: ICO, PNG (recommended: 32x32 or 16x16 pixels)
- **File Size Limits**: 5MB for logos, 1MB for favicons

#### Upload Process
```javascript
// Backend upload handler
router.post('/upload/branding', asyncHandler(async (req, res) => {
  const { type } = req.body;
  
  // Validate file type and size
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Process and store file
  const fileUrl = await processBrandingFile(req.file, type, tenantId);
  
  res.json({
    success: true,
    url: fileUrl,
    message: 'File uploaded successfully'
  });
}));
```

#### File Storage
```javascript
// File processing and storage
const processBrandingFile = async (file, type, tenantId) => {
  // Validate file type
  const allowedTypes = {
    logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
    favicon: ['image/x-icon', 'image/png']
  };
  
  if (!allowedTypes[type].includes(file.mimetype)) {
    throw new Error(`Invalid file type for ${type}`);
  }
  
  // Generate unique filename
  const filename = `${type}-${tenantId}-${Date.now()}.${file.originalname.split('.').pop()}`;
  
  // Store file (implement your storage solution)
  const fileUrl = await storeFile(file.buffer, filename, 'branding');
  
  return fileUrl;
};
```

## Domain Configuration

### Custom Domain Setup

#### DNS Configuration
```bash
# A Record for custom domain
lms.yourcompany.com.    IN    A    123.456.789.012

# CNAME for subdomain (alternative)
lms.yourcompany.com.    IN    CNAME    sunlms.com.
```

#### SSL Certificate Management
```javascript
// Automatic SSL certificate provisioning
const setupSSL = async (domain) => {
  try {
    // Use Let's Encrypt or similar service
    const certificate = await provisionSSLCertificate(domain);
    
    // Update domain configuration
    await updateDomainConfig(domain, {
      sslEnabled: true,
      certificateId: certificate.id
    });
    
    return { success: true, certificate };
  } catch (error) {
    console.error('SSL setup failed:', error);
    throw error;
  }
};
```

### Subdomain Management

#### Automatic Subdomain Generation
```javascript
const generateSubdomain = (companyName) => {
  // Clean and format company name
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Check availability
  const subdomain = await checkSubdomainAvailability(cleanName);
  
  return subdomain;
};
```

## Integration with Theme System

### Dynamic Theme Application
```typescript
// Apply white label colors to theme system
const applyWhiteLabelTheme = () => {
  const root = document.documentElement;
  const branding = getBrandingConfig();
  
  // Update CSS custom properties
  root.style.setProperty('--color-primary', branding.primaryColor);
  root.style.setProperty('--color-secondary', branding.secondaryColor);
  root.style.setProperty('--color-accent', branding.accentColor);
  
  // Apply to Tailwind classes
  root.classList.add('white-label-active');
};
```

### Theme Override System
```css
/* White label theme overrides */
.white-label-active {
  --tw-color-primary: var(--color-primary);
  --tw-color-secondary: var(--color-secondary);
  --tw-color-accent: var(--color-accent);
}

.white-label-active .bg-primary-600 {
  background-color: var(--color-primary) !important;
}

.white-label-active .text-primary-600 {
  color: var(--color-primary) !important;
}
```

## Security Considerations

### File Upload Security
```javascript
// Secure file upload validation
const validateBrandingFile = (file, type) => {
  // Check file size
  const maxSizes = { logo: 5 * 1024 * 1024, favicon: 1024 * 1024 };
  if (file.size > maxSizes[type]) {
    throw new Error(`File too large for ${type}`);
  }
  
  // Check file type
  const allowedMimeTypes = {
    logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
    favicon: ['image/x-icon', 'image/png']
  };
  
  if (!allowedMimeTypes[type].includes(file.mimetype)) {
    throw new Error(`Invalid file type for ${type}`);
  }
  
  // Scan for malicious content
  if (file.mimetype === 'image/svg+xml') {
    validateSVGContent(file.buffer);
  }
};
```

### CSS Injection Prevention
```javascript
// Sanitize custom CSS
const sanitizeCSS = (css) => {
  // Remove potentially dangerous CSS
  const dangerousPatterns = [
    /javascript:/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*javascript:/gi,
    /@import/gi
  ];
  
  let sanitized = css;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized;
};
```

## Performance Optimization

### Asset Optimization
```javascript
// Optimize uploaded images
const optimizeBrandingAsset = async (file, type) => {
  if (type === 'logo') {
    // Resize and optimize logo
    return await sharp(file.buffer)
      .resize(200, 60, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();
  } else if (type === 'favicon') {
    // Generate multiple favicon sizes
    const sizes = [16, 32, 48];
    const favicons = {};
    
    for (const size of sizes) {
      favicons[`${size}x${size}`] = await sharp(file.buffer)
        .resize(size, size)
        .png()
        .toBuffer();
    }
    
    return favicons;
  }
};
```

### Caching Strategy
```javascript
// Cache white label settings
const cacheWhiteLabelSettings = async (tenantId, settings) => {
  const cacheKey = `white-label:${tenantId}`;
  await redis.setex(cacheKey, 3600, JSON.stringify(settings)); // 1 hour cache
};

const getCachedWhiteLabelSettings = async (tenantId) => {
  const cacheKey = `white-label:${tenantId}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
};
```

## Troubleshooting

### Common Issues

#### Logo Not Displaying
```javascript
// Debug logo loading
const debugLogoLoading = (logoUrl) => {
  console.log('Logo URL:', logoUrl);
  
  // Check if URL is accessible
  fetch(logoUrl)
    .then(response => {
      if (!response.ok) {
        console.error('Logo not accessible:', response.status);
      }
    })
    .catch(error => {
      console.error('Logo loading error:', error);
    });
};
```

#### Custom CSS Not Applying
```javascript
// Debug CSS application
const debugCSSApplication = () => {
  const customStyleElement = document.getElementById('white-label-custom-css');
  console.log('Custom CSS element:', customStyleElement);
  console.log('Custom CSS content:', customStyleElement?.textContent);
  
  // Check for CSS syntax errors
  try {
    const style = new CSSStyleSheet();
    style.replaceSync(customStyleElement?.textContent || '');
  } catch (error) {
    console.error('CSS syntax error:', error);
  }
};
```

#### Domain Not Working
```javascript
// Debug domain configuration
const debugDomainConfig = (domain) => {
  console.log('Domain:', domain);
  
  // Check DNS resolution
  dns.lookup(domain, (err, address) => {
    if (err) {
      console.error('DNS resolution failed:', err);
    } else {
      console.log('Domain resolves to:', address);
    }
  });
  
  // Check SSL certificate
  https.get(`https://${domain}`, (res) => {
    console.log('SSL certificate valid');
  }).on('error', (err) => {
    console.error('SSL error:', err);
  });
};
```

## API Reference

### White Label Endpoints

#### GET /api/settings/white-label
Get white label settings for current tenant
```json
{
  "success": true,
  "settings": {
    "logoUrl": "/uploads/branding/logo.png",
    "faviconUrl": "/uploads/branding/favicon.ico",
    "companyName": "Your Company",
    "primaryColor": "#B98C1B",
    "secondaryColor": "#6A4F10",
    "accentColor": "#D4A730",
    "customCss": "/* custom styles */",
    "customDomain": "lms.yourcompany.com",
    "supportEmail": "support@yourcompany.com"
  }
}
```

#### PUT /api/settings/white-label
Update white label settings
```json
{
  "logoUrl": "/uploads/branding/new-logo.png",
  "primaryColor": "#B98C1B",
  "customCss": "/* updated styles */"
}
```

#### POST /api/upload/branding
Upload branding assets
```javascript
// FormData with file and type
const formData = new FormData();
formData.append('file', logoFile);
formData.append('type', 'logo');

fetch('/api/upload/branding', {
  method: 'POST',
  body: formData
});
```

### Response Format
```json
{
  "success": true,
  "url": "/uploads/branding/logo-1234567890.png",
  "message": "File uploaded successfully"
}
```

## Best Practices

### Design Guidelines
- **Logo Requirements**: Use high-resolution PNG with transparent background
- **Color Contrast**: Ensure sufficient contrast for accessibility
- **Responsive Design**: Test customizations on all device sizes
- **Brand Consistency**: Maintain consistent branding across all elements

### Performance Guidelines
- **Image Optimization**: Compress images before upload
- **CSS Efficiency**: Use efficient CSS selectors and avoid !important
- **Caching**: Leverage browser caching for static assets
- **CDN Usage**: Use CDN for global asset delivery

### Security Guidelines
- **File Validation**: Always validate uploaded files
- **CSS Sanitization**: Sanitize custom CSS to prevent XSS
- **Access Control**: Restrict white label access to authorized users
- **Audit Logging**: Log all white label configuration changes

## Future Enhancements

### Planned Features
- **Theme Builder**: Visual theme customization interface
- **Template Library**: Pre-built white label templates
- **Advanced CSS Editor**: Syntax highlighting and validation
- **Multi-language Support**: Localized white label settings
- **A/B Testing**: Test different white label configurations
- **Analytics Integration**: Track white label usage and performance

### Integration Opportunities
- **Design Tools**: Integration with Figma, Sketch
- **Asset Management**: Integration with asset management systems
- **Brand Guidelines**: Automated brand guideline compliance
- **Version Control**: Track white label configuration changes
- **Backup/Restore**: White label configuration backup system
