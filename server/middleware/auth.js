import { supabase, isLiveSupabase, inMemoryDb } from '../config/supabase.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      // Default to demo session if testing without token
      req.user = inMemoryDb.currentDemoUser;
      return next();
    }

    // Support demo/test/student tokens in both live and demo mode
    if (
      token.startsWith('user-') ||
      token.startsWith('demo-') ||
      token.startsWith('student-') ||
      token.startsWith('stu-') ||
      token === 'admin' ||
      token === 'student'
    ) {
      const matched = inMemoryDb.profiles.find(
        (p) => p.id === token || p.role === token || p.email.toLowerCase() === token.toLowerCase()
      );
      if (matched) {
        req.user = matched;
        return next();
      }
    }

    if (isLiveSupabase) {
      // First check if token is a direct profile UUID or ID
      const { data: directProfile } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${token},email.eq.${token}`)
        .maybeSingle();

      if (directProfile) {
        req.user = directProfile;
        return next();
      }

      // Validate with real Supabase Auth session JWT
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        // Fallback to inMemory match if exists
        const matched = inMemoryDb.profiles.find(
          (p) => p.id === token || p.role === token || p.email.toLowerCase() === token.toLowerCase()
        );
        if (matched) {
          req.user = matched;
          return next();
        }
        return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
      }

      // Fetch user profile from PostgreSQL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Fallback profile if record not yet synced
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'student',
          full_name: user.user_metadata?.full_name || 'Library User',
        };
      } else {
        req.user = profile;
      }
      return next();
    } else {
      // Demo / offline mode
      const matched = inMemoryDb.profiles.find(p => p.id === token || p.role === token || p.email === token);
      req.user = matched || inMemoryDb.currentDemoUser;
      return next();
    }
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin', 'librarian']);
export const requireStudent = requireRole(['student']);
