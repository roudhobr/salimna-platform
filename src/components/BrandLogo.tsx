type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <img
      src="/logo-salimna.png"
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      className={`shrink-0 rounded-full object-contain ${className}`}
    />
  );
}
