import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { Button, Table, Modal, Form, ListGroup, Badge, Alert, Spinner, ToastContainer } from 'react-bootstrap';

// Print styles
const PrintStyles = createGlobalStyle`
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body * {
      visibility: hidden;
    }
    
    .modal, .modal * {
      visibility: visible;
    }
    
    .modal {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      background: white !important;
      transform: none !important;
      z-index: 1 !important;
    }
    
    .modal-dialog {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      transform: none !important;
    }
    
    .modal-content {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      height: auto !important;
      background: white !important;
      transform: none !important;
    }
    
    .modal-header, .modal-footer {
      display: none !important;
    }
    
    .modal-body {
      padding: 0 !important;
      background: white !important;
      margin: 0 !important;
      display: block !important;
      visibility: visible !important;
    }
    
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    table {
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    tr {
      page-break-inside: avoid;
    }
    
    h1, h2, h3 {
      page-break-after: avoid;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      display: block !important;
      visibility: visible !important;
    }
    
    /* Force colors to print */
    thead, thead th {
      background: #3498db !important;
      color: white !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-light {
      background: #f8f9fa !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Ensure proper spacing and layout */
    .invoice-container {
      max-width: 100% !important;
      width: 100% !important;
    }
  }
`;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const scannerFlash = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const AnimatedContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderSection = styled.div`
  background: white;
  height: 100px;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const StyledTable = styled(Table)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  
  thead {
    background: linear-gradient(to right, #3498db);
    color: white;
    th {
      background: linear-gradient(to right, #3498db);
      border: none;
      padding: 1.2rem;
      font-weight: 500;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
    background: linear-gradient(to right, #3498db);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    td {
      padding: 1.2rem;
      border-color: #e9ecef;
    }
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(to right, #3498db);
  border: none;
  border-radius: 25px;
  padding: 0.8rem 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    background: linear-gradient(to right, #3498db, #2ecc71);
  }
`;

const SecondaryButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid #667eea;
  color: #667eea;
  background: transparent;
  
  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
`;

const SuccessButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid #48bb78;
  color: #48bb78;
  background: transparent;
  
  &:hover {
    background: #48bb78;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  }
`;

const DangerButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    animation: ${pulse} 0.6s ease;
    background-color: #dc3545;
    border-color: #dc3545;
    color: white;
  }
`;

const ScannerButton = styled(Button)`
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

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 20px;
    border: none;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  
  .modal-header {
    background: linear-gradient(to right, #3498db);
    color: white;
    border-radius: 20px 20px 0 0;
    border: none;
    padding: 0.75rem 1rem;
    
    .btn-close {
      filter: invert(1);
    }
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 0.5rem 1rem;
    border-top: 1px solid #e9ecef;
  }
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

const FormGroup = styled(Form.Group)`
  margin-bottom: 1rem;
  
  .form-label {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }
  
  .form-control, .form-select {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    padding: 0.6rem;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
  }
`;

const ItemList = styled(ListGroup)`
  .list-group-item {
    border-radius: 10px;
    margin-bottom: 0.5rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f7fafc;
      transform: translateX(5px);
    }
  }
`;

const TotalDisplay = styled.h5`
        background: linear-gradient(to right, #3498db);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  text-align: center;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  font-weight: bold;
  animation: ${pulse} 2s infinite;
`;

const LoadingSpinner = styled(Spinner)`
  color: #667eea;
  width: 3rem;
  height: 3rem;
`;

const IconWrapper = styled.span`
  margin-right: 0.5rem;
`;

const BarcodeBadge = styled(Badge)`
        background: linear-gradient(to right, #3498db);
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10px;
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

const LowStockAlert = styled(Alert)`
  border-left: 4px solid #f56565;
  background-color: #fff5f5;
  color: #c53030;
  font-weight: 500;
  animation: ${pulse} 2s;
`;

// Invoice Styled Components
const InvoiceContainer = styled.div`
  background: white;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  line-height: 1.4;
  color: #333;
  font-size: 0.9rem;
  
  @media print {
    padding: 1rem !important;
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
    width: 100% !important;
    font-size: 12pt !important;
    line-height: 1.3 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    margin: 0 !important;
    
    /* Ensure all nested elements inherit print styles */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

const InvoiceHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  border-bottom: 3px solid #3498db;
  padding-bottom: 1rem;
  width: 100%;
  
  @media print {
    border-bottom: 3px solid #3498db !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin-bottom: 1rem !important;
    padding-bottom: 0.8rem !important;
    width: 100% !important;
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      display: block !important;
      visibility: visible !important;
    }
    
    div {
      display: flex !important;
      visibility: visible !important;
    }
  }
`;

const InvoiceDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media print {
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const InvoiceSection = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  
  @media print {
    background: #f8f9fa !important;
    padding: 0.8rem !important;
    border: 1px solid #e9ecef !important;
    border-radius: 6px !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  h3 {
    color: #3498db;
    margin-bottom: 0.8rem;
    font-size: 1rem;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.3rem;
    
    @media print {
      color: #3498db !important;
      font-size: 12pt !important;
      margin-bottom: 0.6rem !important;
      border-bottom: 2px solid #3498db !important;
      padding-bottom: 0.3rem !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
  
  p {
    margin: 0.3rem 0;
    font-size: 0.9rem;
    
    @media print {
      margin: 0.2rem 0 !important;
      font-size: 10pt !important;
      color: #333 !important;
    }
    
    strong {
      color: #333;
      display: inline-block;
      width: 70px;
      
      @media print {
        color: #333 !important;
        width: 60px !important;
      }
    }
  }
`;

const InvoiceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.85rem;
  
  @media print {
    margin: 1rem 0;
    box-shadow: none;
    font-size: 0.75rem;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
    border: 2px solid #333 !important;
  }
  
  thead {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    
    @media print {
      background: #3498db !important;
      color: white !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    th {
      padding: 0.8rem 0.6rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.8rem;
      border: none;
      
      @media print {
        padding: 0.6rem 0.4rem;
        font-size: 0.75rem;
        border: 1px solid #333 !important;
        background: #3498db !important;
        color: white !important;
      }
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid #e9ecef;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f8f9fa;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      @media print {
        &:hover {
          background-color: transparent !important;
        }
      }
    }
    
    td {
      padding: 0.6rem 0.4rem;
      border: 1px solid #dee2e6;
      font-size: 0.8rem;
      
      @media print {
        padding: 0.4rem 0.3rem;
        font-size: 0.75rem;
        border: 1px solid #333 !important;
      }
    }
  }
`;

const InvoiceSummary = styled.div`
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  
  @media print {
    margin-top: 1rem;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryTable = styled.table`
  border-collapse: collapse;
  min-width: 250px;
  font-size: 0.9rem;
  
  @media print {
    min-width: 200px;
    font-size: 0.8rem;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  
  tr {
    border-bottom: 1px solid #e9ecef;
    
    &:last-child {
      border-bottom: 3px solid #3498db;
      background: #f8f9fa;
      font-weight: bold;
      font-size: 1rem;
      
      @media print {
        font-size: 0.9rem;
        border-bottom: 3px solid #3498db !important;
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    @media print {
      border-bottom: 1px solid #333 !important;
    }
  }
  
  td {
    padding: 0.6rem 0.8rem;
    text-align: right;
    
    @media print {
      padding: 0.4rem 0.6rem;
      border: 1px solid #333 !important;
    }
    
    &:first-child {
      text-align: left;
      font-weight: 500;
    }
  }
`;

const InvoiceFooter = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
  color: #666;
  font-size: 0.85rem;
  
  @media print {
    margin-top: 1rem;
    padding-top: 1rem;
    font-size: 0.8rem;
  }
`;

const PrintButton = styled(Button)`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: none;
  padding: 0.8rem 2rem;
  font-weight: 600;
  border-radius: 25px;
  
  &:hover {
    background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  }
  
  @media print {
    display: none;
  }
`;

// Fixed TableRow component without inline animation
const TableRow = styled.tr`
  transition: all 0.3s ease;
  
  @media print {
    page-break-inside: avoid !important;
    transition: none !important;
    transform: none !important;
    box-shadow: none !important;
  }
  
  &:hover {
    background: linear-gradient(to right, #3498db);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    
    @media print {
      background: none !important;
      color: inherit !important;
      transform: none !important;
      box-shadow: none !important;
    }
  }
  
  &:nth-child(even) {
    @media print {
      background-color: #f8f9fa !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  
  td {
    padding: 1.2rem;
    border-color: #e9ecef;
    
    @media print {
      padding: 0.5rem !important;
      border-color: #e9ecef !important;
      color: #333 !important;
    }
  }
`;

// Toast Container for top-right notifications
const StyledToastContainer = styled(ToastContainer)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  
  .toast {
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    margin-bottom: 10px;
    
    &.bg-success {
      background: linear-gradient(135deg, #28a745, #20c997) !important;
      color: white;
    }
    
    &.bg-danger {
      background: linear-gradient(135deg, #dc3545, #e83e8c) !important;
      color: white;
    }
    
    &.bg-warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14) !important;
      color: #212529;
    }
    
    .toast-header {
      background: transparent;
      border: none;
      color: inherit;
      font-weight: 600;
      
      .btn-close {
        filter: ${props => props.variant === 'success' || props.variant === 'danger' ? 'invert(1)' : 'none'};
      }
    }
    
    .toast-body {
      font-weight: 500;
      padding: 0.75rem 1rem;
    }
  }
`;

// Export all styled components
export {
  PrintStyles,
  fadeIn,
  slideIn,
  pulse,
  scannerFlash,
  Container,
  AnimatedContainer,
  HeaderSection,
  StyledTable,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  ScannerButton,
  StyledModal,
  ScannerContainer,
  FormGroup,
  ItemList,
  TotalDisplay,
  LoadingSpinner,
  IconWrapper,
  BarcodeBadge,
  ScannerStatus,
  LowStockAlert,
  InvoiceContainer,
  InvoiceHeader,
  InvoiceDetails,
  InvoiceSection,
  InvoiceTable,
  InvoiceSummary,
  SummaryTable,
  InvoiceFooter,
  PrintButton,
  TableRow,
  StyledToastContainer
};
