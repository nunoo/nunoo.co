import Link from 'next/link';
import clsx from 'clsx';

const variantStyles = {
  primary:
    'bg-gradient-to-r from-zinc-800 to-zinc-900 font-semibold text-zinc-100 hover:from-zinc-700 hover:to-zinc-800 active:from-zinc-800 active:to-zinc-900 active:text-zinc-100/70 dark:from-zinc-700 dark:to-zinc-800 dark:hover:from-zinc-600 dark:hover:to-zinc-700 dark:active:from-zinc-700 dark:active:to-zinc-800 dark:active:text-zinc-100/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
  secondary:
    'bg-white/80 backdrop-blur-sm font-medium text-zinc-900 hover:bg-white active:bg-zinc-100 active:text-zinc-900/60 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:active:bg-zinc-800/50 dark:active:text-zinc-50/70 border border-zinc-200/50 dark:border-zinc-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105',
};

type ButtonProps = {
  variant?: keyof typeof variantStyles;
} & (
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
  | React.ComponentPropsWithoutRef<typeof Link>
);

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  className = clsx(
    'inline-flex items-center gap-2 justify-center rounded-xl py-3 px-4 text-sm outline-offset-2 transition-all duration-300 active:transition-none',
    variantStyles[variant],
    className
  );

  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : (
    <Link className={className} {...props} />
  );
}
