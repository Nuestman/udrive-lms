# User Profile Page - Quick Start Guide

## 🚀 Accessing the Profile Page

### For Each User Role:

| Role | URL Path | Navigation Link |
|------|----------|----------------|
| **Super Admin** | `/admin/profile` | Sidebar → My Profile |
| **School Admin** | `/school/profile` | Sidebar → My Profile |
| **Instructor** | `/instructor/profile` | Sidebar → My Profile |
| **Student** | `/student/profile` | Sidebar → My Profile |

## 📋 Quick Feature Overview

### View Mode (Default)
- See all your profile information
- View role badge and avatar
- Click "Edit Profile" to make changes
- Click "Change Password" for security

### Edit Mode
- Click "Edit Profile" button
- Modify any field
- Upload new avatar (click camera icon)
- Click "Save Changes" when done
- Click "Cancel" to discard changes

### Change Password
1. Click "Change Password" button
2. Enter current password
3. Enter new password (must meet requirements)
4. Confirm new password
5. Click "Change Password"
6. Success message appears

### Upload Avatar
1. Click "Edit Profile"
2. Click camera icon on avatar
3. Select image file (max 5MB)
4. Image uploads automatically
5. New avatar appears immediately

## 🎯 Profile Sections

### 1. Basic Information
- ✏️ First & Last Name
- 📧 Email (read-only)
- 📱 Phone
- 🎂 Date of Birth
- 🌍 Nationality
- 📝 Bio

### 2. Address
- 🏠 Address Lines 1 & 2
- 🏙️ City & State/Province
- 📮 Postal Code
- 🗺️ Country

### 3. Emergency Contact
- 👤 Contact Name
- 🤝 Relationship
- 📞 Phone
- ✉️ Email

### 4. Guardian Info (Students Only)
- 👨‍👩‍👧 Guardian Name
- 🤝 Relationship
- 📞 Phone
- ✉️ Email
- 🏠 Address

### 5. Preferences & Social
- 🌐 Preferred Language
- ⏰ Timezone
- 💼 LinkedIn URL
- 🐦 Twitter URL
- 🌐 Website URL

## 🔒 Password Requirements

When changing your password, ensure it includes:
- ✅ At least 8 characters
- ✅ One uppercase letter (A-Z)
- ✅ One lowercase letter (a-z)
- ✅ One number (0-9)

The password strength indicator will show:
- 🔴 **Weak**: Less than 3 requirements met
- 🟡 **Medium**: 3-4 requirements met
- 🟢 **Strong**: 5+ requirements met (includes special characters)

## 📱 Mobile Usage

The profile page is fully mobile-responsive:
- **Sections stack vertically** on small screens
- **Touch-friendly buttons** and inputs
- **Optimized spacing** for mobile
- **Easy navigation** with hamburger menu

## ⚠️ Important Notes

- **Email cannot be changed** (requires email verification)
- **Avatar size limit**: 5MB
- **Supported image formats**: JPG, PNG, GIF, WebP
- **All changes save immediately** when you click "Save Changes"
- **Guardian section** only appears for students
- **External links** (LinkedIn, Twitter, Website) open in new tabs

## 🆘 Troubleshooting

### Avatar won't upload?
- Check file size is under 5MB
- Ensure file is an image (JPG, PNG, GIF, WebP)
- Try a different image

### Password change fails?
- Verify current password is correct
- Ensure new password meets all requirements
- Check that confirm password matches

### Changes not saving?
- Check internet connection
- Look for error messages
- Try refreshing the page and editing again

### Profile not loading?
- Refresh the page
- Clear browser cache
- Check if you're logged in

## 🎨 Visual Guide

### Profile Page Layout:

```
┌─────────────────────────────────────────────────────────┐
│  📋 My Profile                        [🔒 Password] [✏️ Edit] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  [Avatar]    │  📝 Basic Information                     │
│   📷         │  ├─ Name, Email, Phone, DOB, etc.       │
│              │                                          │
│  John Doe    │  🏠 Address Information                   │
│  john@...    │  ├─ Street, City, State, Zip, etc.      │
│  [Badge]     │                                          │
│              │  ❤️  Emergency Contact                    │
│  📅 Joined   │  ├─ Name, Relationship, Phone, etc.     │
│  📞 Phone    │                                          │
│  📍 Location │  👨‍👩‍👧 Guardian Info (Students)             │
│              │  ├─ Name, Relationship, Contact, etc.   │
│              │                                          │
│              │  🌐 Preferences & Social Links            │
│              │  ├─ Language, Timezone                   │
│              │  └─ LinkedIn, Twitter, Website          │
└──────────────┴──────────────────────────────────────────┘
```

## 🎯 Quick Tips

1. **Keep your profile updated** for better communication
2. **Add emergency contact** for safety purposes
3. **Upload a professional avatar** for credibility
4. **Change password regularly** for security
5. **Complete all sections** for a comprehensive profile

---

**Need Help?** Check the full documentation in `USER_PROFILE_PAGE_COMPLETE.md` or contact support.

