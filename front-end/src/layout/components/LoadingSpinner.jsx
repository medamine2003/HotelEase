function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div className="text-center my-4">
      <div 
        className="spinner-border spinner-hotel" 
        role="status" 
        aria-label={message}
      >
        <span className="visually-hidden">{message}</span>
      </div>
      <p className="text-hotel-secondary mt-2">{message}</p>
    </div>
  );
}

export default LoadingSpinner;