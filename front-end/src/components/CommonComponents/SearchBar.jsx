import { useState, useCallback, useMemo } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FaSearch, FaRedo } from 'react-icons/fa';
/**
 * Composant SearchBar réutilisable pour différents types de données
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.searchTerm - Terme de recherche actuel
 * @param {Function} props.onSearchChange - Callback appelé lors du changement de recherche
 * @param {string} props.placeholder - Texte du placeholder pour le champ de recherche
 * @param {Array} props.filters - Configuration des filtres additionnels
 * @param {Object} props.filterValues - Valeurs actuelles des filtres
 * @param {Function} props.onFilterChange - Callback appelé lors du changement de filtre
 * @param {Function} props.onReset - Callback appelé lors du reset
 * @param {string} props.searchIcon - Icône pour le champ de recherche (défaut: 🔍)
 * @param {string} props.resetText - Texte du bouton reset (défaut: Reset)
 * @param {string} props.className - Classes CSS additionnelles
 * @param {boolean} props.showReset - Afficher ou non le bouton reset (défaut: true)
 */
function SearchBar({
  searchTerm = '',
  onSearchChange,
  placeholder = 'Rechercher...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  searchIcon = <FaSearch />,
  resetText = <><FaRedo className="me-1" />Reset</>,
  className = '',
  showReset = true,
  ariaLabel = 'Barre de recherche et filtres'
}) {
  // État interne pour gérer les changements en temps réel
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);

  // Debounce pour optimiser les performances de recherche
  const handleSearchChange = useCallback((value) => {
    setInternalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  }, [onSearchChange]);

  // Gestion du changement de filtre
  const handleFilterChange = useCallback((filterKey, value) => {
    if (onFilterChange) {
      onFilterChange(filterKey, value);
    }
  }, [onFilterChange]);

  // Gestion du reset
  const handleReset = useCallback(() => {
    setInternalSearchTerm('');
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = useMemo(() => {
    return searchTerm || Object.values(filterValues).some(value => value && value !== '');
  }, [searchTerm, filterValues]);

  // Calculer la disposition des colonnes selon le nombre de filtres
  const getColumnConfig = useMemo(() => {
    const totalElements = 1 + filters.length + (showReset ? 1 : 0); // recherche + filtres + reset
    
    if (totalElements <= 2) {
      return { search: 8, filter: 4, reset: 12 };
    } else if (totalElements <= 3) {
      return { search: 6, filter: 3, reset: 3 };
    } else if (totalElements <= 4) {
      return { search: 4, filter: 3, reset: 2 };
    } else {
      return { search: 3, filter: 2, reset: 2 };
    }
  }, [filters.length, showReset]);

  return (
    <section 
      aria-label={ariaLabel}
      className={`search-bar-section ${className}`}
    >
      <h2 className="visually-hidden">Recherche et filtres</h2>
      
      <Row className="mb-4">
        {/* Champ de recherche principal */}
        <Col md={getColumnConfig.search}>
          <InputGroup>
            <InputGroup.Text aria-hidden="true">{searchIcon}</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder={placeholder}
              value={internalSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label={placeholder}
            />
          </InputGroup>
        </Col>

        {/* Filtres dynamiques */}
        {filters.map((filter, index) => (
          <Col 
            key={filter.key} 
            md={getColumnConfig.filter}
            className={filters.length > 3 && index >= 2 ? 'mt-2 mt-md-0' : ''}
          >
            {filter.type === 'select' ? (
              <Form.Select
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                aria-label={filter.ariaLabel || `Filtrer par ${filter.label}`}
              >
                <option value="">{filter.defaultOption || `Tous les ${filter.label}`}</option>
                {filter.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            ) : filter.type === 'date' ? (
              <Form.Control
                type="date"
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                aria-label={filter.ariaLabel || `Filtrer par ${filter.label}`}
                placeholder={filter.placeholder}
              />
            ) : filter.type === 'number' ? (
              <Form.Control
                type="number"
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                aria-label={filter.ariaLabel || `Filtrer par ${filter.label}`}
                placeholder={filter.placeholder}
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
            ) : (
              // Type text par défaut
              <Form.Control
                type="text"
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                aria-label={filter.ariaLabel || `Filtrer par ${filter.label}`}
                placeholder={filter.placeholder}
              />
            )}
          </Col>
        ))}

        {/* Bouton de reset */}
        {showReset && (
          <Col md={getColumnConfig.reset} className={filters.length > 2 ? 'mt-2 mt-md-0' : ''}>
            <Button 
              variant={hasActiveFilters ? "outline-warning" : "outline-secondary"}
              onClick={handleReset}
              aria-label="Réinitialiser la recherche et les filtres"
              className="w-100"
              disabled={!hasActiveFilters}
            >
              {resetText}
            </Button>
          </Col>
        )}
      </Row>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && (
        <div className="mb-2" role="status" aria-live="polite">
          <small className="text-muted">
            {searchTerm && `Recherche: "${searchTerm}"`}
            {searchTerm && Object.values(filterValues).some(v => v) && ' • '}
            {Object.entries(filterValues)
              .filter(([_, value]) => value && value !== '')
              .map(([key, value]) => {
                const filter = filters.find(f => f.key === key);
                const label = filter?.options?.find(opt => opt.value === value)?.label || value;
                return `${filter?.label || key}: ${label}`;
              })
              .join(' • ')
            }
          </small>
        </div>
      )}
    </section>
  );
}

export default SearchBar;

// ===== EXEMPLES D'UTILISATION =====

/**
 * Exemple pour la liste des clients
 */
export const CustomerSearchExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});

  const customerFilters = [
    {
      key: 'hasPhone',
      type: 'select',
      label: 'Téléphone',
      defaultOption: 'Tous',
      ariaLabel: 'Filtrer par présence de téléphone',
      options: [
        { value: 'yes', label: 'Avec téléphone' },
        { value: 'no', label: 'Sans téléphone' }
      ]
    },
    {
      key: 'hasAddress',
      type: 'select',
      label: 'Adresse',
      defaultOption: 'Tous',
      ariaLabel: 'Filtrer par présence d\'adresse',
      options: [
        { value: 'yes', label: 'Avec adresse' },
        { value: 'no', label: 'Sans adresse' }
      ]
    }
  ];

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterValues({});
  };

  return (
    <SearchBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      placeholder="Rechercher par nom, prénom, téléphone ou adresse..."
      filters={customerFilters}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
      ariaLabel="Recherche et filtres pour les clients"
    />
  );
};

