# SaudeMAX Role-Based Access Matrix

This document provides a comprehensive overview of the role-based access control (RBAC) system implemented in the SaudeMAX platform.

## Role Definitions

| Role | Description | Primary Responsibilities |
|------|-------------|--------------------------|
| **Admin** | System administrators | Full system management, user administration, billing oversight |
| **Advisor** | Healthcare advisors | Member support, share request review, member assignment |
| **Member** | Regular platform users | Manage profile, submit share requests, view documents |
| **Affiliate** | Marketing partners | Track referrals, manage commissions, withdrawal requests |

## Access Control Matrix

The following matrix shows which roles have access to which resources and what operations they can perform:

| Resource | Admin | Advisor | Member | Affiliate | Anonymous |
|----------|-------|---------|--------|-----------|-----------|
| **member_profiles** | CRUD | Read (assigned) | Read/Update (own) | No access | No access |
| **member_dependents** | CRUD | Read (assigned) | CRUD (own) | No access | No access |
| **documents** | CRUD | Read (assigned) | Read (own) | No access | No access |
| **share_requests** | CRUD | Read/Update (assigned) | CRUD (own) | No access | No access |
| **share_request_documents** | CRUD | Read (assigned) | CRUD (own) | No access | No access |
| **billing_records** | CRUD | Read (assigned) | Read (own) | No access | No access |
| **payment_methods** | CRUD | No access | CRUD (own) | No access | No access |
| **support_tickets** | CRUD | CRUD (assigned) | CRUD (own) | No access | No access |
| **support_messages** | CRUD | CRUD (assigned) | CRUD (own) | No access | No access |
| **notification_preferences** | CRUD | No access | CRUD (own) | No access | No access |
| **affiliates** | CRUD | No access | No access | Read/Update (own) | Read (active only) |
| **affiliate_visits** | CRUD | No access | No access | Read (own) | Create |
| **affiliate_referrals** | CRUD | No access | No access | Read (own) | No access |
| **affiliate_withdrawals** | CRUD | No access | No access | CRUD (own) | No access |
| **users** | CRUD | Read (assigned) | Read/Update (own) | Read/Update (own) | No access |
| **roles** | CRUD | Read (own) | Read (own) | Read (own) | No access |
| **role_permissions** | CRUD | Read (own role) | Read (own role) | Read (own role) | No access |

## Permission Definitions

- **C** - Create: Can create new records
- **R** - Read: Can view records
- **U** - Update: Can modify existing records
- **D** - Delete: Can delete records
- **(own)** - Limited to records owned by or associated with the user
- **(assigned)** - Limited to records assigned to the user
- **(active only)** - Limited to records with 'active' status

## Implementation Details

### Row-Level Security (RLS) Policies

Row-Level Security is implemented at the database level using Postgres RLS policies. These policies ensure that users can only access data they are authorized to see, regardless of the application logic.

Example RLS policy for member profiles:

```sql
-- Members can only read their own profile
CREATE POLICY "Members can read own profile"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Advisors can read profiles assigned to them
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (advisor_id = auth.uid() OR has_role('advisor'));

-- Admins can do anything with any profile
CREATE POLICY "Admins can access all member profiles"
  ON member_profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin'));
```

### Role Assignment

Roles are assigned to users through the `roles` table, which maps user IDs to specific roles. When a user is created, they are automatically assigned the 'member' role by default.

Admins can change user roles through the admin dashboard, which calls the `assign_role` function:

```sql
SELECT assign_role('user-uuid', 'admin');
```

### Permission Checking

The application uses two main functions to check permissions:

1. `has_role(required_role)` - Checks if the current user has a specific role
2. `has_permission(resource, action)` - Checks if the current user has permission to perform an action on a resource

These functions are used in both RLS policies and application logic to enforce access control.

## Frontend Implementation

On the frontend, the application uses React context providers to manage authentication and permissions:

1. `AuthProvider` - Manages user authentication state
2. `AffiliateSecurityProvider` - Manages affiliate-specific permissions
3. `RoleBasedContent` component - Conditionally renders content based on user roles and permissions

Example usage:

```jsx
<RoleBasedContent 
  allowedRoles={['admin', 'advisor']} 
  resource="share_requests" 
  permission="write"
>
  <Button>Approve Request</Button>
</RoleBasedContent>
```

## Security Considerations

1. **JWT Claims**: User roles are stored in JWT claims (app_metadata) for secure frontend validation
2. **Server-Side Validation**: All permissions are enforced at the database level through RLS
3. **No User Metadata**: Policies use app_metadata (server-controlled) instead of user_metadata (user-editable)
4. **Principle of Least Privilege**: Users only have access to what they need
5. **Data Isolation**: Strict separation between different users' data