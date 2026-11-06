export const AuthBrandHeader = ({ title, subtitle }) => (
  <div className="mb-5 text-center">
    <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
      {title}
    </h1>
    {subtitle && <p className="mt-1 text-xs sm:text-sm text-ink-500">{subtitle}</p>}
  </div>
);

export default AuthBrandHeader;
