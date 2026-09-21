import { songs } from '../data/songs';

type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
  favoritesCount: number;
}

const menuItems: { label: string; page: PageType; icon: string }[] = [
  { label: 'Home', page: 'home', icon: '🏠' },
  { label: 'Search', page: 'search', icon: '🔍' },
  { label: 'Likes', page: 'likes', icon: '❤️' },
  { label: 'Library', page: 'library', icon: '📚' },
  { label: 'Premium', page: 'premium', icon: '⭐' },
];

export default function Sidebar({
  currentPage,
  onPageChange,
  isOpen,
  onClose,
  favoritesCount,
}: SidebarProps) {
  const languages = ['Hindi', 'Punjabi', 'English'];

  const handleNavigate = (page: PageType) => {
    onPageChange(page);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-purple-900/30 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform overflow-y-auto border-r border-pink-300/70 bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 p-5 transition-transform duration-300 md:static md:z-auto md:h-full md:visible md:translate-x-0 ${
          isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}>
        {/* Brand — only in the drawer, the top bar owns it on desktop */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent">
            DesiSwagTunes
          </span>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-purple-600 transition hover:bg-pink-200 hover:text-purple-900"
            aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-500">Menu</h2>
          <div className="h-px w-8 bg-gradient-to-r from-pink-400 to-purple-400" />
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-purple-700 hover:bg-pink-200 hover:text-purple-900'
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.page === 'likes' && favoritesCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-pink-300/70 text-purple-800'
                    }`}>
                    {favoritesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-500">Languages</h2>
          <div className="mb-3 h-px w-8 bg-gradient-to-r from-pink-400 to-purple-400" />
          <ul className="space-y-1">
            {languages.map((language) => (
              <li key={language}>
                <button
                  onClick={() => handleNavigate('library')}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-purple-700 transition hover:bg-pink-200 hover:text-purple-900">
                  <span>{language}</span>
                  <span className="text-xs text-purple-500">
                    {songs.filter((s) => s.language === language).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-xl border border-pink-300 bg-white/50 p-4">
          <p className="text-sm font-semibold text-purple-900">Go Premium</p>
          <p className="mt-1 text-xs text-purple-600">Ad-free listening and offline downloads.</p>
          <button
            onClick={() => handleNavigate('premium')}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white transition hover:shadow-md">
            Upgrade
          </button>
        </div>
      </aside>
    </>
  );
}
