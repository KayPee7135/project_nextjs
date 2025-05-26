import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState({
    keyword: '',
    location: '',
    type: 'all'
  });

  // Add debug logging
  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(searchQuery).toString();
    router.push(`/jobs?${queryString}`);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!session) {
      router.push('/auth/signin?callbackUrl=/jobs/new');
      return;
    }
    
    if (session.user.roles?.includes('recruiter')) {
      router.push('/jobs/new');
    } else {
      router.push('/auth/signup?role=recruiter');
    }
  };

  // Wait for session to load
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
       {/* Hero Section */}
       <div className="relative w-full h-[420px] flex items-center justify-center bg-gray-200">
        <Image
          src="/images/hero-image.jpg"
          alt="Students collaborating in a modern workspace"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 flex flex-col items-start justify-center h-full w-full max-w-4xl px-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            Find Your Dream Internship or Hire Top Talent
          </h1>
          <p className="text-lg md:text-xl text-white mb-8 max-w-2xl drop-shadow-lg">
            Join thousands of jobseekers and recruiters in one place. Whether you&apos;re looking for your next opportunity or searching for the perfect candidate, we&apos;ve got you covered.
          </p>
          <div className="flex gap-4">
            {status === 'authenticated' ? (
              <Link href="/listed-jobs" className="px-6 py-3 rounded-lg bg-white text-blue-600 font-semibold text-lg shadow hover:bg-blue-50 transition">
                Find Jobs
              </Link>
            ) : (
              <Link href="/auth/signup?role=jobseeker" className="px-6 py-3 rounded-lg bg-white text-blue-600 font-semibold text-lg shadow hover:bg-blue-50 transition">
                Find Jobs
              </Link>
            )}
            {status === 'authenticated' && session?.user?.roles?.includes('recruiter') ? (
              <Link
                href="/jobs/new"
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition"
              >
                Post a Job
              </Link>
            ) : (
              <Link
                href="/auth/signup?role=recruiter"
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition"
              >
                Post a Job
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-black sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-black">
            Simple steps to get started with InternMate
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* For Jobseekers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-black">For Jobseekers</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">1</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Sign up & create your profile
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">2</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Browse jobs & internships
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">3</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Apply with 1 click
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">4</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Track your applications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* For Recruiters */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-black">For Recruiters</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">1</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Create a recruiter account
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">2</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Post job listings
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">3</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    View applicants & shortlist
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                      <span className="text-sm font-medium text-indigo-600">4</span>
                    </span>
                  </div>
                  <p className="ml-3 text-sm text-black">
                    Hire fast
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}