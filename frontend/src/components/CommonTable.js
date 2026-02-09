import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import styled from 'styled-components';

const StyledTable = styled(Table)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  
  thead {
    background: #D4AF37;
    
    th {
      color: #000;
      border: none;
      padding: 1.2rem;
      font-weight: 600;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f8f9fa;
    }
    
    td {
      padding: 1rem;
      border-color: #e9ecef;
      vertical-align: middle;
    }
  }
`;

const CommonTable = ({ 
  columns, 
  data, 
  renderCell, 
  onRowClick,
  className = "",
  ...props 
}) => {
  const defaultRenderCell = (item, column) => {
    const value = item[column.key];
    
    // Handle different data types
    if (column.type === 'badge') {
      const badgeConfig = column.badgeConfig || {};
      const bg = badgeConfig[value]?.bg || 'secondary';
      const text = badgeConfig[value]?.text || String(value || '');
      return <Badge bg={bg}>{text}</Badge>;
    }
    
    if (column.type === 'currency') {
      return <strong className="text-success">${parseFloat(value || 0).toFixed(2)}</strong>;
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'actions') {
      return (
        <div className="d-flex gap-1">
          {column.actions?.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant || 'outline-primary'}
              onClick={() => action.onClick(item)}
              title={action.title}
            >
              {action.icon} {action.label}
            </Button>
          ))}
        </div>
      );
    }
    
    if (column.type === 'object') {
      return String(value?.[column.objectKey] || '-');
    }
    
    return String(value || '-');
  };

  return (
    <StyledTable responsive hover className={className} {...props}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index} style={column.headerStyle}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, rowIndex) => (
          <tr 
            key={item._id || item.id || rowIndex}
            onClick={() => onRowClick && onRowClick(item)}
            style={onRowClick ? { cursor: 'pointer' } : {}}
          >
            {columns.map((column, colIndex) => (
              <td key={colIndex} style={column.cellStyle}>
                {renderCell ? renderCell(item, column, rowIndex) : defaultRenderCell(item, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};

export default CommonTable;