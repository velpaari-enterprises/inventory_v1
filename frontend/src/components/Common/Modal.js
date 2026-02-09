import React, { useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
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

// Styled Components
const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: #fff;
  animation: ${fadeIn} 0.5s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(to right, #4a6fa5, #2c3e50);
  color: white;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  background: ${props => props.primary ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: none;
  border-radius: 6px;
  color: white;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  ${props => props.download && css`
    background: rgba(46, 204, 113, 0.3);
    
    &:hover {
      background: rgba(46, 204, 113, 0.5);
    }
  `}
`;

const PageControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.1);
  padding: 5px 15px;
  border-radius: 20px;
`;

const PageInput = styled.input`
  width: 50px;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  padding: 4px;
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const PDFContainer = styled.div`
  position: relative;
  height: 500px;
  overflow: hidden;
  background: #f0f3f5;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PDFFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  transition: opacity 0.3s ease;
  opacity: ${props => props.loading ? 0 : 1};
`;

const LoadingSpinner = styled.div`
  position: absolute;
  width: 50px;
  height: 50px;
  border: 5px solid rgba(74, 111, 165, 0.2);
  border-radius: 50%;
  border-top-color: #4a6fa5;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #e74c3c;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.3s ease-out;
`;

const ZoomButton = styled.button`
  background: #4a6fa5;
  border: none;
  border-radius: 6px;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a5a80;
    animation: ${pulse} 0.5s ease;
  }
`;

const FullscreenButton = styled(IconButton)`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.6);
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const PDFViewer = ({ src }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const iframeRef = useRef(null);

  const handleLoad = () => {
    setLoading(false);
    // In a real implementation, you would extract page count from the PDF
    // This is a placeholder for demonstration
    setTotalPages(10);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load the PDF document.');
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePageChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const enterFullscreen = () => {
    const iframe = iframeRef.current;
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  };

  // Construct the PDF URL with page and zoom parameters
  const constructPDFUrl = () => {
    // This is a simplified example - actual implementation may vary
    // based on your PDF viewer backend
    return `${src}#page=${currentPage}&zoom=${zoomLevel * 100}`;
  };

  return (
    <ViewerContainer>
      <Toolbar>
        <ButtonGroup>
          <IconButton onClick={goToPreviousPage} disabled={currentPage <= 1}>
            ← Previous
          </IconButton>
          <IconButton onClick={goToNextPage} disabled={currentPage >= totalPages}>
            Next →
          </IconButton>
        </ButtonGroup>
        
        <PageControls>
          <span>Page</span>
          <PageInput 
            type="number" 
            value={currentPage} 
            onChange={handlePageChange}
            min="1"
            max={totalPages}
          />
          <span>of {totalPages || '--'}</span>
        </PageControls>
        
        <ButtonGroup>
          <IconButton download onClick={() => window.open(src, '_blank')}>
            Download
          </IconButton>
        </ButtonGroup>
      </Toolbar>
      
      <PDFContainer>
        {loading && <LoadingSpinner />}
        {error ? (
          <ErrorMessage>
            <h3>Error Loading Document</h3>
            <p>{error}</p>
          </ErrorMessage>
        ) : (
          <>
            <PDFFrame
              ref={iframeRef}
              src={constructPDFUrl()}
              title="PDF Viewer"
              loading={loading}
              onLoad={handleLoad}
              onError={handleError}
            />
            <ZoomControls>
              <ZoomButton onClick={zoomIn} title="Zoom In">+</ZoomButton>
              <ZoomButton onClick={resetZoom} title="Reset Zoom">•</ZoomButton>
              <ZoomButton onClick={zoomOut} title="Zoom Out">-</ZoomButton>
            </ZoomControls>
            <FullscreenButton onClick={enterFullscreen} title="Fullscreen">
              ⛶
            </FullscreenButton>
          </>
        )}
      </PDFContainer>
    </ViewerContainer>
  );
};

export default PDFViewer;