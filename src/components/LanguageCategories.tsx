export default function LanguageCategories() {
  const languages = [
    { name: 'Hindi', color: 'bg-gray-900', songs: 120 },
    { name: 'Punjabi', color: 'bg-gray-900', songs: 85 },
    { name: 'English', color: 'bg-gray-900', songs: 150 },
  ];

  return (
    <section className="py-16 bg-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-3 tracking-tight text-white">
            Browse by Language
          </h2>
          <p className="text-gray-400 text-base font-medium tracking-wide">Discover music in your favorite language</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className={`${lang.color} rounded p-6 h-56 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition transform hover:scale-105 border border-gray-800`}>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">{lang.name}</h3>
                <p className="text-sm text-gray-400">{lang.songs} songs</p>
              </div>
              <button className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded font-semibold transition w-fit">
                Explore
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
