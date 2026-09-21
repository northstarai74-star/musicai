type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

interface MobileNavProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  favoritesCount: number;
}

const tabs: { label: string; page: PageType; icon: string }[] = [
  { label: 'Home', page: 'home', icon: '🏠' },
  { label: 'Search', page: 'search', icon: '🔍' },
  { label: 'Likes', page: 'likes', icon: '❤️' },
  { label: 'Library', page: 'library', icon: '📚' },
  { label: 'Premium', page: 'premium', icon: '⭐' },
];

export default function MobileNav({ currentPage, onPageChange, favoritesCount }: MobileNavProps) {
  return (
    <nav className="z-20 flex shrink-0 items-stretch border-t border-pink-300/70 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 md:hidden">
      {tabs.map((tab) => {
        const isActive = currentPage === tab.page;
        return (
          <button
            key={tab.page}
            onClick={() => onPageChange(tab.page)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              isActive ? 'text-purple-900' : 'text-purple-600'
            }`}>
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.page === 'likes' && favoritesCount > 0 && (
              <span className="absolute right-1/2 top-1 translate-x-4 rounded-full bg-pink-500 px-1.5 text-[10px] font-semibold text-white">
                {favoritesCount}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
