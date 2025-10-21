# User/Profile Architecture - Quick Reference

## 📊 Table Structure

### `users` (Authentication)
```
• id              - Primary key
• tenant_id       - Tenant isolation
• email           - Login credential
• password_hash   - Authentication
• role            - Authorization
• settings        - System config
• is_active       - Account status
• last_login      - Tracking
• created_at/updated_at
```

### `user_profiles` (Personal Data)
```
• id              - Primary key
• user_id         - FK to users (1:1)
• first_name, last_name
• avatar_url, phone
• bio, date_of_birth
• address_line1, address_line2
• city, state_province, postal_code, country
• emergency_contact_* (name, phone, email, relationship)
• guardian_* (name, email, phone, relationship, address)
• nationality, preferred_language, timezone
• profile_preferences (JSONB)
• linkedin_url, twitter_url, website_url
• created_at/updated_at
```

## 🔑 Key Relationships

```
users (1) ←→ (1) user_profiles
  ↑
  │ All other tables reference users.id:
  ├─ enrollments.student_id
  ├─ courses.created_by
  ├─ lesson_progress.student_id
  ├─ assignment_submissions.student_id
  ├─ quiz_attempts.student_id
  ├─ certificates.student_id
  ├─ notifications.user_id
  └─ etc.
```

## 💻 Common Queries

### Auth Check (No JOIN needed)
```sql
SELECT * FROM users 
WHERE email = ? AND is_active = true;
```

### Get User with Profile
```sql
SELECT u.*, p.* 
FROM users u 
LEFT JOIN user_profiles p ON p.user_id = u.id 
WHERE u.id = ?;
```

### Use Convenience View
```sql
SELECT * FROM users_with_profiles 
WHERE id = ?;
```

### Filter by Tenant
```sql
SELECT u.*, p.* 
FROM users u 
LEFT JOIN user_profiles p ON p.user_id = u.id 
WHERE u.tenant_id = ?;  -- Always filter on users.tenant_id
```

## 🛠️ Backend Operations

### Create User + Profile (Transaction)
```javascript
const client = await db.pool.connect();
try {
  await client.query('BEGIN');
  
  // Insert user
  const userResult = await client.query(
    'INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, passwordHash, role, tenantId]
  );
  
  // Insert profile
  await client.query(
    'INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES ($1, $2, $3, $4)',
    [userResult.rows[0].id, firstName, lastName, phone]
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Update User/Profile (Transaction)
```javascript
const client = await db.pool.connect();
try {
  await client.query('BEGIN');
  
  // Update user fields (role, is_active, settings)
  if (hasUserFields) {
    await client.query(
      'UPDATE users SET role = $1, is_active = $2 WHERE id = $3',
      [role, isActive, userId]
    );
  }
  
  // Update profile fields (first_name, bio, etc.)
  if (hasProfileFields) {
    await client.query(
      'UPDATE user_profiles SET first_name = $1, bio = $2 WHERE user_id = $3',
      [firstName, bio, userId]
    );
  }
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 🎯 Field Routing

### Update to `users` Table
- `role`
- `is_active`
- `settings`
- `last_login`

### Update to `user_profiles` Table
- `first_name`, `last_name`
- `avatar_url`, `phone`
- `bio`, `date_of_birth`
- `address_*`
- `emergency_contact_*`
- `guardian_*`
- `nationality`, `preferred_language`, `timezone`
- `profile_preferences`
- `*_url` (social links)

## ✅ Quick Verification

```sql
-- Check data integrity
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(*) FROM users u 
   LEFT JOIN user_profiles p ON p.user_id = u.id 
   WHERE p.id IS NULL) as orphans;
-- Expected: users = profiles, orphans = 0

-- Test the join
SELECT u.email, p.first_name, p.last_name 
FROM users u 
LEFT JOIN user_profiles p ON p.user_id = u.id 
LIMIT 5;
```

## 🔒 Security Notes

- **Auth queries:** Query `users` only, no JOIN needed
- **Profile display:** JOIN required, but fast with indexes
- **Tenant isolation:** ALWAYS filter on `users.tenant_id`
- **Cascading deletes:** Profiles auto-delete when user deleted
- **Password hashes:** Only in `users`, never in `user_profiles`

## 📱 Frontend Usage

No changes needed! Backend handles the complexity:

```typescript
// Types automatically handle the structure
interface User extends UserWithProfile {
  // Has all fields from both tables
}

// API calls remain the same
const users = await usersApi.getAll();
// Returns denormalized data (joined)
```

## 🚨 Common Mistakes to Avoid

❌ **DON'T:** Filter by `user_profiles.tenant_id` (doesn't exist!)
✅ **DO:** Filter by `users.tenant_id`

❌ **DON'T:** Reference `user_profiles.id` in foreign keys
✅ **DO:** Reference `users.id` in foreign keys

❌ **DON'T:** Update both tables without transaction
✅ **DO:** Use transactions for multi-table operations

❌ **DON'T:** Query profiles for auth checks
✅ **DO:** Query users table only for auth

## 📈 Performance Tips

- Auth checks: No JOIN (fast)
- Profile display: Single JOIN with indexes (fast)
- Bulk operations: Use `users_with_profiles` view
- Search by name: Index on `user_profiles.last_name`

## 🎓 Remember

1. `users` = Who can log in (authentication)
2. `user_profiles` = Who they are (personal data)
3. `tenant_id` = Only in `users` (single source of truth)
4. Foreign keys = Always to `users.id` (not profiles)
5. Transactions = Always for multi-table operations

---

**Quick Tip:** For most read operations, use the `users_with_profiles` view for simplicity!

