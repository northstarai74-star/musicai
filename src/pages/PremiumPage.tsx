export default function PremiumPage() {
  const plans = [
    {
      name: 'Free',
      price: 'Free',
      features: [
        'Ad-supported listening',
        'Standard audio quality',
        'Browse and search',
        'Create playlists',
        '30-second skip limit',
      ],
    },
    {
      name: 'Premium',
      price: '$9.99/month',
      features: [
        'Ad-free listening',
        'High audio quality',
        'Download for offline',
        'Unlimited skips',
        'Priority support',
        'Early access to new features',
      ],
      isPopular: true,
    },
    {
      name: 'Family',
      price: '$14.99/month',
      features: [
        'Up to 6 accounts',
        'Ad-free listening',
        'High audio quality',
        'Download for offline',
        'Parental controls',
        'Family mix playlist',
      ],
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
              Upgrade to Premium
            </span>
          </h1>
          <p className="text-purple-600 text-xl max-w-2xl mx-auto">
            Get unlimited access to all your favorite music with DesiSwagTunes Premium
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all transform hover:scale-105 ${
                plan.isPopular
                  ? 'bg-gradient-to-br from-pink-300 to-purple-300 ring-2 ring-pink-500 shadow-2xl'
                  : 'bg-gradient-to-br from-pink-100 to-purple-100 border border-purple-200'
              }`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.isPopular ? 'text-purple-900' : 'text-purple-800'}`}>
                {plan.name}
              </h3>
              <p className={`text-3xl font-black mb-6 ${plan.isPopular ? 'text-purple-900' : 'text-purple-700'}`}>
                {plan.price}
              </p>

              <ul className={`space-y-3 mb-8 ${plan.isPopular ? 'text-purple-900' : 'text-purple-700'}`}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className={`text-xl ${plan.isPopular ? '✓' : '✓'}`}></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-bold transition transform hover:scale-105 ${
                  plan.isPopular
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500'
                }`}>
                {plan === plans[0] ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 border border-purple-300 rounded-2xl p-12">
          <h2 className="text-3xl font-black mb-8">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
              Why Choose Premium?
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">High Quality Audio</h3>
                <p className="text-purple-700">
                  Experience your favorite songs in crystal clear quality with high bitrate streaming.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Download & Listen Offline</h3>
                <p className="text-purple-700">
                  Take your music anywhere. Download songs and enjoy them without internet connection.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">No Ads</h3>
                <p className="text-purple-700">
                  Enjoy uninterrupted music. No ads means pure music enjoyment without distractions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Priority Support</h3>
                <p className="text-purple-700">
                  Get priority access to our support team for quick resolution of any issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12">
          <p className="text-purple-600 mb-6">Have questions? Check our FAQ or contact support.</p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-full hover:from-pink-500 hover:to-rose-500 transition transform hover:scale-105 shadow-md">
              FAQ
            </button>
            <button className="px-8 py-3 border-2 border-purple-400 text-purple-600 font-bold rounded-full hover:bg-purple-200 hover:text-purple-800 transition">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
