/**
 * BottomNav — Mobile Bottom Navigation Bar
 * 
 * Stitch-style bottom navigation with Dashboard, Map, Wallet, Profile tabs.
 * Uses Material Symbols icons and active pill state.
 */
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/map', icon: 'map', label: 'Map' },
  { path: '/upload-tournament', icon: 'qr_code_scanner', label: 'Scanner' },
  { path: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-[1rem] bg-white shadow-[0_-4px_12px_rgba(0,108,73,0.05)] md:hidden">
      <div className="flex justify-around items-center px-4 pb-5 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center no-underline transition-all active:translate-y-0.5 duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5'
                  : 'text-on-surface-variant hover:bg-surface-high p-1.5 rounded-lg'
              }`}
            >
              <span className="material-symbols-outlined mb-0.5 text-[22px]">{item.icon}</span>
              <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
