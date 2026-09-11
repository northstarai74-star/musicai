export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 border-t-4 border-pink-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">DesiSwagTunes</h3>
            <p className="text-purple-600 text-sm font-light">Your gateway to Desi music, Hindi, Punjabi & English tracks.</p>
          </div>
          <div>
            <h4 className="text-purple-700 font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-purple-600">
              <li><a href="#" className="hover:text-purple-900 transition">Features</a></li>
              <li><a href="#" className="hover:text-purple-900 transition">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-purple-700 font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-purple-600">
              <li><a href="#" className="hover:text-purple-900 transition">About</a></li>
              <li><a href="#" className="hover:text-purple-900 transition">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-purple-700 font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-purple-600">
              <li><a href="#" className="hover:text-purple-900 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-purple-900 transition">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-pink-400 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-purple-600 text-sm font-light">© 2024 DesiSwagTunes. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-purple-600 hover:text-purple-900 transition">Twitter</a>
            <a href="#" className="text-purple-600 hover:text-purple-900 transition">Instagram</a>
            <a href="#" className="text-purple-600 hover:text-purple-900 transition">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
