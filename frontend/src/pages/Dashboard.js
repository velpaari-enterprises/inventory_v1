import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { productsAPI, purchasesAPI, salesAPI } from '../services/api';

// Theme Colors - Premium Gold & Black
const THEME = {
  gold: '#D4AF37',
  richGold: '#C9A227',
  softGold: '#E2C878',
  lightGold: '#F4E3B2',
  black: '#000000',
  charcoal: '#1A1A1A',
  softCharcoal: '#2C2C2C',
  white: '#FFFFFF',
  offWhite: '#F8F5F0'
};

// Animations - Made slightly sharper and less "bouncy" to match the professional look
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const progressBar = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

// --- Premium Gold & Black Color Palette ---
// Primary Gold: #D4AF37
// Rich Gold: #C9A227
// Light Gold: #F4E3B2
// Charcoal: #1A1A1A
// Off-White: #F8F5F0

const DashboardContainer = styled.div`
  padding: 2.5rem;
  background-color: rgba(248, 245, 240, 0.85);
  min-height: 100vh;
  color: ${THEME.charcoal};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  animation: ${fadeIn} 0.4s ease-out;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const DashboardHeader = styled.div`
  margin-bottom: 2.5rem;
  
  h2 {
    color: #101828;
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.02em;
    /* Removed the gradient underline for a cleaner look */
  }
  
  p {
    color: #667085;
    font-size: 1rem;
    margin-top: 0.5rem;
    font-weight: 400;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #EAECF0; /* Key change: Border over Shadow */
  border-radius: 12px;
  padding: 1.5rem;
  /* Very subtle shadow for depth, not decoration */
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  display: flex;
  flex-direction: column; /* Aligned vertically like the "Total Customers" card in image */
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.5s ease-out;
  
  &:hover {
    border-color: #D0D5DD;
    box-shadow: 0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08);
  }
  
  ${props => props.highlight && css`
    border-left: 4px solid #101828; /* Changed from bright red to theme dark */
  `}
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  border: 1px solid #EAECF0;
  
  /* Changed from Gradients to Subtle Pastel Backgrounds with Strong Text Color */
  ${props => {
    switch(props.variant) {
      case 'products': return css`background: #F0F9FF; color: #026AA2;`; // Light Blue
      case 'purchases': return css`background: #F9F5FF; color: #6941C6;`; // Light Purple
      case 'sales': return css`background: #ECFDF3; color: #027A48;`; // Light Green
      case 'lowstock': return css`background: #FEF3F2; color: #B42318;`; // Light Red
      default: return css`background: #F2F4F7; color: #344054;`; // Gray
    }
  }}
`;

const StatContent = styled.div`
  width: 100%;
`;

const StatValue = styled.h3`
  margin: 0.5rem 0 0;
  font-size: 2.25rem; /* Larger, bolder numbers like in the image */
  font-weight: 600;
  color: #101828;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.p`
  margin: 0;
  color: #667085;
  font-size: 0.875rem;
  font-weight: 500;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const DashboardCard = styled.div`
  background: white;
  border: 1px solid #EAECF0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  animation: ${slideIn} 0.5s ease-out;
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #EAECF0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: #101828;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const ViewAllLink = styled.a`
  color: #667085;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    color: #101828;
  }
`;

const CardBody = styled.div`
  padding: 0; /* Removed padding to allow table to go edge-to-edge */
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  thead {
    background: #F9FAFB;
  }
  
  th {
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-weight: 500;
    color: #667085;
    font-size: 0.75rem;
    text-transform: uppercase; /* Matches the clean header style */
    border-bottom: 1px solid #EAECF0;
  }
  
  tbody tr {
    transition: all 0.2s ease;
    
    &:hover {
      background: #F9FAFB;
    }
    
    &:last-child td {
      border-bottom: none;
    }
  }
  
  td {
    padding: 1rem 1.5rem;
    color: #101828;
    font-size: 0.875rem;
    border-bottom: 1px solid #EAECF0;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  
  /* Modern "Pill" style: Light background, Dark text, mix-blend border */
  ${props => {
    switch(props.variant) {
      case 'low': return css`
        background: #FEF3F2;
        color: #B42318;
        border: 1px solid #FECDCA;
      `;
      case 'medium': return css`
        background: #FFFAEB;
        color: #B54708;
        border: 1px solid #FEDF89;
      `;
      case 'high': return css`
        background: #ECFDF3;
        color: #027A48;
        border: 1px solid #A6F4C5;
      `;
      default: return css`
        background: #F2F4F7;
        color: #344054;
        border: 1px solid #E4E7EC;
      `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #667085;
  
  i {
    font-size: 2rem;
    margin-bottom: 1rem;
    display: block;
    color: #98A2B3;
  }
  
  p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  
  &::after {
    content: '';
    width: 24px;
    height: 24px;
    border: 3px solid #F2F4F7;
    border-top: 3px solid #101828;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #F2F4F7;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.75rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #101828; /* Solid dark color instead of gradient */
  border-radius: 4px;
  animation: ${progressBar} 1s ease-out;
  width: ${props => props.percentage}%;
`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPurchases: 0,
    totalSales: 0,
    lowStockCount: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          productsRes,
          lowStockRes,
          purchasesRes,
          salesRes
        ] = await Promise.all([
          productsAPI.getAll(),
          productsAPI.getLowStock(),
          purchasesAPI.getAll(),
          salesAPI.getAll()
        ]);

        setStats({
          totalProducts: productsRes.data.length,
          totalPurchases: purchasesRes.data.length,
          totalSales: salesRes.data.length,
          lowStockCount: lowStockRes.data.length
        });

        setLowStockProducts(lowStockRes.data.slice(0, 5));
        setRecentPurchases(purchasesRes.data.slice(0, 5));
        setRecentSales(salesRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStockStatus = (quantity) => {
    if (quantity <= 10) return 'low';
    if (quantity <= 25) return 'medium';
    return 'high';
  };

  const  formatCurrency = (amount)=>{
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h2>Dashboard</h2>
        <p>Welcome to your Inventory Management System</p>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon variant="products">
            <i className="bi bi-box"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalProducts}</StatValue>
            <StatLabel>Total Products</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalProducts / 100) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon variant="purchases">
            <i className="bi bi-cart-plus"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalPurchases}</StatValue>
            <StatLabel>Total Purchases</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalPurchases / 50) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon variant="sales">
            <i className="bi bi-cart-check"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalSales}</StatValue>
            <StatLabel>Total Sales</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalSales / 50) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard highlight={stats.lowStockCount > 0}>
          <StatIcon variant="lowstock">
            <i className="bi bi-exclamation-triangle"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.lowStockCount}</StatValue>
            <StatLabel>Low Stock Items</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.lowStockCount / 10) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <DashboardGrid>
        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-exclamation-triangle"></i> Low Stock Products</h3>
            <ViewAllLink href="/products">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {lowStockProducts.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <StatusBadge variant={getStockStatus(product.quantity)}>
                          {getStockStatus(product.quantity).toUpperCase()}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-check-circle"></i>
                <p>No low stock products</p>
                <small>All products are well stocked</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-cart-plus"></i> Recent Purchases</h3>
            <ViewAllLink href="/purchases">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {recentPurchases.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map(purchase => (
                    <tr key={purchase._id}>
                      <td>{purchase.vendor?.name || 'Unknown Vendor'}</td>
                      <td>{formatCurrency(purchase.totalAmount)}</td>
                      <td>{new Date(purchase.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-cart"></i>
                <p>No recent purchases</p>
                <small>Purchases will appear here</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-cart-check"></i> Recent Sales</h3>
            <ViewAllLink href="/sales">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {recentSales.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale._id}>
                      <td>{sale.buyer?.name || 'Unknown Buyer'}</td>
                      <td>{formatCurrency(sale.totalAmount)}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-receipt"></i>
                <p>No recent sales</p>
                <small>Sales will appear here</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default Dashboard;