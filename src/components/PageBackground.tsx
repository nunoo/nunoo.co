export function PageBackground() {
  return (
    <>
      {/* Full Page Background Grid */}
      <div className='pointer-events-none fixed inset-0 animate-pulse-slow bg-cyber-grid bg-grid opacity-20' />

      {/* Gradient Overlay */}
      <div className='pointer-events-none fixed inset-0 bg-gradient-to-br from-transparent via-blue-50/30 to-purple-50/20 dark:from-transparent dark:via-blue-950/20 dark:to-purple-950/10' />
    </>
  );
}
