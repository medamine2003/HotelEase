const Footer = () => {
  return (
    <footer 
      className="text-center py-3"
      style={{
        backgroundColor: '#1E293B',
        color: '#FFFFFF',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000
      }}
    >
      <div className="container">
        <p className="mb-0">
          © 2025 Hotelease - Votre meilleur outil de gestion interne
        </p>
      </div>
    </footer>
  );
};

export default Footer;