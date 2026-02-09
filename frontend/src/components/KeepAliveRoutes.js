import React, { useRef } from 'react';
import { useLocation, useRoutes, Navigate } from 'react-router-dom';

const KeepAliveRoutes = ({ routes }) => {
  const location = useLocation();
  const element = useRoutes(routes, location);
  const cacheRef = useRef(new Map());

  const isNavigate = element && element.type === Navigate;

  if (element && !isNavigate && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, element);
  }

  return (
    <>
      {Array.from(cacheRef.current.entries()).map(([path, cachedElement]) => (
        <div
          key={path}
          style={{ display: path === location.pathname ? 'block' : 'none' }}
        >
          {cachedElement}
        </div>
      ))}
      {isNavigate ? element : null}
    </>
  );
};

export default KeepAliveRoutes;
