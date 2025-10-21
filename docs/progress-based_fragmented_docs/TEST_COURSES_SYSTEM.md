# Test Courses Management System

## 🎯 Goal
Verify that courses management works end-to-end with real PostgreSQL database.

---

## Prerequisites

✅ `npm run dev` is running  
✅ You're logged in to the system  
✅ Database has 3 seeded courses  

---

## Test 1: View Real Courses

### Steps:
1. Navigate to **Courses** page (click Courses in sidebar)
2. Wait for loading spinner

### Expected Result:
✅ **3 courses load from database:**
- Basic Driving Course (6 weeks, published)
- Advanced Defensive Driving (4 weeks, published)
- Traffic Laws Review (2 weeks, published)

### Backend Should Show:
```
[0] GET /api/courses
[0] Tenant context: 550e8400... (User: your@email.com, Role: student)
[0] Executed query { text: 'SELECT c.*, ...', duration: 10-50ms, rows: 3 }
```

### Browser Console Should Show:
- No errors
- Courses data logged (if you open console)

---

## Test 2: Search Functionality

### Steps:
1. Type "Basic" in search box
2. Type "Advanced" in search box
3. Clear search

### Expected Result:
✅ Courses filter in real-time  
✅ Shows "Showing X of 3 courses"  
✅ Works without API calls (client-side filtering)  

---

## Test 3: Status Filter

### Steps:
1. Select "Published" from dropdown
2. Select "Draft" from dropdown
3. Select "All Status"

### Expected Result:
✅ Only shows courses matching status  
✅ Real-time filtering  
✅ Count updates  

---

## Test 4: Create New Course

### Steps:
1. **Click "Create Course"** button (top right)
2. **Fill form:**
   - Title: "My Test Course"
   - Description: "This is a real course from the UI!"
   - Duration: 8 weeks
   - Price: 599.99
3. **Click "Create Course"**

### Expected Result:
✅ **Loading state** shows ("Creating...")  
✅ **Modal closes** automatically  
✅ **New course appears** at top of list  
✅ **Status: Draft** (new courses start as draft)  

### Backend Should Show:
```
[0] POST /api/courses
[0] Executed query { 
  text: 'INSERT INTO courses (tenant_id, title, description...)', 
  duration: 5-15ms, 
  rows: 1 
}
```

### Verify in pgAdmin:
```sql
SELECT title, status, created_at 
FROM courses 
ORDER BY created_at DESC 
LIMIT 1;
```

You should see: "My Test Course" | draft | (current timestamp)

---

## Test 5: Edit Course

### Steps:
1. **Find "My Test Course"** in the list
2. **Hover over the card** → Click ⋮ (three dots)
3. **Click "Edit"**
4. **Change:**
   - Title: "My Edited Test Course"
   - Description: "Updated description!"
   - Status: Published
5. **Click "Save Changes"**

### Expected Result:
✅ Modal closes  
✅ Course card updates immediately  
✅ Title shows "My Edited Test Course"  
✅ Status badge changes to "Published" (green)  

### Backend Should Show:
```
[0] PUT /api/courses/[uuid]
[0] Executed query { text: 'UPDATE courses SET ...', rows: 1 }
```

### Verify Persistence:
1. **Refresh browser** (F5)
2. **Course still shows updated data** ✅

---

## Test 6: Publish Course

### Steps:
1. **Find a draft course**
2. **Click ⋮ → "Publish"**
3. **Watch status change**

### Expected Result:
✅ Status badge changes to "Published"  
✅ No modal needed (immediate action)  
✅ Updates database  

### Backend Should Show:
```
[0] POST /api/courses/[uuid]/publish
[0] Executed query { text: 'UPDATE courses SET status = ...', rows: 1 }
```

---

## Test 7: Delete Course

### Steps:
1. **Click ⋮ on "My Test Course"**
2. **Click "Delete"**
3. **Confirm** in dialog
4. **Watch it disappear**

### Expected Result:
✅ Confirmation dialog appears  
✅ After confirming, course removed from list  
✅ Removed from database  

### Backend Should Show:
```
[0] DELETE /api/courses/[uuid]
[0] Executed query { text: 'SELECT COUNT(*) FROM enrollments...', rows: 1 }
[0] Executed query { text: 'DELETE FROM courses WHERE...', rows: 1 }
```

### Safety Feature:
If course has enrollments, you'll get error:
```
❌ "Cannot delete course with active enrollments"
```

---

## Test 8: Role-Based Permissions

### As Student:
1. Navigate to Courses
2. **Should NOT see:**
   - "Create Course" button ❌
   - Edit/Delete options ❌

### As Instructor:
1. Navigate to Courses
2. **Should see:**
   - "Create Course" button ✅
   - Edit option ✅
   - NO Delete option ❌ (admin only)

### As School Admin:
1. Navigate to Courses
2. **Should see:**
   - "Create Course" button ✅
   - Edit option ✅
   - Delete option ✅
   - Publish option ✅

---

## Test 9: Multi-Tenant Isolation

### Verification:
Your courses are isolated by `tenant_id`. All queries include:
```sql
WHERE c.tenant_id = $1
```

**This means:**
- ✅ You only see your school's courses
- ✅ Cannot access other tenants' courses
- ✅ Multi-tenant security working

---

## Test 10: Data Persistence

### Steps:
1. **Create a course**
2. **Close browser completely**
3. **Reopen** http://localhost:5173
4. **Login**
5. **Navigate to Courses**

### Expected Result:
✅ Your created course is still there!  
✅ All changes persisted!  
✅ Data from database, not memory!  

---

## 🎊 Success Criteria

After testing, you should have:

- [x] Viewed 3 seeded courses
- [x] Created a new course
- [x] Seen it appear in list
- [x] Verified in pgAdmin
- [x] Edited a course
- [x] Published a course
- [x] Deleted a course
- [x] Tested search and filters
- [x] Verified role permissions
- [x] Confirmed data persists

**If all checked: Week 2 COMPLETE!** ✅

---

## Common Issues

### Issue: Courses Don't Load
**Solution:** 
- Check backend logs for errors
- Verify you're logged in
- Check browser Network tab

### Issue: "Forbidden" Error
**Solution:**
- Check your role (students can't create)
- Login as admin or instructor

### Issue: Changes Don't Save
**Solution:**
- Check backend terminal for errors
- Verify database connection
- Check form validation messages

---

## Database Queries Reference

**View all courses:**
```sql
SELECT * FROM courses ORDER BY created_at DESC;
```

**View course with stats:**
```sql
SELECT c.*, 
  (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules,
  (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students
FROM courses c;
```

**Delete all test courses:**
```sql
DELETE FROM courses WHERE title LIKE '%Test%';
```

---

## Performance Notes

Watch the query duration in backend logs:
```
[0] Executed query { duration: 2, rows: 3 }
```

**Good:** < 50ms  
**OK:** 50-100ms  
**Needs optimization:** > 100ms  

With proper indexes, queries should be fast! ✅

---

## 🎉 You Did It!

You now have a **production-quality course management system**!

- Real database ✅
- Full CRUD operations ✅
- Role-based permissions ✅
- Professional UI ✅
- Type-safe code ✅

**This is real software engineering!** 🚀

---

**Ready for Week 3?** We'll build Student Management and Enrollments using the same pattern!

