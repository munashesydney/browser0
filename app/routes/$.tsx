import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  
  // Handle Chrome DevTools requests
  if (url.pathname.includes('.well-known/appspecific/com.chrome.devtools.json')) {
    return json({
      message: "Chrome DevTools discovery endpoint",
      status: "not_available"
    }, { status: 404 });
  }
  
  // Handle other 404s
  return json({
    message: "Page not found",
    path: url.pathname
  }, { status: 404 });
};

export default function CatchAll() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-8">Page not found</p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
} 