export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-600">Help</a>
            <a href="#" className="text-gray-500 hover:text-gray-600">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-600">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-600">Contact</a>
          </div>
          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-right text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} MediaMixModel. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
