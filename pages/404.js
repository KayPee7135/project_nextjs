import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16">
      <h1 className="text-6xl font-bold mb-4 text-blue-600">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="mb-6 text-black">Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Go Home</Link>
    </div>
  );
}