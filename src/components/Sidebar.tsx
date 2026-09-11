type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems: { label: string; page: PageType; icon: string }[] = [
    { label: 'Home', page: 'home', icon: '🏠' },
    { label: 'Search', page: 'search', icon: '🔍' },
    { label: 'Likes', page: 'likes', icon: '❤️' },
    { label: 'Library', page: 'library', icon: '📚' },
    { label: 'Premium', page: 'premium', icon: '⭐' },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 border-r-4 border-gradient-to-b from-pink-300 to-purple-300 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-wide uppercase">Menu</h2>
        <div className="w-8 h-px bg-gradient-to-r from-pink-400 to-purple-400"></div>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onPageChange(item.page)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${
              currentPage === item.page
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                : 'text-purple-700 hover:text-purple-900 hover:bg-pink-200'
            }`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>


    </aside>
  );
}
