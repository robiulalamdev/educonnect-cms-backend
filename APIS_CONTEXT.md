{
  "info": {
    "name": "Coaching Management System CMS - dev",
    "_postman_id": "cms-coaching-dev-001",
    "description": "Full API collection for Coaching Management System.\n\nBase URL: {{base_url}}\nDefault: http://localhost:3000\n\n## Auth Strategy\n- Admin: HTTP-only signed cookies (access + refresh)\n- User: HTTP-only signed cookies (access + refresh)\n- Cookies are set automatically on login\n\n## Modules\n1. Admin — Auth + Dashboard\n2. Auth — User register/login\n3. User — Profile management\n4. Education — Levels + Subjects (admin managed)\n5. Upload — Cloudinary file upload\n6. Subscription — Packages (admin managed)",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:3000", "type": "string" },
    { "key": "api_v1",   "value": "{{base_url}}/api/v1",   "type": "string" }
  ],
  "item": [

    {
      "name": "🔐 Admin",
      "description": "Admin authentication and dashboard management.\nPrefix: /api/v1/admin",
      "item": [

        {
          "name": "Auth",
          "description": "Admin login, logout, session, own profile",
          "item": [

            {
              "name": "Login",
              "request": {
                "method": "POST",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/admin/auth/login", "host": ["{{api_v1}}"], "path": ["admin","auth","login"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"email\": \"superadmin@cms.com\",\n  \"password\": \"password123\"\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Login as admin. Sets httpOnly signed cookies:\n- `admin_access` (short-lived)\n- `admin_refresh` (long-lived)\n\n**Errors:**\n- 401 INVALID_CREDENTIALS\n- 403 ACCOUNT_SUSPENDED"
              }
            },

            {
              "name": "Refresh Session",
              "request": {
                "method": "POST",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/auth/refresh", "host": ["{{api_v1}}"], "path": ["admin","auth","refresh"] },
                "description": "Refreshes admin access token using the refresh cookie.\nNo body required — reads cookie automatically.\n\n**Errors:**\n- 401 No refresh token / Session expired"
              }
            },

            {
              "name": "Logout",
              "request": {
                "method": "POST",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/auth/logout", "host": ["{{api_v1}}"], "path": ["admin","auth","logout"] },
                "description": "Clears both admin cookies.\n\n🔒 Requires: admin cookie"
              }
            },

            {
              "name": "Get My Profile",
              "request": {
                "method": "GET",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/auth/me", "host": ["{{api_v1}}"], "path": ["admin","auth","me"] },
                "description": "Returns the currently authenticated admin's profile.\n\n🔒 Requires: admin cookie\n\n**Errors:**\n- 403 ACCOUNT_SUSPENDED (also clears cookies)\n- 404 Admin not found"
              }
            },

            {
              "name": "Update My Profile",
              "request": {
                "method": "PATCH",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/auth/me", "host": ["{{api_v1}}"], "path": ["admin","auth","me"] },
                "body": {
                  "mode": "formdata",
                  "formdata": [
                    { "key": "full_name", "value": "Super Admin", "type": "text", "description": "Optional" },
                    { "key": "email",     "value": "admin@cms.com", "type": "text", "description": "Optional" },
                    { "key": "avatar",    "value": "", "type": "file", "description": "Optional. jpg/png/webp. Max 2MB. Field name must be: avatar" }
                  ]
                },
                "description": "Update own profile. Multipart form-data.\n\n🔒 Requires: admin cookie\n\n**File field:** `avatar` — jpg/png/webp, max 2MB\n\n**Errors:**\n- 409 EMAIL_TAKEN"
              }
            },

            {
              "name": "Change My Password",
              "request": {
                "method": "PATCH",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/admin/auth/me/password", "host": ["{{api_v1}}"], "path": ["admin","auth","me","password"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"current_password\": \"oldpassword123\",\n  \"new_password\": \"newpassword123\"\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Change own password. Clears cookies after success — requires re-login.\n\n🔒 Requires: admin cookie\n\n**Errors:**\n- 400 WRONG_PASSWORD"
              }
            }

          ]
        },

        {
          "name": "Dashboard — Admin Management",
          "description": "Manage admin accounts.\nPrefix: /api/v1/admin/dashboard/admins",
          "item": [

            {
              "name": "Register New Admin",
              "request": {
                "method": "POST",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/dashboard/admins", "host": ["{{api_v1}}"], "path": ["admin","dashboard","admins"] },
                "body": {
                  "mode": "formdata",
                  "formdata": [
                    { "key": "full_name", "value": "New Admin",         "type": "text" },
                    { "key": "email",     "value": "newadmin@cms.com",  "type": "text" },
                    { "key": "password",  "value": "password123",       "type": "text" },
                    { "key": "role",      "value": "MODERATOR",         "type": "text", "description": "SUPER_ADMIN | ADMIN | MODERATOR" },
                    { "key": "avatar",    "value": "",                  "type": "file", "description": "Optional. jpg/png/webp. Max 2MB" }
                  ]
                },
                "description": "Register a new admin account.\n\n🔒 Requires: SUPER_ADMIN\n\n**Roles:** SUPER_ADMIN | ADMIN | MODERATOR\n\n**Errors:**\n- 409 EMAIL_TAKEN\n- 403 Forbidden"
              }
            },

            {
              "name": "List Admins",
              "request": {
                "method": "GET",
                "header": [],
                "url": {
                  "raw": "{{api_v1}}/admin/dashboard/admins?page=1&limit=20",
                  "host": ["{{api_v1}}"],
                  "path": ["admin","dashboard","admins"],
                  "query": [
                    { "key": "page",   "value": "1",    "description": "Default: 1" },
                    { "key": "limit",  "value": "20",   "description": "Default: 20, Max: 100" },
                    { "key": "search", "value": "",     "description": "Optional. Search by name or email", "disabled": true },
                    { "key": "role",   "value": "",     "description": "Optional. SUPER_ADMIN | ADMIN | MODERATOR", "disabled": true },
                    { "key": "status", "value": "",     "description": "Optional. ACTIVE | INACTIVE", "disabled": true }
                  ]
                },
                "description": "List all admins with pagination + filters.\n\n🔒 Requires: SUPER_ADMIN | ADMIN\n\n**Query params:**\n- page, limit\n- search (name or email)\n- role\n- status"
              }
            },

            {
              "name": "Get Admin By ID",
              "request": {
                "method": "GET",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/dashboard/admins/:id", "host": ["{{api_v1}}"], "path": ["admin","dashboard","admins",":id"], "variable": [{ "key": "id", "value": "ADMIN_CUID_HERE" }] },
                "description": "Get a single admin by their cuid.\n\n🔒 Requires: SUPER_ADMIN | ADMIN\n\n**Errors:**\n- 404 Admin not found"
              }
            },

            {
              "name": "Update Admin By ID",
              "request": {
                "method": "PATCH",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/dashboard/admins/:id", "host": ["{{api_v1}}"], "path": ["admin","dashboard","admins",":id"], "variable": [{ "key": "id", "value": "ADMIN_CUID_HERE" }] },
                "body": {
                  "mode": "formdata",
                  "formdata": [
                    { "key": "full_name", "value": "",        "type": "text",  "description": "Optional", "disabled": true },
                    { "key": "email",     "value": "",        "type": "text",  "description": "Optional", "disabled": true },
                    { "key": "role",      "value": "ADMIN",   "type": "text",  "description": "Optional. Only SUPER_ADMIN can change role", "disabled": true },
                    { "key": "status",    "value": "INACTIVE","type": "text",  "description": "Optional. ACTIVE | INACTIVE", "disabled": true },
                    { "key": "avatar",    "value": "",        "type": "file",  "description": "Optional. jpg/png/webp. Max 2MB", "disabled": true }
                  ]
                },
                "description": "Update another admin's info.\n\n🔒 Requires: SUPER_ADMIN | ADMIN\n\n**Rules:**\n- Cannot edit yourself (use /me)\n- Only SUPER_ADMIN can change roles\n- ADMIN cannot edit SUPER_ADMIN\n\n**Errors:**\n- 404 NOT_FOUND\n- 400 USE_PROFILE_ENDPOINT\n- 403 FORBIDDEN\n- 403 CANNOT_CHANGE_ROLE"
              }
            },

            {
              "name": "Delete Admin By ID",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": { "raw": "{{api_v1}}/admin/dashboard/admins/:id", "host": ["{{api_v1}}"], "path": ["admin","dashboard","admins",":id"], "variable": [{ "key": "id", "value": "ADMIN_CUID_HERE" }] },
                "description": "Permanently delete an admin account. Also removes avatar from Cloudinary.\n\n🔒 Requires: SUPER_ADMIN\n\n**Errors:**\n- 404 NOT_FOUND\n- 400 CANNOT_DELETE_SELF"
              }
            }

          ]
        }

      ]
    },

    {
      "name": "👤 Auth (Users)",
      "description": "User registration, login, email verification.\nPrefix: /api/v1/auth\n\nCovers: Teacher, Student, Guardian",
      "item": [
        {
          "name": "Register — Teacher",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/register", "host": ["{{api_v1}}"], "path": ["auth","register"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"full_name\": \"John Teacher\",\n  \"email\": \"teacher@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"TEACHER\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Register a new teacher account.\nTeacher status will be PENDING_VERIFICATION until email is verified.\nAfter email verification, still needs admin approval (is_approved) before posting services.\n\n**Errors:**\n- 409 EMAIL_TAKEN"
          }
        },

        {
          "name": "Register — Student",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/register", "host": ["{{api_v1}}"], "path": ["auth","register"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"full_name\": \"Jane Student\",\n  \"email\": \"student@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"STUDENT\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Register a new student account.\nNo admin approval needed. After email verification status becomes ACTIVE."
          }
        },

        {
          "name": "Register — Guardian",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/register", "host": ["{{api_v1}}"], "path": ["auth","register"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"full_name\": \"Parent Guardian\",\n  \"email\": \"guardian@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"GUARDIAN\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Register a new guardian account.\nNo admin approval needed. After email verification status becomes ACTIVE."
          }
        },

        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/login", "host": ["{{api_v1}}"], "path": ["auth","login"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teacher@example.com\",\n  \"password\": \"password123\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Login as any user (Teacher/Student/Guardian).\nSets httpOnly signed cookies:\n- `user_access`\n- `user_refresh`\n\n**Errors:**\n- 401 INVALID_CREDENTIALS\n- 403 ACCOUNT_SUSPENDED / BANNED\n- 403 EMAIL_NOT_VERIFIED"
          }
        },

        {
          "name": "Refresh Session",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/auth/refresh", "host": ["{{api_v1}}"], "path": ["auth","refresh"] },
            "description": "Refresh user access token using the refresh cookie."
          }
        },

        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/auth/logout", "host": ["{{api_v1}}"], "path": ["auth","logout"] },
            "description": "Clears user cookies.\n\n🔒 Requires: user cookie"
          }
        },

        {
          "name": "Verify Email",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/verify-email", "host": ["{{api_v1}}"], "path": ["auth","verify-email"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"token\": \"EMAIL_VERIFICATION_TOKEN\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Verify email using token sent to the registered email address.\n\n**Errors:**\n- 400 INVALID_TOKEN / TOKEN_EXPIRED"
          }
        },

        {
          "name": "Resend Verification Email",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/resend-verification", "host": ["{{api_v1}}"], "path": ["auth","resend-verification"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teacher@example.com\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Resend email verification link.\n\n**Errors:**\n- 400 ALREADY_VERIFIED\n- 404 USER_NOT_FOUND"
          }
        },

        {
          "name": "Forgot Password",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/forgot-password", "host": ["{{api_v1}}"], "path": ["auth","forgot-password"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teacher@example.com\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Send password reset email.\nAlways returns success to prevent email enumeration."
          }
        },

        {
          "name": "Reset Password",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/auth/reset-password", "host": ["{{api_v1}}"], "path": ["auth","reset-password"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"token\": \"RESET_TOKEN\",\n  \"new_password\": \"newpassword123\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Reset password using token from email.\n\n**Errors:**\n- 400 INVALID_TOKEN / TOKEN_EXPIRED"
          }
        }
      ]
    },

    {
      "name": "🙍 User — Profile",
      "description": "Authenticated user profile management.\nPrefix: /api/v1/user\n\nWorks for all roles: Teacher, Student, Guardian",
      "item": [

        {
          "name": "Get My Profile",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/user/me", "host": ["{{api_v1}}"], "path": ["user","me"] },
            "description": "Returns full profile of the authenticated user including role-specific profile.\n\n🔒 Requires: user cookie"
          }
        },

        {
          "name": "Update My Profile",
          "request": {
            "method": "PATCH",
            "header": [],
            "url": { "raw": "{{api_v1}}/user/me", "host": ["{{api_v1}}"], "path": ["user","me"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "full_name",    "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "phone",        "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "gender",       "value": "MALE",      "type": "text", "description": "Optional. MALE | FEMALE | OTHER", "disabled": true },
                { "key": "date_of_birth","value": "2000-01-01","type": "text", "description": "Optional. ISO date", "disabled": true },
                { "key": "bio",          "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "country",      "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "city",         "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "area",         "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "address_line", "value": "",          "type": "text", "description": "Optional", "disabled": true },
                { "key": "latitude",     "value": "",          "type": "text", "description": "Optional. Decimal", "disabled": true },
                { "key": "longitude",    "value": "",          "type": "text", "description": "Optional. Decimal", "disabled": true },
                { "key": "avatar",       "value": "",          "type": "file", "description": "Optional. jpg/png/webp. Max 2MB", "disabled": true }
              ]
            },
            "description": "Update authenticated user's base profile.\n\n🔒 Requires: user cookie\n\n**File field:** `avatar` — jpg/png/webp, max 2MB"
          }
        },

        {
          "name": "Update Teacher Profile",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/user/me/teacher-profile", "host": ["{{api_v1}}"], "path": ["user","me","teacher-profile"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"tagline\": \"Expert Math & Physics tutor\",\n  \"experience_years\": 5,\n  \"qualifications\": \"BSc Mathematics, MSc Physics\",\n  \"achievements\": \"100+ students taught\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Update teacher-specific profile info.\n\n🔒 Requires: user cookie + TEACHER role"
          }
        },

        {
          "name": "Update Student Profile",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/user/me/student-profile", "host": ["{{api_v1}}"], "path": ["user","me","student-profile"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"education_level_id\": \"LEVEL_CUID\",\n  \"institution_name\": \"Dhaka College\",\n  \"roll_number\": \"123456\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Update student-specific profile info.\n\n🔒 Requires: user cookie + STUDENT role"
          }
        },

        {
          "name": "Update Guardian Profile",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/user/me/guardian-profile", "host": ["{{api_v1}}"], "path": ["user","me","guardian-profile"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"occupation\": \"Engineer\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Update guardian-specific profile info.\n\n🔒 Requires: user cookie + GUARDIAN role"
          }
        },

        {
          "name": "Change Password",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/user/me/password", "host": ["{{api_v1}}"], "path": ["user","me","password"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"current_password\": \"oldpassword123\",\n  \"new_password\": \"newpassword123\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Change password. Clears cookies after success.\n\n🔒 Requires: user cookie\n\n**Errors:**\n- 400 WRONG_PASSWORD"
          }
        },

        {
          "name": "Get Public Profile",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/user/profile/:id", "host": ["{{api_v1}}"], "path": ["user","profile",":id"], "variable": [{ "key": "id", "value": "USER_CUID_HERE" }] },
            "description": "View any user's public profile.\n- Teacher: shows services + ratings\n- Student/Guardian: shows their posts only\n\nBlocked users see limited info.\n\n**Errors:**\n- 404 USER_NOT_FOUND"
          }
        }

      ]
    },

    {
      "name": "🎓 Education",
      "description": "Admin-managed education levels and subjects.\nPrefix: /api/v1/education",
      "item": [

        {
          "name": "Level Groups",
          "item": [
            {
              "name": "Create Level Group",
              "request": {
                "method": "POST",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/level-groups", "host": ["{{api_v1}}"], "path": ["education","level-groups"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Secondary\",\n  \"sort_order\": 2\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Create a new education level group (e.g. Primary, Secondary).\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "List Level Groups",
              "request": {
                "method": "GET",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/level-groups", "host": ["{{api_v1}}"], "path": ["education","level-groups"] },
                "description": "List all education level groups.\nPublic endpoint — no auth required."
              }
            },
            {
              "name": "Update Level Group",
              "request": {
                "method": "PATCH",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/level-groups/:id", "host": ["{{api_v1}}"], "path": ["education","level-groups",":id"], "variable": [{ "key": "id", "value": "GROUP_CUID" }] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Secondary Updated\",\n  \"sort_order\": 3,\n  \"is_active\": true\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Update an education level group.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "Delete Level Group",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/level-groups/:id", "host": ["{{api_v1}}"], "path": ["education","level-groups",":id"], "variable": [{ "key": "id", "value": "GROUP_CUID" }] },
                "description": "Delete a level group. Only if no levels are attached.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            }
          ]
        },

        {
          "name": "Levels",
          "item": [
            {
              "name": "Create Level",
              "request": {
                "method": "POST",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/levels", "host": ["{{api_v1}}"], "path": ["education","levels"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"group_id\": \"GROUP_CUID\",\n  \"name\": \"Class 10 (SSC)\",\n  \"sort_order\": 5\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Create a level under a group.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "List Levels",
              "request": {
                "method": "GET",
                "header": [],
                "url": {
                  "raw": "{{api_v1}}/education/levels?group_id=GROUP_CUID",
                  "host": ["{{api_v1}}"],
                  "path": ["education","levels"],
                  "query": [
                    { "key": "group_id", "value": "GROUP_CUID", "description": "Optional filter by group" }
                  ]
                },
                "description": "List all levels. Filter by group_id.\nPublic endpoint."
              }
            },
            {
              "name": "Update Level",
              "request": {
                "method": "PATCH",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/levels/:id", "host": ["{{api_v1}}"], "path": ["education","levels",":id"], "variable": [{ "key": "id", "value": "LEVEL_CUID" }] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Class 10 (SSC) Updated\",\n  \"is_active\": true\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Update a level.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "Delete Level",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/levels/:id", "host": ["{{api_v1}}"], "path": ["education","levels",":id"], "variable": [{ "key": "id", "value": "LEVEL_CUID" }] },
                "description": "Delete a level.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            }
          ]
        },

        {
          "name": "Subject Categories",
          "item": [
            {
              "name": "Create Subject Category",
              "request": {
                "method": "POST",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/subject-categories", "host": ["{{api_v1}}"], "path": ["education","subject-categories"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Science\"\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Create a subject category (e.g. Science, Arts).\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "List Subject Categories",
              "request": {
                "method": "GET",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/subject-categories", "host": ["{{api_v1}}"], "path": ["education","subject-categories"] },
                "description": "List all subject categories.\nPublic endpoint."
              }
            },
            {
              "name": "Update Subject Category",
              "request": {
                "method": "PATCH",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/subject-categories/:id", "host": ["{{api_v1}}"], "path": ["education","subject-categories",":id"], "variable": [{ "key": "id", "value": "CATEGORY_CUID" }] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Science Updated\",\n  \"is_active\": true\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Update a subject category.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "Delete Subject Category",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/subject-categories/:id", "host": ["{{api_v1}}"], "path": ["education","subject-categories",":id"], "variable": [{ "key": "id", "value": "CATEGORY_CUID" }] },
                "description": "Delete a subject category.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            }
          ]
        },

        {
          "name": "Subjects",
          "item": [
            {
              "name": "Create Subject",
              "request": {
                "method": "POST",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/subjects", "host": ["{{api_v1}}"], "path": ["education","subjects"] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"category_id\": \"CATEGORY_CUID\",\n  \"name\": \"Physics\"\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Create a subject under a category.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "List Subjects",
              "request": {
                "method": "GET",
                "header": [],
                "url": {
                  "raw": "{{api_v1}}/education/subjects?category_id=CATEGORY_CUID",
                  "host": ["{{api_v1}}"],
                  "path": ["education","subjects"],
                  "query": [
                    { "key": "category_id", "value": "CATEGORY_CUID", "description": "Optional filter" }
                  ]
                },
                "description": "List all subjects. Filter by category_id.\nPublic endpoint."
              }
            },
            {
              "name": "Update Subject",
              "request": {
                "method": "PATCH",
                "header": [{ "key": "Content-Type", "value": "application/json" }],
                "url": { "raw": "{{api_v1}}/education/subjects/:id", "host": ["{{api_v1}}"], "path": ["education","subjects",":id"], "variable": [{ "key": "id", "value": "SUBJECT_CUID" }] },
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Advanced Physics\",\n  \"is_active\": true\n}",
                  "options": { "raw": { "language": "json" } }
                },
                "description": "Update a subject.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            },
            {
              "name": "Delete Subject",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": { "raw": "{{api_v1}}/education/subjects/:id", "host": ["{{api_v1}}"], "path": ["education","subjects",":id"], "variable": [{ "key": "id", "value": "SUBJECT_CUID" }] },
                "description": "Delete a subject.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
              }
            }
          ]
        }

      ]
    },

    {
      "name": "💳 Subscription Packages",
      "description": "Admin-managed subscription packages (Free, Basic, Pro).\nPrefix: /api/v1/subscription",
      "item": [

        {
          "name": "Create Package",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/packages", "host": ["{{api_v1}}"], "path": ["subscription","packages"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Pro\",\n  \"slug\": \"pro\",\n  \"description\": \"For professional teachers\",\n  \"price_monthly\": 500,\n  \"price_yearly\": 5000,\n  \"currency\": \"BDT\",\n  \"max_services\": 4,\n  \"max_batches_per_service\": 10,\n  \"can_use_analytics\": true,\n  \"is_featured\": true,\n  \"badge_label\": \"Most Popular\",\n  \"sort_order\": 2\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Create a new subscription package.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "List Packages",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/subscription/packages", "host": ["{{api_v1}}"], "path": ["subscription","packages"] },
            "description": "List all active packages with features.\nPublic endpoint — used for pricing page."
          }
        },

        {
          "name": "Get Package By ID",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/subscription/packages/:id", "host": ["{{api_v1}}"], "path": ["subscription","packages",":id"], "variable": [{ "key": "id", "value": "PACKAGE_CUID" }] },
            "description": "Get a single package with features list."
          }
        },

        {
          "name": "Update Package",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/packages/:id", "host": ["{{api_v1}}"], "path": ["subscription","packages",":id"], "variable": [{ "key": "id", "value": "PACKAGE_CUID" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"price_monthly\": 600,\n  \"is_featured\": false,\n  \"status\": \"ACTIVE\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Update a package. Existing subscribers unaffected (snapshot protects them).\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "Archive Package",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/packages/:id/archive", "host": ["{{api_v1}}"], "path": ["subscription","packages",":id","archive"], "variable": [{ "key": "id", "value": "PACKAGE_CUID" }] },
            "body": {
              "mode": "raw",
              "raw": "{}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Archive a package. No new purchases allowed, existing subscribers keep access.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "Add Package Feature",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/packages/:id/features", "host": ["{{api_v1}}"], "path": ["subscription","packages",":id","features"], "variable": [{ "key": "id", "value": "PACKAGE_CUID" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"label\": \"Up to 4 active services\",\n  \"is_included\": true,\n  \"sort_order\": 1\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Add a feature bullet to a package (shown on pricing page).\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "Delete Package Feature",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": { "raw": "{{api_v1}}/subscription/packages/:id/features/:featureId", "host": ["{{api_v1}}"], "path": ["subscription","packages",":id","features",":featureId"], "variable": [{ "key": "id", "value": "PACKAGE_CUID" }, { "key": "featureId", "value": "FEATURE_CUID" }] },
            "description": "Remove a feature bullet from a package.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "Get My Subscription",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/subscription/me", "host": ["{{api_v1}}"], "path": ["subscription","me"] },
            "description": "Get the currently authenticated user's active subscription.\n\n🔒 Requires: user cookie"
          }
        },

        {
          "name": "Get My Subscription History",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/subscription/me/history", "host": ["{{api_v1}}"], "path": ["subscription","me","history"] },
            "description": "Get full subscription history of the authenticated user.\n\n🔒 Requires: user cookie"
          }
        },

        {
          "name": "Subscribe to Package (Manual Payment)",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/subscribe", "host": ["{{api_v1}}"], "path": ["subscription","subscribe"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"package_id\": \"PACKAGE_CUID\",\n  \"billing_cycle\": \"MONTHLY\",\n  \"payment_method\": \"BKASH\",\n  \"transaction_id\": \"TXN123456\",\n  \"amount_paid\": 500\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Submit a subscription request with manual payment info.\nAdmin reviews and approves.\n\n🔒 Requires: user cookie (TEACHER)\n\n**billing_cycle:** MONTHLY | QUARTERLY | YEARLY | LIFETIME"
          }
        },

        {
          "name": "[Admin] Grant Subscription",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/admin/grant", "host": ["{{api_v1}}"], "path": ["subscription","admin","grant"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"user_id\": \"USER_CUID\",\n  \"package_id\": \"PACKAGE_CUID\",\n  \"billing_cycle\": \"YEARLY\",\n  \"expires_at\": \"2026-12-31T00:00:00.000Z\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Admin manually grants a subscription to a user.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        },

        {
          "name": "[Admin] Revoke Subscription",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/subscription/admin/revoke/:userId", "host": ["{{api_v1}}"], "path": ["subscription","admin","revoke",":userId"], "variable": [{ "key": "userId", "value": "USER_CUID" }] },
            "body": {
              "mode": "raw",
              "raw": "{}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Admin revokes a user's active subscription.\n\n🔒 Requires: SUPER_ADMIN | ADMIN"
          }
        }

      ]
    },

    {
      "name": "☁️ Upload",
      "description": "Cloudinary file upload endpoints.\nPrefix: /api/v1/upload\n\nAll uploads require authentication.",
      "item": [

        {
          "name": "Upload Avatar",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/avatar", "host": ["{{api_v1}}"], "path": ["upload","avatar"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "avatar", "value": "", "type": "file", "description": "Required. jpg/png/webp. Max 2MB" }
              ]
            },
            "description": "Upload user avatar to Cloudinary.\n\n🔒 Requires: user cookie\n\n**Field:** `avatar`\n**Types:** jpg/png/webp\n**Max:** 2MB\n\n**Returns:** { url, public_id }"
          }
        },

        {
          "name": "Upload Post Media",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/post-media", "host": ["{{api_v1}}"], "path": ["upload","post-media"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "media", "value": "", "type": "file", "description": "Max 5 files. jpg/png/webp/pdf. Max 5MB each" }
              ]
            },
            "description": "Upload post images or documents.\n\n🔒 Requires: user cookie\n\n**Field:** `media` (up to 5 files)\n**Types:** jpg/png/webp/pdf\n**Max per file:** 5MB\n\n**Returns:** [{ url, public_id }]"
          }
        },

        {
          "name": "Upload Payment Screenshot",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/payment-screenshot", "host": ["{{api_v1}}"], "path": ["upload","payment-screenshot"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "screenshot", "value": "", "type": "file", "description": "Required. jpg/png/webp. Max 3MB" }
              ]
            },
            "description": "Upload payment proof screenshot.\n\n🔒 Requires: user cookie\n\n**Field:** `screenshot` (required, 1 file)\n**Types:** jpg/png/webp\n**Max:** 3MB"
          }
        },

        {
          "name": "Upload Service Cover",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/service-cover", "host": ["{{api_v1}}"], "path": ["upload","service-cover"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "cover", "value": "", "type": "file", "description": "Required. jpg/png/webp. Max 3MB" }
              ]
            },
            "description": "Upload service cover image.\n\n🔒 Requires: user cookie + TEACHER role\n\n**Field:** `cover`\n**Types:** jpg/png/webp\n**Max:** 3MB"
          }
        },

        {
          "name": "Upload Message Media",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/message-media", "host": ["{{api_v1}}"], "path": ["upload","message-media"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "media", "value": "", "type": "file", "description": "Max 3 files. jpg/png/webp/pdf/doc/docx. Max 10MB each" }
              ]
            },
            "description": "Upload files to attach in messages.\n\n🔒 Requires: user cookie\n\n**Field:** `media` (up to 3 files)\n**Types:** jpg/png/webp/pdf/doc/docx\n**Max per file:** 10MB"
          }
        },

        {
          "name": "Upload Task Attachment",
          "request": {
            "method": "POST",
            "header": [],
            "url": { "raw": "{{api_v1}}/upload/task-attachment", "host": ["{{api_v1}}"], "path": ["upload","task-attachment"] },
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "attachment", "value": "", "type": "file", "description": "Max 3 files. jpg/png/webp/pdf/doc/docx. Max 10MB each" }
              ]
            },
            "description": "Upload attachments for a task.\n\n🔒 Requires: user cookie + TEACHER role\n\n**Field:** `attachment` (up to 3 files)\n**Types:** jpg/png/webp/pdf/doc/docx\n**Max per file:** 10MB"
          }
        }

      ]
    },

    {
      "name": "👨‍🏫 Guardian ↔ Student",
      "description": "Guardian and student linking system.\nPrefix: /api/v1/guardian",
      "item": [

        {
          "name": "Send Link Request",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/guardian/link-request", "host": ["{{api_v1}}"], "path": ["guardian","link-request"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"target_user_id\": \"USER_CUID\",\n  \"relation_label\": \"Father\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Send a link request.\n- Guardian sends to student\n- Student sends to guardian\nMutual acceptance required.\n\n🔒 Requires: user cookie (GUARDIAN or STUDENT)"
          }
        },

        {
          "name": "Respond to Link Request",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{api_v1}}/guardian/link-request/:id/respond", "host": ["{{api_v1}}"], "path": ["guardian","link-request",":id","respond"], "variable": [{ "key": "id", "value": "LINK_REQUEST_CUID" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"action\": \"ACCEPT\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "description": "Accept or reject a link request.\n\n🔒 Requires: user cookie\n\n**action:** ACCEPT | REJECT"
          }
        },

        {
          "name": "Get My Links",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "{{api_v1}}/guardian/links", "host": ["{{api_v1}}"], "path": ["guardian","links"] },
            "description": "Get all active guardian-student links for the authenticated user.\n\n🔒 Requires: user cookie (GUARDIAN or STUDENT)"
          }
        },

        {
          "name": "Remove Link",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": { "raw": "{{api_v1}}/guardian/links/:id", "host": ["{{api_v1}}"], "path": ["guardian","links",":id"], "variable": [{ "key": "id", "value": "LINK_CUID" }] },
            "description": "Remove a guardian-student link.\n\n🔒 Requires: user cookie (either party)"
          }
        }

      ]
    }

  ]
}