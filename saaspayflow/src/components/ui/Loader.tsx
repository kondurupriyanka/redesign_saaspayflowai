interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

export const Loader = ({ 
  size = 'md', 
  color = 'primary',
  text,
  fullScreen = false
}: LoaderProps) => {
  const sizeMap = {
    sm: 'w-10 aspect-square',
    md: 'w-16 aspect-square',
    lg: 'w-20 aspect-square'
  };

  const colorMap = {
    primary: 'shadow-primary',
    white: 'shadow-white',
    gray: 'shadow-muted-foreground'
  };

  const loaderContent = (
    <div className={`relative ${sizeMap[size]}`}>
      <span className={`absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_3px] ${colorMap[color]}`} />
      <span className={`absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_3px] ${colorMap[color]}`} />
      <style>{`
        @keyframes loaderAnim {
          0% {
            inset: 0 35px 35px 0;
          }
          12.5% {
            inset: 0 35px 0 0;
          }
          25% {
            inset: 35px 35px 0 0;
          }
          37.5% {
            inset: 35px 0 0 0;
          }
          50% {
            inset: 35px 0 0 35px;
          }
          62.5% {
            inset: 0 0 0 35px;
          }
          75% {
            inset: 0 0 35px 35px;
          }
          87.5% {
            inset: 0 0 35px 0;
          }
          100% {
            inset: 0 35px 35px 0;
          }
        }
        .animate-loaderAnim {
          animation: loaderAnim 2.5s infinite;
        }
        .animation-delay {
          animation-delay: -1.25s;
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-50 gap-4">
        {loaderContent}
        {text && (
          <p className="text-sm text-muted-foreground font-medium">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {loaderContent}
      {text && (
        <p className="text-sm text-muted-foreground font-medium">{text}</p>
      )}
    </div>
  );
};
