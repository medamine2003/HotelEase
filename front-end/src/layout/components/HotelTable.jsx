function HotelTable({ children, className = "", ...props }) {
  return (
    <div className="table-responsive">
      <table 
        className={`table table-striped table-hover table-hotel ${className}`} 
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export default HotelTable;