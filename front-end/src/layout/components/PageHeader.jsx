function PageHeader({ title, children, subtitle }) {
  return (
    <header className="header-hotel">
      <div className="container">
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h2 mb-0">{title}</h1>
            {subtitle && (
              <p className="mb-0 mt-1 opacity-75">{subtitle}</p>
            )}
          </div>
          {children && (
            <div className="col-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;