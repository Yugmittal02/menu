const SystemConfig = require('../models/SystemConfig');

const DEFAULT_MODULES = {
  payments: { status: 'active', message: '' },
  inventory: { status: 'active', message: '' },
  coupons: { status: 'active', message: '' },
  reservations: { status: 'active', message: '' },
  crm: { status: 'active', message: '' },
  kot: { status: 'active', message: '' }
};

// 1. Get module statuses (Public / Cafe / Admin)
exports.getModuleStatuses = async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ configKey: 'global_system_modules' });
    if (!config) {
      config = await SystemConfig.create({
        configKey: 'global_system_modules',
        modules: DEFAULT_MODULES
      });
    }

    res.json({
      success: true,
      modules: config.modules || DEFAULT_MODULES
    });
  } catch (error) {
    console.error('Error fetching system module statuses:', error);
    // Fallback safely to all active so UI never breaks
    res.json({
      success: true,
      modules: DEFAULT_MODULES
    });
  }
};

// 2. Update module statuses (SuperAdmin only)
exports.updateModuleStatuses = async (req, res) => {
  try {
    const { modules } = req.body;
    if (!modules || typeof modules !== 'object') {
      return res.status(400).json({ message: 'Modules configuration object is required' });
    }

    const validStatuses = ['active', 'maintenance', 'soon', 'disabled'];

    let config = await SystemConfig.findOne({ configKey: 'global_system_modules' });
    if (!config) {
      config = new SystemConfig({
        configKey: 'global_system_modules',
        modules: DEFAULT_MODULES
      });
    }

    for (const [key, val] of Object.entries(modules)) {
      if (['payments', 'inventory', 'coupons', 'reservations', 'crm', 'kot'].includes(key)) {
        const current = config.modules[key] || { status: 'active', message: '' };
        if (val.status && validStatuses.includes(val.status)) {
          current.status = val.status;
        }
        if (typeof val.message === 'string') {
          current.message = val.message;
        }
        current.updatedAt = new Date();
        config.modules[key] = current;
      }
    }

    config.updatedBy = req.user?.id || req.user?._id || null;
    config.markModified('modules');
    await config.save();

    res.json({
      success: true,
      message: 'System module statuses updated successfully',
      modules: config.modules
    });
  } catch (error) {
    console.error('Error updating system module statuses:', error);
    res.status(500).json({ message: 'Server error updating system config' });
  }
};
