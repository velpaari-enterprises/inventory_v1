import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-8px);}
  60% {transform: translateY(-4px);}
`;

const progressBar = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const zoomIn = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PageTitle = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
  position: relative;
  padding-bottom: 0.5rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(to right, #3498db);
    border-radius: 2px;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const AlertMessage = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  animation: ${slideIn} 0.3s ease-out;
  
  ${props => props.variant === 'success' && css`
    background: rgba(46, 204, 113, 0.15);
    color: #27ae60;
    border-left: 4px solid #27ae60;
  `}
  
  ${props => props.variant === 'danger' && css`
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border-left: 4px solid #e74c3c;
  `}
`;

const CloseAlert = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: linear-gradient(to right, #3498db);
    color: white;
  }
  
  th {
    padding: 1.2rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  tbody tr {
    border-bottom: 1px solid #f1f2f6;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 1rem;
    color: #2c3e50;
  }
  
  /* Make S.No column narrower */
  th:first-child, td:first-child {
    width: 60px;
    text-align: center;
  }
  
  @media (max-width: 1200px) {
    th:nth-child(5),
    td:nth-child(5) {
      display: none;
    }
  }
  
  @media (max-width: 992px) {
    th:nth-child(4),
    td:nth-child(4) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    th:nth-child(7),
    td:nth-child(7) {
      display: none;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => {
    switch(props.variant) {
      case 'critical': return css`
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        animation: ${pulse} 2s infinite;
      `;
      case 'low': return css`
        background: rgba(241, 196, 15, 0.15);
        color: #f39c12;
      `;
      case 'good': return css`
        background: rgba(46, 204, 113, 0.15);
        color: #27ae60;
      `;
      default: return css`
        background: #f1f2f6;
        color: #7f8c8d;
      `;
    }
  }}
`;

const StockIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #f1f2f6;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  
  ${props => {
    const percentage = (props.current / props.max) * 100;
    
    if (percentage <= 20) return css`
      background: #e74c3c;
      width: ${percentage}%;
    `;
    if (percentage <= 50) return css`
      background: #f39c12;
      width: ${percentage}%;
    `;
    return css`
      background: #2ecc71;
      width: ${percentage}%;
    `;
  }}
`;

const ActionCell = styled.td`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const IconButton = styled.button`
  background: ${props => props.variant === 'edit' 
    ? 'rgba(52, 152, 219, 0.1)' 
    : 'rgba(231, 76, 60, 0.1)'};
  color: ${props => props.variant === 'edit' 
    ? '#3498db' 
    : '#e74c3c'};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.variant === 'edit' 
      ? 'rgba(52, 152, 219, 0.2)' 
      : 'rgba(231, 76, 60, 0.2)'};
    transform: translateY(-2px);
    animation: ${bounce} 0.8s ease;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    color: #bdc3c7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f1f2f6;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f1f2f6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const SecondaryButton = styled.button`
  background: #f1f2f6;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e4e6eb;
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
`;

const ImagePreview = styled.div`
  margin-top: 0.5rem;
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    border: 2px solid #f1f2f6;
  }
`;

const RemoveImageButton = styled.button`
  margin-top: 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #c0392b;
  }
`;

const DownloadButton = styled.a`
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(46, 204, 113, 0.2);
    transform: translateY(-2px);
  }
`;

// Image Preview Modal Styles
const ImagePreviewModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ImagePreviewContainer = styled.div`
  max-width: 90vw;
  max-height: 90vh;
  animation: ${zoomIn} 0.3s ease-out;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
`;

const ClosePreviewButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

// Custom checkbox styling
const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
  position: relative;
  border-radius: 4px;
  
  &:checked {
    background-color: #3498db;
  }
  
  &:hover {
    transform: scale(1.1);
  }
`;

// Batch actions styling
const BatchActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  background: rgba(52, 152, 219, 0.1);
  padding: 1rem;
  border-radius: 8px;
  align-items: center;
  animation: ${slideIn} 0.3s ease-out;
`;

const BatchActionButton = styled(ActionButton)`
  ${props => props.variant === 'download' && css`
    background: linear-gradient(to right, #27ae60, #2ecc71);
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
    }
  `}
  
  ${props => props.variant === 'delete' && css`
    background: linear-gradient(to right, #e74c3c, #c0392b);
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
    }
  `}
`;

const SelectionCounter = styled.span`
  color: #2c3e50;
  font-weight: 500;
  animation: ${pulse} 1s;
`;

// Barcode search input styling
const BarcodeSearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

const BarcodeSearchInput = styled(Input)`
  padding-left: 2.5rem;
  background-color: #f8f9fa;
  border: 2px solid #f1f2f6;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const SearchIcon = styled.i`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #3498db;
`;

const ClearIcon = styled.i`
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  cursor: pointer;
  
  &:hover {
    color: #e74c3c;
  }
`;

// Scanner styled components
const scannerFlash = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

const ScannerContainer = styled.div`
  width: 100%;
  height: 250px;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid #00ff00;
    border-radius: 10px;
    animation: ${scannerFlash} 2s ease-in-out infinite;
    pointer-events: none;
  }
`;

const ScannerButton = styled.button`
  border-radius: 20px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  
  ${props => props.$active ? css`
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%);
      transform: translateY(-2px);
    }
  ` : css`
    background: linear-gradient(to right, #3498db);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    
    &:hover {
      background: linear-gradient(to right, #3498db);
      transform: translateY(-2px);
    }
  `}
`;

const ScannerStatus = styled.div`
  padding: 1rem;
  border-radius: 10px;
  background: ${props => props.$active ? '#48bb78' : '#e53e3e'};
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 600;
`;

// Global style for spin animation
const GlobalStyle = styled.div`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
`;

// Export all styled components
export {
  fadeIn,
  slideIn,
  pulse,
  bounce,
  progressBar,
  zoomIn,
  spin,
  scannerFlash,
  PageContainer,
  PageHeader,
  PageTitle,
  ActionButton,
  AlertMessage,
  CloseAlert,
  TableContainer,
  StyledTable,
  StatusBadge,
  StockIndicator,
  ProgressBar,
  ProgressFill,
  ActionCell,
  IconButton,
  EmptyState,
  LoadingSpinner,
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalBody,
  FormGrid,
  FormGroup,
  Label,
  Input,
  TextArea,
  Select,
  ModalFooter,
  SecondaryButton,
  PrimaryButton,
  ImagePreview,
  RemoveImageButton,
  DownloadButton,
  ImagePreviewModal,
  ImagePreviewContainer,
  PreviewImage,
  ClosePreviewButton,
  Checkbox,
  BatchActionsContainer,
  BatchActionButton,
  SelectionCounter,
  BarcodeSearchContainer,
  BarcodeSearchInput,
  SearchIcon,
  ClearIcon,
  ScannerContainer,
  ScannerButton,
  ScannerStatus,
  GlobalStyle
};
