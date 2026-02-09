"use client";

import { useState, useEffect, useCallback } from "react";
import PurchaseOrder from "../pages/PurchaseOrder";
import { vendorsAPI } from "../services/api";
import { productsAPI } from "../services/api";
import { socket } from "../services/socket";

export default function Purchases() {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleDataChange = () => {
      fetchData();
    };

    socket.on('products:changed', handleDataChange);
    socket.on('inventory:changed', handleDataChange);

    return () => {
      socket.off('products:changed', handleDataChange);
      socket.off('inventory:changed', handleDataChange);
    };
  }, [fetchData]);

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