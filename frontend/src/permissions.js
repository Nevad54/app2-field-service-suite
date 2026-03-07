const FRONTEND_ROLE_PERMISSIONS = Object.freeze({
  admin: ['*'],
  manager: [
    'customers.manage',
    'jobs.manage',
    'dispatch.manage',
    'projects.manage',
    'tasks.manage',
    'notifications.manage',
    'technicians.manage',
    'inventory.manage',
    'equipment.manage',
    'quotes.manage',
    'recurring.manage',
    'invoices.manage',
    'exports.view',
  ],
  dispatcher: [
    'customers.manage',
    'jobs.manage',
    'dispatch.manage',
    'projects.manage',
    'tasks.manage',
    'notifications.manage',
    'technicians.manage',
    'inventory.manage',
    'equipment.manage',
    'quotes.manage',
    'recurring.manage',
    'invoices.manage',
    'exports.view',
  ],
  technician: [
    'jobs.execute.own',
    'worklog.edit.own',
    'customer_updates.send.own',
  ],
  client: [
    'client.portal',
  ],
});

const hasFrontendPermission = (user, permission) => {
  if (!permission) return true;
  if (Array.isArray(user?.permissions) && user.permissions.length > 0) {
    return user.permissions.includes('*') || user.permissions.includes(permission);
  }
  const role = String(user?.role || '').toLowerCase();
  const allowed = FRONTEND_ROLE_PERMISSIONS[role] || [];
  return allowed.includes('*') || allowed.includes(permission);
};

const capabilityTooltip = (permission) => {
  if (!permission) return '';
  return `Requires capability: ${permission}`;
};

export { FRONTEND_ROLE_PERMISSIONS, hasFrontendPermission, capabilityTooltip };
