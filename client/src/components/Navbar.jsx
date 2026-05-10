/**
 * Navbar Component
 * 
 * Fixed top navigation with glassmorphism effect.
 * Shows brand, nav links, and auth state.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, Trophy, Map as MapIcon, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar({ user, profile }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🏖️</span>
          <span className="font-display text-xl font-bold gradient-text tracking-tight">
            GoaSports
          </span>
        </Link>

        {/* Nav Links */}
        {user && (
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive('/')
                  ? 'bg-goa-ocean/15 text-goa-ocean'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              to="/map"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive('/map')
                  ? 'bg-goa-ocean/15 text-goa-ocean'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <MapIcon size={16} />
              <span className="hidden sm:inline">Map</span>
            </Link>

            <Link
              to="/upload-tournament"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive('/upload-tournament')
                  ? 'bg-orange-500/15 text-orange-500'
                  : 'text-text-secondary hover:text-orange-500 hover:bg-surface-hover'
              }`}
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Upload Flyer</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive('/profile')
                  ? 'bg-goa-ocean/15 text-goa-ocean'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <User size={16} />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            {/* Skill badge */}
            {profile?.skill_rating && (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-goa-sun/15 text-goa-sun text-xs font-semibold ml-2">
                <Trophy size={12} />
                ELO: {profile.skill_rating}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-goa-coral hover:bg-goa-coral/10 transition-colors ml-1 bg-transparent border-none cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
