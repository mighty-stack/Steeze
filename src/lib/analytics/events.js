export const ANALYTICS_ROUTES = [
  '/',
  '/login',
  '/register/brand',
  '/register/creator',
  '/registered',
  '/verify-email',
  '/resend-verification',
  '/forgot-password',
  '/reset-password',
  '/app',
  '/app/profile',
  '/app/resources',
  '/app/resources/orders/:orderNumber',
  '/app/creators',
  '/app/creators/:id',
  '/app/collaborations',
  '/app/opportunities',
  '/app/opportunities/:id/interests',
  '/app/about',
  '/app/score',
  '/app/notifications',
  '/app/training',
  '/app/training/classes',
  '/app/training/classes/:id',
  '/app/training/updates',
  '/admin',
  '/admin/registrations',
  '/admin/access-codes',
  '/admin/resources',
  '/admin/options',
  '/admin/opportunities',
  '/admin/opportunities/:id/interests',
  '/admin/admins',
  '/admin/training',
  '/admin/collaborations',
  '/admin/creator-email',
  '/admin/notifications',
  '/unknown',
];

export const ANALYTICS_EVENTS = Object.freeze({
  page_view: ['route'],
  cta_click: ['id'],
  reg_step_view: ['flow', 'step'],
  reg_step_complete: ['flow', 'step'],
  reg_field_error: ['flow', 'step', 'field', 'code'],
  reg_submit: ['flow', 'ok'],
  access_code_check: ['ok'],
  login_attempt: ['ok'],
  search_used: ['surface', 'hasQuery', 'filters'],
  filter_applied: ['surface', 'filter'],
  opportunity_view: ['id'],
  resource_view: ['id'],
  cart_add: ['id'],
  checkout_start: [],
  notification_open: ['type'],
  client_error: ['hash', 'route', 'msg'],
  web_vital: ['name', 'bucket', 'route'],
});

const enums = {
  cta_click: { id: ['brand_register', 'creator_register', 'login', 'opportunities', 'resources', 'creators'] },
  reg_step_view: { flow: ['brand', 'creator'], step: ['1', '2', '3'] },
  reg_step_complete: { flow: ['brand', 'creator'], step: ['1', '2', '3'] },
  reg_field_error: {
    flow: ['brand', 'creator'],
    step: ['1', '2', '3'],
    code: ['required', 'invalid', 'too_short', 'too_long', 'duplicate', 'server'],
  },
  search_used: { surface: ['directory', 'opportunities', 'resources'] },
  web_vital: { name: ['LCP', 'CLS', 'INP'], bucket: ['good', 'ni', 'poor'] },
};

const safeId = (value) => typeof value === 'string' && value.length > 0 && value.length <= 80 && /^[A-Za-z0-9:_-]+$/.test(value);
const validRoute = (value) => ANALYTICS_ROUTES.includes(value);

function noIdentifyingText(value) {
  return typeof value === 'string'
    && value.length <= 160
    && !/@|https?:\/\/|www\.|[a-f0-9]{32,}|[A-Za-z0-9_-]{48,}/i.test(value);
}

export function isValidAnalyticsEvent(name, props) {
  const keys = ANALYTICS_EVENTS[name];
  if (!keys || !props || typeof props !== 'object' || Array.isArray(props)) return false;
  if (Object.keys(props).some((key) => !keys.includes(key))) return false;
  if (keys.some((key) => !(key in props))) return false;
  for (const [key, choices] of Object.entries(enums[name] || {})) {
    if (!choices.includes(props[key])) return false;
  }
  if (name === 'page_view' || name === 'client_error' || name === 'web_vital') {
    if (!validRoute(props.route)) return false;
  }
  if (['opportunity_view', 'resource_view', 'cart_add', 'filter_applied', 'notification_open'].includes(name)) {
    const field = name === 'filter_applied' ? 'filter' : name === 'notification_open' ? 'type' : 'id';
    if (!safeId(props[field])) return false;
  }
  if (name === 'reg_field_error') {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(props.field) || props.field.length > 40) return false;
  }
  if (name === 'filter_applied' && !['directory', 'opportunities', 'resources'].includes(props.surface)) return false;
  if (['reg_step_view', 'reg_step_complete'].includes(name) && !['brand', 'creator'].includes(props.flow)) return false;
  if (['reg_step_view', 'reg_step_complete', 'reg_field_error'].includes(name) && !['1', '2', '3'].includes(props.step)) return false;
  if (name === 'reg_submit' && (!['brand', 'creator'].includes(props.flow) || typeof props.ok !== 'boolean')) return false;
  if (['access_code_check', 'login_attempt'].includes(name) && typeof props.ok !== 'boolean') return false;
  if (name === 'search_used') return typeof props.hasQuery === 'boolean' && Number.isInteger(props.filters) && props.filters >= 0 && props.filters <= 30;
  if (name === 'reg_submit' || name === 'access_code_check' || name === 'login_attempt') return typeof props.ok === 'boolean';
  if (name === 'client_error') return /^[a-f0-9]{8,32}$/.test(props.hash) && noIdentifyingText(props.msg);
  return true;
}
