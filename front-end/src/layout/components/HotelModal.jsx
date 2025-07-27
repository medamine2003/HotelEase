import Modal from 'react-bootstrap/Modal';

function HotelModal({ children, title, ...props }) {
  return (
    <Modal {...props}>
      {title && (
        <Modal.Header closeButton className="modal-header-hotel">
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}
      {children}
    </Modal>
  );
}

// Sous-composants pour faciliter l'utilisation
HotelModal.Body = Modal.Body;
HotelModal.Footer = Modal.Footer;

export default HotelModal;