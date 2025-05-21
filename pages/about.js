import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-black hover:text-white-3xl font-bold mb-4">About InternMate</h1>
      <p className="text-black hover:text-whitemb-4">InternMate is a modern job and internship board platform connecting jobseekers, students, recruiters, and companies. Our mission is to make finding opportunities and talent easier, faster, and more secure for everyone.</p>
      <p>For questions, visit our <Link href="/contact/" className="text-blue-600 hover:text-blue-800">Contact</Link> page.</p>
    </div>
  );
} 