import { Button } from '@/components/Button'
import { SimpleLayout } from '@/components/SimpleLayout'
import Link from 'next/link'

export default function Login() {
  return (
    <SimpleLayout
      title="Sign in to your account"
      intro="Welcome back! Please sign in to continue."
    >
      <form className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 py-2 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 py-2 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 sm:text-sm"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-zinc-600 hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </div>

        <div className="text-center">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-zinc-600 hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Sign up
            </Link>
          </span>
        </div>
      </form>
    </SimpleLayout>
  )
}
