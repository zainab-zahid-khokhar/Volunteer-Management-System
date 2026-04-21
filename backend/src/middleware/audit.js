const db = require('../db');
const logger = require('../utils/logger');

const auditLog = (action, resourceType) => async (req, res, next) => {
  // Capture response to get resource_id after creation
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && req.user) {
      const resourceId = body?.data?.id || req.params?.id || null;
      db('audit_logs')
        .insert({
          user_id: req.user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: { method: req.method, path: req.path, body: req.body },
        })
        .catch((err) => logger.error('Audit log insert failed:', err));
    }
    return originalJson(body);
  };
  next();
};

module.exports = { auditLog };
