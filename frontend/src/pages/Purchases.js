"use client";

import { useState, useEffect } from "react";
import PurchaseOrder from "../pages/PurchaseOrder";
import { vendorsAPI } from "../services/api";
import { productsAPI } from "../services/api";

export default function Purchases() {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch vendors from your API
        const vendorsResponse = await vendorsAPI.getAll();
        setVendors(vendorsResponse.data);
        
        // Fetch products (items) from your API
        const productsResponse = await productsAPI.getAll();
        setItems(productsResponse.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#555'
      }}>
        Loading purchase data...
      </div>
    );
  }

  return (
    <div>
      <PurchaseOrder vendors={vendors} items={items} />
    </div>
  );
}