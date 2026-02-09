import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Badge,
  Card,
  Spinner,
  Alert,
  Nav,
  Tab
} from 'react-bootstrap';
import styled from 'styled-components';
import CommonTable from '../components/CommonTable';
import { productsAPI, returnsAPI } from '../services/api';
import { socket } from '../services/socket';

const StyledContainer = styled(Container)`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const StatusBadgeStyled = styled(Badge)`
  padding: 0.5rem 0.8rem !important;
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  border-radius: 20px !important;
  display: inline-block;
`;

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [rtoProducts, setRTOProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('returns');
  const [error, setError] = useState('');
  const [returnFilter, setReturnFilter] = useState('all'); // 'all', 'RTO', 'RPU'

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      
      const returnsResponse = await returnsAPI.getAll();
      const returns = returnsResponse.data || [];
      
      // Convert returns to RTO tracking format
      const rtoTrackingData = returns.map(returnItem => ({
        _id: returnItem._id,
        name: returnItem.items?.[0]?.productName || 'Multiple Items',
        barcode: returnItem.items?.[0]?.barcode || 'N/A',
        rtoStatus: returnItem.category,
        rtoQuantity: returnItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        rtoReason: returnItem.reason,
        price: returnItem.totalAmount,
        rtoDate: returnItem.returnDate || returnItem.createdAt,
        customerName: returnItem.customerName,
        returnId: returnItem.returnId
      }));
      
      setReturns(returns);
      setRTOProducts(rtoTrackingData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to fetch returns data: ${error.message}`);
      setReturns([]);
      setRTOProducts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleReturnsChange = () => {
      fetchData(false);
    };

    socket.on('returns:changed', handleReturnsChange);

    return () => {
      socket.off('returns:changed', handleReturnsChange);
    };
  }, [fetchData]);
  
  const handleRefresh = () => {
    fetchData(false);
  };

  // Define table columns
  const returnColumns = [
    {
      key: 'returnId',
      header: 'Return ID',
      type: 'text'
    },
    {
      key: 'customerName',
      header: 'Customer',
      type: 'text'
    },
    {
      key: 'items',
      header: 'Items',
      type: 'badge',
      badgeConfig: {
        default: { bg: 'primary', text: 'items' }
      }
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      type: 'currency'
    },
    {
      key: 'reason',
      header: 'Reason',
      type: 'badge',
      badgeConfig: {
        warranty_claim: { bg: 'secondary', text: 'Warranty Claim' },
        defective: { bg: 'danger', text: 'Defective' },
        wrong_item: { bg: 'warning', text: 'Wrong Item' },
        other: { bg: 'info', text: 'Other' }
      }
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeConfig: {
        pending: { bg: 'warning', text: 'Pending' },
        processed: { bg: 'info', text: 'Processed' },
        approved: { bg: 'success', text: 'Approved' },
        rejected: { bg: 'danger', text: 'Rejected' }
      }
    },
    {
      key: 'returnDate',
      header: 'Return Date',
      type: 'date'
    },
    {
      key: 'category',
      header: 'Type',
      type: 'badge',
      badgeConfig: {
        RTO: { bg: 'warning', text: 'RTO' },
        RPU: { bg: 'info', text: 'RPU' }
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          icon: '✏️',
          variant: 'outline-info',
          onClick: (item) => console.log('Edit', item),
          title: 'Edit Return'
        },
        {
          icon: '🗑️',
          variant: 'outline-danger',
          onClick: (item) => console.log('Delete', item),
          title: 'Delete Return'
        }
      ]
    }
  ];

  const itemColumns = [
    {
      key: 'productId',
      header: 'Product ID',
      type: 'text'
    },
    {
      key: 'productName',
      header: 'Product Name',
      type: 'text'
    },
    {
      key: 'quantity',
      header: 'Quantity',
      type: 'text'
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      type: 'currency'
    },
    {
      key: 'total',
      header: 'Total',
      type: 'currency'
    }
  ];

  // Custom render function for returns table
  const renderReturnCell = (item, column) => {
    if (column.key === 'customerName') {
      return (
        <div>
          <strong>{item.customerName}</strong>
          {item.customerPhone && (
            <div>
              <small className="text-muted">{item.customerPhone}</small>
            </div>
          )}
        </div>
      );
    }
    
    if (column.key === 'items') {
      return <Badge bg="primary">{item.items?.length || 0} items</Badge>;
    }
    
    if (column.key === 'returnDate') {
      return new Date(item.returnDate).toLocaleDateString();
    }
    
    return null; // Use default rendering
  };

  if (loading) {
    return (
      <StyledContainer>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
          <Spinner animation="border" size="lg" />
        </div>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <HeaderSection>
        <Row className="align-items-center">
          <Col>
            <h2 className="mb-0 d-flex align-items-center">
              <span style={{ fontSize: '2rem', marginRight: '1rem' }}>↩️</span>
              Returns & Tracking
            </h2>
            <p className="text-muted mb-0 mt-2">Manage product returns, refunds, and RTO/RPU tracking</p>
          </Col>
          <Col xs="auto">
            <button 
              className="btn btn-outline-primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              {loading ? ' Refreshing...' : ' Refresh'}
            </button>
          </Col>
        </Row>
        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </Alert>
        )}
      </HeaderSection>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary mb-1">{returns.length}</h3>
              <small className="text-muted">Total Returns</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning mb-1">{returns.filter(r => r.category === 'RTO').length}</h3>
              <small className="text-muted">RTO Returns</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info mb-1">{returns.filter(r => r.category === 'RPU').length}</h3>
              <small className="text-muted">RPU Returns</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success mb-1">
                ₹{returns.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}
              </h3>
              <small className="text-muted">Total Value</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="pills" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="returns">
              <i className="bi bi-arrow-return-left me-2"></i>
              Returns ({returns.length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="tracking">
              <i className="bi bi-box-seam me-2"></i>
              RTO/RPU Tracking ({rtoProducts.length})
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="returns">
            {/* Return Filter Buttons */}
            <div className="mb-3">
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn ${returnFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setReturnFilter('all')}
                >
                  All Returns ({returns.length})
                </button>
                <button 
                  type="button" 
                  className={`btn ${returnFilter === 'RTO' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setReturnFilter('RTO')}
                >
                  RTO ({returns.filter(r => r.category === 'RTO').length})
                </button>
                <button 
                  type="button" 
                  className={`btn ${returnFilter === 'RPU' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setReturnFilter('RPU')}
                >
                  RPU ({returns.filter(r => r.category === 'RPU').length})
                </button>
              </div>
            </div>
            {returns.length === 0 ? (
              <Alert variant="info">
                <h5><i className="bi bi-info-circle"></i> No Returns Found</h5>
                <p>There are currently no product returns to display. Returns created from the Products page will appear here automatically.</p>
              </Alert>
            ) : (
              <Row>
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">Returns</h5>
                    </Card.Header>
                    <Card.Body>
                      <CommonTable
                        columns={returnColumns}
                        data={returns.filter(returnItem => 
                          returnFilter === 'all' || returnItem.category === returnFilter
                        )}
                        renderCell={renderReturnCell}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">Products</h5>
                    </Card.Header>
                    <Card.Body>
                      <CommonTable
                        columns={[
                          {
                            key: 'productId',
                            header: 'Product ID',
                            type: 'text'
                          },
                          {
                            key: 'productName',
                            header: 'Product Name',
                            type: 'text'
                          },
                          {
                            key: 'totalQuantity',
                            header: 'Total Quantity',
                            type: 'text'
                          },
                          {
                            key: 'unitPrice',
                            header: 'Unit Price',
                            type: 'currency'
                          },
                          {
                            key: 'totalValue',
                            header: 'Total Value',
                            type: 'currency'
                          }
                        ]}
                        data={(() => {
                          const productMap = new Map();
                          const filteredReturns = returns.filter(returnItem => 
                            returnFilter === 'all' || returnItem.category === returnFilter
                          );
                          
                          filteredReturns.forEach(returnItem => {
                            if (returnItem.items && Array.isArray(returnItem.items)) {
                              returnItem.items.forEach(item => {
                                const productKey = item.product || item.productId;
                                if (productMap.has(productKey)) {
                                  const existing = productMap.get(productKey);
                                  existing.totalQuantity += item.quantity;
                                  existing.totalValue += item.total;
                                } else {
                                  productMap.set(productKey, {
                                    productId: productKey,
                                    productName: item.productName,
                                    totalQuantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    totalValue: item.total
                                  });
                                }
                              });
                            }
                          });
                          return Array.from(productMap.values());
                        })()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="tracking">
            {rtoProducts.length === 0 ? (
              <Alert variant="info">
                <h5><i className="bi bi-info-circle"></i> No RTO/RPU Items Found</h5>
                <p>No RTO or RPU items found. Create returns using the RTO/RPU buttons in the Products page to see them here.</p>
              </Alert>
            ) : (
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">RTO/RPU Products</h5>
                </Card.Header>
                <Card.Body>
                  <CommonTable
                    columns={[
                      {
                        key: 'name',
                        header: 'Product/Return ID',
                        type: 'text'
                      },
                      {
                        key: 'customerName',
                        header: 'Customer',
                        type: 'text'
                      },
                      {
                        key: 'rtoStatus',
                        header: 'Type',
                        type: 'badge',
                        badgeConfig: {
                          RTO: { bg: 'warning', text: 'RTO' },
                          RPU: { bg: 'info', text: 'RPU' },
                          none: { bg: 'secondary', text: 'None' }
                        }
                      },
                      {
                        key: 'rtoQuantity',
                        header: 'Quantity',
                        type: 'text'
                      },
                      {
                        key: 'rtoReason',
                        header: 'Reason',
                        type: 'badge',
                        badgeConfig: {
                          defective: { bg: 'danger', text: 'Defective' },
                          wrong_item: { bg: 'warning', text: 'Wrong Item' },
                          damaged: { bg: 'secondary', text: 'Damaged' },
                          not_satisfied: { bg: 'info', text: 'Not Satisfied' },
                          warranty_claim: { bg: 'primary', text: 'Warranty Claim' },
                          other: { bg: 'light', text: 'Other' }
                        }
                      },
                      {
                        key: 'price',
                        header: 'Amount',
                        type: 'currency'
                      },
                      {
                        key: 'rtoDate',
                        header: 'Date',
                        type: 'date'
                      }
                    ]}
                    data={rtoProducts}
                    renderCell={(item, column) => {
                      if (column.key === 'name') {
                        return item.returnId ? `${item.returnId} - ${item.name}` : item.name;
                      }
                      if (column.key === 'rtoDate' && item.rtoDate) {
                        return new Date(item.rtoDate).toLocaleDateString();
                      }
                      return null;
                    }}
                  />
                </Card.Body>
              </Card>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </StyledContainer>
  );
};

export default Returns;