/**
 * Navbar Component — Stitch Coastal Pulse Design
 * 
 * Fixed top navigation with frosted glass effect.
 * Left: user avatar, Center: ArenaLink brand, Right: notification bell + logout.
 * Notifications dropdown shows recent bookings and match updates.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function Navbar({ user, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Fetch recent notifications (bookings + wallet transactions)
  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifs(true);

    try {
      // Fetch recent bookings with match info
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, matches(sport, location, match_time)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent wallet transactions
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const notifs = [];

      // Map bookings to notifications
      if (bookings) {
        bookings.forEach((b) => {
          const match = b.matches;
          const statusIcons = {
            confirmed: { icon: 'check_circle', color: 'text-primary', label: 'Booking Confirmed' },
            waitlisted: { icon: 'schedule', color: 'text-tertiary', label: 'Added to Waitlist' },
            cancelled: { icon: 'cancel', color: 'text-error', label: 'Booking Cancelled' },
          };
          const st = statusIcons[b.status] || statusIcons.confirmed;

          notifs.push({
            id: `b-${b.id}`,
            icon: st.icon,
            color: st.color,
            title: st.label,
            detail: match ? `${match.sport} at ${match.location}` : 'Match',
            time: b.created_at,
            link: b.match_id ? `/match/${b.match_id}` : null,
          });
        });
      }

      // Map transactions to notifications
      if (transactions) {
        transactions.forEach((t) => {
          notifs.push({
            id: `t-${t.id}`,
            icon: t.type === 'credit' ? 'arrow_downward' : 'arrow_upward',
            color: t.type === 'credit' ? 'text-primary' : 'text-tertiary',
            title: t.type === 'credit' ? `₹${t.amount} Credited` : `₹${t.amount} Debited`,
            detail: t.description || 'Wallet transaction',
            time: t.created_at,
            link: '/profile',
          });
        });
      }

      // Sort by time descending
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(notifs.slice(0, 12));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Player';
  const avatarUrl = profile?.avatar_url;
  
  const isDashboard = location.pathname === '/';

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return format(new Date(dateStr), 'MMM d');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-12 py-2 max-w-[1280px] mx-auto h-[72px]">
        {/* Left: Avatar or Back Button */}
        <div className="flex items-center gap-3 w-12">
          {!isDashboard ? (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer border-none"
              title="Go Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <Link to="/profile" className="no-underline">
              <div className="w-10 h-10 rounded-full bg-surface-highest overflow-hidden border-2 border-primary/20 shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-on-primary-container font-bold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Center: Brand */}
        <Link to="/" className="no-underline">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-primary tracking-tight">
            ArenaLink
          </h1>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-low transition-colors cursor-pointer bg-transparent border-none relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {notifications.length > 0 && !showNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 max-h-[420px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-outline-variant z-[60] animate-in">
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                <h3 className="font-display font-semibold text-on-surface text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
                  Notifications
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-high text-on-surface-variant transition-colors cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Content */}
              {loadingNotifs ? (
                <div className="flex items-center justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-primary text-[24px]">progress_activity</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">notifications_off</span>
                  <p className="text-on-surface-variant text-sm">No recent activity</p>
                  <p className="text-outline text-xs mt-1">Book a match to get started!</p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (notif.link) {
                          navigate(notif.link);
                          setShowNotifications(false);
                        }
                      }}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-low transition-colors ${notif.link ? 'cursor-pointer' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-[20px] mt-0.5 ${notif.color}`}>
                        {notif.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{notif.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">{notif.detail}</p>
                      </div>
                      <span className="text-[10px] text-outline whitespace-nowrap mt-1">
                        {formatTimeAgo(notif.time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-outline-variant px-4 py-2">
                <Link
                  to="/profile"
                  className="text-primary text-xs font-semibold no-underline hover:underline flex items-center justify-center gap-1"
                  onClick={() => setShowNotifications(false)}
                >
                  View All Activity
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-low hover:text-error transition-colors cursor-pointer bg-transparent border-none"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
