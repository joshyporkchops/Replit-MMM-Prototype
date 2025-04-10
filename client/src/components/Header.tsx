export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3v18h14V3H5zm12 16H7V5h10v14z"/>
            <path d="M9 8h6v2H9zm0 4h6v2H9zm0 4h6v2H9z"/>
          </svg>
          <span className="ml-2 text-xl font-semibold text-neutral-dark">MediaMixModel</span>
        </div>
        <div>
          <button className="text-neutral-dark hover:text-primary transition px-3 py-1">
            Help
          </button>
        </div>
      </div>
    </header>
  );
}
