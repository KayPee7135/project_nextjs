import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { signIn } from 'next-auth/react';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['jobseeker', 'recruiter'], {
    required_error: 'Please select a role',
  }),
});

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('/api/auth/signup', data);
      if (response.data.success) {
        // Sign in the user after successful registration
        const signInResponse = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (signInResponse?.ok) {
          // Redirect to dashboard after successful registration
          router.push('/dashboard');
        } else {
          setError('Failed to sign in after registration');
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred during sign up');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input
                {...register('name')}
                id="name"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black text-black rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black text-black focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                {...register('password')}
                id="password"
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black text-black focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                {...register('role')}
                id="role"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-black placeholder-black text-black rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your role</option>
                <option value="jobseeker">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 